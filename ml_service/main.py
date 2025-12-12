from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from typing import List
import random

app = FastAPI()

class Box(BaseModel):
    x: int
    y: int
    w: int
    h: int

class Face(BaseModel):
    box: Box
    face_id: str
    person_id: str | None = None

class ProcessingResult(BaseModel):
    filename: str
    faces: List[Face]

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/process-image", response_model=ProcessingResult)
async def process_image(file: UploadFile = File(...)):
    # Mock implementation
    # Randomly detect 0-3 faces
    faces = []
    num_faces = random.randint(0, 3)
    for i in range(num_faces):
        faces.append(Face(
            box=Box(x=random.randint(0, 100), y=random.randint(0, 100), w=50, h=50),
            face_id=f"face_{random.randint(1000, 9999)}",
            person_id=f"person_{random.randint(1, 10)}" if random.random() > 0.5 else None
        ))
    
    return ProcessingResult(filename=file.filename, faces=faces)
