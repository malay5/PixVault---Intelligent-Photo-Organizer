import asyncio
import aiohttp
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
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

# Background Tasks
async def process_ai_task(picture_id: str, filename: str):
    print(f"Processing AI for {picture_id}")
    await asyncio.sleep(2) # Simulate processing
    
    is_ai = "generated" in filename.lower()
    
    # Callback to Backend
    async with aiohttp.ClientSession() as session:
        try:
            await session.post(
                f"http://localhost:5000/api/upload/callback/ai",
                json={"picture_id": picture_id, "is_ai": is_ai}
            )
            print(f"AI Callback sent for {picture_id}")
        except Exception as e:
            print(f"Failed to send AI callback: {e}")

async def process_faces_task(picture_id: str, filename: str):
    print(f"Processing Faces for {picture_id}")
    await asyncio.sleep(3) # Simulate processing
    
    # Randomly detect 2-5 faces as requested
    faces = []
    num_faces = random.randint(2, 5)
    for i in range(num_faces):
        faces.append({
            "box": {"x": random.randint(0, 100), "y": random.randint(0, 100), "w": 50, "h": 50},
            "face_id": f"face_{random.randint(1000, 9999)}",
            "person_id": f"person_{random.randint(1, 10)}" if random.random() > 0.5 else None
        })
    
    # Callback to Backend
    async with aiohttp.ClientSession() as session:
        try:
            await session.post(
                f"http://localhost:5000/api/upload/callback/faces",
                json={"picture_id": picture_id, "faces": faces}
            )
            print(f"Face Callback sent for {picture_id}")
        except Exception as e:
            print(f"Failed to send Face callback: {e}")

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/trigger-processing")
async def trigger_processing(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    picture_id: str = Form(...)
):
    # We don't need to save the file for this dummy logic since we only use filename
    # In a real app, we would save it to disk here.
    
    background_tasks.add_task(process_ai_task, picture_id, file.filename)
    background_tasks.add_task(process_faces_task, picture_id, file.filename)
    
    return {"status": "processing_started", "message": "Background tasks triggered"}