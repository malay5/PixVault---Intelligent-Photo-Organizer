import asyncio
import aiohttp
import cv2
import numpy as np
import joblib
import os
# import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel
from skimage.feature import local_binary_pattern
from contextlib import asynccontextmanager
import random
import requests
from ultralytics import YOLO

# --- 1. FEATURE EXTRACTOR ENGINE (The "Eyes") ---
# This class must exactly match the logic used during training.
class FeatureExtractor:
    def __init__(self, img_size=(256, 256)):
        self.img_size = img_size

    def get_fft_features(self, img):
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        f = np.fft.fft2(gray)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-9)
        h, w = magnitude_spectrum.shape
        center = (w // 2, h // 2)
        y, x = np.indices((h, w))
        r = np.sqrt((x - center[0])**2 + (y - center[1])**2).astype(int)
        tbin = np.bincount(r.ravel(), magnitude_spectrum.ravel())
        nr = np.bincount(r.ravel())
        radial_profile = tbin / (nr + 1e-9)
        return radial_profile[:60]

    def get_ela_features(self, img, quality=90):
        _, encoded_img = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
        decoded_img = cv2.imdecode(encoded_img, 1)
        ela_img = np.abs(img.astype("float32") - decoded_img.astype("float32"))
        stats = []
        for channel in cv2.split(ela_img):
            stats.extend([np.mean(channel), np.std(channel), np.max(channel)])
        return np.array(stats)

    def get_lbp_features(self, img, P=8, R=1):
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        lbp = local_binary_pattern(gray, P, R, method="uniform")
        (hist, _) = np.histogram(lbp.ravel(), bins=np.arange(0, P + 3), range=(0, P + 2))
        hist = hist.astype("float")
        hist /= (hist.sum() + 1e-7)
        return hist

    def process_image_from_bytes(self, file_bytes):
        """Converts raw bytes to features directly."""
        # Decode bytes to image
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None

        # Resize (Critical: Must match training size)
        img = cv2.resize(img, self.img_size)

        # Extract all features
        fft = self.get_fft_features(img)
        ela = self.get_ela_features(img)
        lbp = self.get_lbp_features(img)
        
        return np.concatenate([fft, ela, lbp]).reshape(1, -1)

        return np.concatenate([fft, ela, lbp]).reshape(1, -1)

# --- 1.1 Face Detector ---
class FaceDetector:
    def __init__(self):
        self.model = None
        self._download_model()
    
    def _download_model(self):
        model_name = "yolov8n-face.pt"
        # User requested specific GitHub URL
        url = "https://github.com/lindevs/yolov8-face/releases/latest/download/yolov8n-face-lindevs.pt"
        
        if os.path.exists(model_name):
            # Check if file is suspiciously small (e.g. < 1MB, model should be ~6MB)
            if os.path.getsize(model_name) < 1024 * 1024: 
                print(f"⚠️ [FaceDetector] Found corrupt/small model file ({os.path.getsize(model_name)} bytes). Deleting...")
                try: os.remove(model_name)
                except: pass

        if not os.path.exists(model_name):
            print(f"⬇️ [FaceDetector] Downloading Model from {url}...")
            try:
                headers = {'User-Agent': 'Mozilla/5.0'} 
                r = requests.get(url, headers=headers, stream=True)
                
                if r.status_code == 200:
                    with open(model_name, 'wb') as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            f.write(chunk)
                    print(f"✅ [FaceDetector] Download Complete. Size: {os.path.getsize(model_name)} bytes")
                else:
                    print(f"❌ [FaceDetector] Download failed with status {r.status_code}")
                    print(r.text[:200])
            except Exception as e:
                print(f"❌ [FaceDetector] Failed to download model: {e}")

    def load_model(self):
        try:
            if not os.path.exists("yolov8n-face.pt"):
                self._download_model()
            
            if self.model is None:
                print("🔹 [FaceDetector] Loading YOLOv8-Face Model into memory...")
                self.model = YOLO('yolov8n-face.pt')
                print("✅ [FaceDetector] Model Loaded.")
        except Exception as e:
            print(f"⚠️ [FaceDetector] Model load failed: {e}. Attempting to re-download...")
            if os.path.exists("yolov8n-face.pt"):
                os.remove("yolov8n-face.pt")
            
            self._download_model()
            try:
                self.model = YOLO('yolov8n-face.pt')
                print("✅ [FaceDetector] Model recovered and loaded.")
            except Exception as e2:
                print(f"❌ [FaceDetector] CRITICAL: Could not load model. {e2}")
                self.model = None

    def detect_faces(self, img_bytes):
        print("🔹 [FaceDetector] Detecting faces in image...")
        if self.model is None: 
            print("⚠️ [FaceDetector] Model not loaded, attempting load...")
            self.load_model()
            if self.model is None:
                print("❌ [FaceDetector] Aborting detection: Model unavailable.")
                return []
        
        # Convert bytes to cv2 image
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: 
            print("❌ [FaceDetector] Failed to decode image bytes.")
            return []

        # Predict
        results = self.model.predict(img, conf=0.25, verbose=False)
        print(f"🔹 [FaceDetector] Inference complete. Processing results...")
        
        # Format results
        faces = []
        boxes = results[0].boxes.data.cpu().numpy()
        
        print(f"🔹 [FaceDetector] Found {len(boxes)} candidate bounding boxes.")

        for i, box in enumerate(boxes):
            x1, y1, x2, y2, conf, cls = box
            w = x2 - x1
            h = y2 - y1
            
            print(f"   -> Face {i+1}: Conf={conf:.2f}, Box=[{int(x1)}, {int(y1)}, {int(w)}, {int(h)}]")

            faces.append({
                "box": {
                    "x": int(x1),
                    "y": int(y1),
                    "w": int(w),
                    "h": int(h)
                },
                "face_id": f"face_{random.randint(10000, 99999)}", 
                "person_id": None 
            })
            
        return faces

# --- 2. MODEL LOADER ---
ml_models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model on startup
    model_path = "saved_models/voting_ensemble.pkl"
    if os.path.exists(model_path):
        print(f"Loading AI Detection Model from {model_path}...")
        ml_models["ai_detector"] = joblib.load(model_path)
        ml_models["extractor"] = FeatureExtractor()
        ml_models["face_detector"] = FaceDetector()
        ml_models["face_detector"].load_model() # Preload
        print("✅ Model Loaded Successfully.")
    else:
        print("⚠️ WARNING: Model file not found. AI detection will fail.")
        ml_models["ai_detector"] = None
    yield
    # Clean up (if needed)
    ml_models.clear()

app = FastAPI(lifespan=lifespan)

# --- 3. DATA MODELS ---
class Box(BaseModel):
    x: int
    y: int
    w: int
    h: int

class Face(BaseModel):
    box: Box
    face_id: str
    person_id: str | None = None

# --- 4. BACKGROUND TASKS ---

async def process_ai_task(picture_id: str, file_bytes: bytes):
    print(f"Processing AI for {picture_id}")
    
    is_ai = False
    confidence = 0.0
    
    try:
        model = ml_models.get("ai_detector")
        extractor = ml_models.get("extractor")

        if model and extractor:
            # 1. Extract Features from bytes
            features = extractor.process_image_from_bytes(file_bytes)
            
            if features is not None:
                # 2. Predict
                prediction = model.predict(features)[0] # 0 = Real, 1 = AI
                probs = model.predict_proba(features)[0] # [Prob_Real, Prob_AI]
                
                is_ai = bool(prediction == 1)
                confidence = float(probs[1]) if is_ai else float(probs[0])
                
                print(f"🔍 Analysis Result: {'AI Generated' if is_ai else 'Real Photo'} (Confidence: {confidence:.2f})")
            else:
                print("❌ Error: Could not process image data.")
        else:
            print("❌ Error: Model not loaded.")

    except Exception as e:
        print(f"❌ Critical AI Processing Error: {e}")

    # Callback to Backend
    async with aiohttp.ClientSession() as session:
        try:
            await session.post(
                f"http://localhost:5000/api/upload/callback/ai",
                json={
                    "picture_id": picture_id, 
                    "is_ai": is_ai, 
                    "confidence": confidence
                }
            )
            print(f"✅ AI Callback sent for {picture_id}")
        except Exception as e:
            print(f"⚠️ Failed to send AI callback: {e}")

async def process_faces_task(picture_id: str, file_bytes: bytes):
    print(f"🚀 [Task] Processing Faces for {picture_id}")
    
    faces = []
    try:
        detector = ml_models.get("face_detector")
        if detector:
            faces = detector.detect_faces(file_bytes)
            print(f"✅ [Task] Detected {len(faces)} faces for {picture_id}.")
        else:
            print("⚠️ [Task] FACE DETECTOR NOT LOADED. Skipping detection.")
    except Exception as e:
        print(f"❌ [Task] Error detecting faces: {e}")
    
    async with aiohttp.ClientSession() as session:
        try:
            print(f"📡 [Task] Sending callback to Backend with {len(faces)} faces...")
            await session.post(
                f"http://localhost:5000/api/upload/callback/faces",
                json={"picture_id": picture_id, "faces": faces}
            )
            print(f"✅ [Task] Face Callback sent successfully for {picture_id}")
        except Exception as e:
            print(f"⚠️ [Task] Failed to send Face callback: {e}")

# --- 5. ENDPOINTS ---

@app.get("/")
def read_root():
    model_status = "Loaded" if ml_models.get("ai_detector") else "Not Loaded"
    return {"Status": "Running", "AI_Model": model_status}

@app.post("/trigger-processing")
async def trigger_processing(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    picture_id: str = Form(...)
):
    # READ FILE BYTES ONCE
    # We read the bytes here because UploadFile is a stream. 
    # Once the async function finishes, the stream closes.
    file_bytes = await file.read()
    
    # Pass the bytes to the background task (instead of the filename)
    # Pass the bytes to the background task (instead of the filename)
    background_tasks.add_task(process_ai_task, picture_id, file_bytes)
    # Re-use bytes for faces logic (Updated signature)
    background_tasks.add_task(process_faces_task, picture_id, file_bytes)
    
    return {"status": "processing_started", "message": "Background tasks triggered"}