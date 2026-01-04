import os
import cv2
import glob
import uuid
import hashlib
import numpy as np

def patched_lstsq(a, b, rcond=None):
    if rcond is None:
        rcond = -1 # Matches the old default behavior InsightFace expects
    return original_lstsq(a, b, rcond=rcond)

original_lstsq = np.linalg.lstsq
np.linalg.lstsq = patched_lstsq

# Patching the BitGenerator mapping for backward compatibility
if not hasattr(np.random._pickle, '__bit_generator_ctor'):
    from numpy.random._mt19937 import MT19937
    # This force-registers the internal class name that NumPy 2.x uses
    np.random._pickle.BitGenerators = {'MT19937': MT19937}

import shutil
import base64
import chromadb
from ultralytics import YOLO
from insightface.app import FaceAnalysis

import numpy.random._pickle



class FaceIdentitySystem:
    """
    Encapsulates Face Recognition and Identity Management logic.
    Uses InsightFace for embeddings and ChromaDB for vector storage.
    """

    def __init__(self, db_path="./face_db"):
        self.db_path = db_path
        # thumbnails_path removed as we send base64 now
        
        print(f"⚙️ [FaceID] Initializing InsightFace (buffalo_s)...")
        # buffalo_s is a lightweight model pack for detection + recognition
        self.recognizer = FaceAnalysis(name='buffalo_s', providers=['CPUExecutionProvider'])
        self.recognizer.prepare(ctx_id=0, det_size=(320, 320))
        # Lower threshold to find faces in the crop more aggressively
        self.recognizer.det_model.input_size = (320, 320) # Ensure size
        self.recognizer.det_thresh = 0.3
        
        # Backup recognizer for small crops/stubborn faces
        self.backup_recognizer = FaceAnalysis(name='buffalo_s', providers=['CPUExecutionProvider'])
        self.backup_recognizer.prepare(ctx_id=0, det_size=(160, 160))
        self.backup_recognizer.det_model.input_size = (160, 160)
        self.backup_recognizer.det_thresh = 0.3
        
        print(f"⚙️ [FaceID] Connecting to ChromaDB at {self.db_path}...")
        self.chroma_client = chromadb.PersistentClient(path=self.db_path)
        self.collection = self.chroma_client.get_or_create_collection(
            name="face_embeddings",
            metadata={"hnsw:space": "cosine"}
        )
        print("✅ [FaceID] System Ready.")

    def identify_face(self, face_img_crop, file_path_hash=""):
        """
        Takes a BGR image crop of a face.
        Returns: (person_id, person_name, is_new_identity)
        """
        # 1. Generate Embedding
        # InsightFace expects the full image usually, but we can pass the crop if it's large enough.
        # However, FaceAnalysis usually runs detection FIRST. 
        # Since we already ran YOLO, we can try to force embedding extraction or just run InsightFace on the crop.
        # get(img) returns list of faces. Since `face_img_crop` is just one face, we expect 1 result.
        print("faces recognizer running...")
        faces = self.recognizer.get(face_img_crop)
        print("faces recognizer ran")
        if not faces:

            # Fallback: Try with smaller detection size for small crops
            print("      [Identity] Primary detection failed. Trying backup (160x160)...")
            faces = self.backup_recognizer.get(face_img_crop)

        if not faces:
            # InsightFace detection inside the crop failed (e.g. AI face, cartoon, or blurry)
            print(f"      [Identity] InsightFace Failed (Quality Issue). Creating Unrecognized Singleton.")
            # Strategy: Trust YOLO. Create a "Unrecognized" singleton person.
            person_id = f"unrecognized_{uuid.uuid4().hex[:8]}"
            person_name = "Unknown"
            is_new = True
            
            # Encode crop to base64 for avatar
            _, buffer = cv2.imencode('.jpg', face_img_crop)
            crop_b64 = base64.b64encode(buffer).decode('utf-8')
            
            # Note: We cannot add to ChromaDB because we have no embedding.
            return person_id, person_name, is_new, crop_b64

        # Pick the most central/largest face in the crop (should be the only one)
        print("sorting faces...")
        face = sorted(faces, key=lambda x: x.bbox[2] * x.bbox[3], reverse=True)[0]
        print("sorting faces done")
        embedding = np.array(face.embedding, dtype=np.float32).tolist()

        # 2. Query ChromaDB
        print("querying chromadb...")
        try:
            results = self.collection.query(
                query_embeddings=[embedding],
                n_results=1
            )
        except Exception as e:
            print(f"      [Identity] ChromaDB Query Failed: {str(e)}")
            results = {'distances': [[1.0]], 'metadatas': [[{'person_id': 'unrecognized', 'name': 'Unknown'}]]}
        print("querying chromadb done")

        person_id = None
        person_name = "Unknown"
        distance = 1.0
        
        if results['distances'] and len(results['distances'][0]) > 0:
            distance = results['distances'][0][0]
        
        # Threshold for loop closure (0.5 is standard for cosine sim in insightface usually, verifying...)
        # Cosine distance: 0 (same) -> 2 (opposite). < 0.5 is usually a match.
        MATCH_THRESHOLD = 0.5 
        print("threshold calculating... ", distance)
        if distance < MATCH_THRESHOLD:
            # MATCH FOUND
            meta = results['metadatas'][0][0]
            person_id = meta['person_id']
            person_name = meta['name']
            is_new = False
            print(f"      [Identity] Match Found: {person_name} (Dist: {distance:.4f})")
        else:
            # NEW PERSON
            person_id = f"person_{uuid.uuid4().hex[:8]}"
            person_name = "Unknown"
            is_new = True
            print(f"      [Identity] New Person: {person_id} (Dist: {distance:.4f} > {MATCH_THRESHOLD})")
            
            # We no longer save file here. We return the crop to the caller (Backend will save).

        # 3. Save this sighting to DB to improve cluster
        # unique sighting ID
        print("saving sighting...")
        sighting_id = f"{person_id}_{uuid.uuid4().hex[:8]}"

        clean_embedding = [float(x) for x in embedding]
        print("cleaned embeddings")

        metadata = {
            "person_id": str(person_id),
            "name": str(person_name),
            "confidence": float(1.0 - distance),
            "original_hash": str(file_path_hash)
        }
        try:
            print("trying to add to chromadb...")
            self.collection.add(
                ids=[sighting_id],
                embeddings=[clean_embedding],
                metadatas=[metadata] # Note: Chroma expects a list of dicts here
            )
            print("saving sighting done")
        except Exception as e:
            print(f"❌ [Identity] Critical error during collection.add: {e}")
        
        # Encode crop to base64
        print("encoding crop to base64...")
        _, buffer = cv2.imencode('.jpg', face_img_crop)
        crop_b64 = base64.b64encode(buffer).decode('utf-8')
        print("encoding crop to base64 done")

        return person_id, person_name, is_new, crop_b64
