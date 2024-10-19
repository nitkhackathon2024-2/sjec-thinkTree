from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from semantic_text_splitter import TextSplitter
from typing import List
from pathlib import Path
from pypdf import PdfReader
from dotenv import load_dotenv
import json
import os
import shutil
import requests
import ollama, asyncpg

# File path for storing visible nodes
DATA_FILE = 'node_history.json'
env_path = Path("../code/think-tree/.env")
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv('DATABASE_URL')
OLLAMA_URL = os.getenv("OLLAMA_URL")
LLM = os.getenv("LLM")

# Global variable to hold the connection
db_connection = None

async def lifespan(app: FastAPI):
    global db_connection
    try:
        db_connection = await asyncpg.connect(DATABASE_URL)
        print("Database connection established")
    except Exception as e:
        print(f"Failed to connect to the database: {e}")
        db_connection = None
    yield  # The application runs while this context is active
    if db_connection:
        await db_connection.close()
        print("Database connection closed")

# Create the FastAPI app using the lifespan manager
app = FastAPI(lifespan=lifespan)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(file: UploadFile):
    try:
        reader = PdfReader(file.file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting text from PDF: {str(e)}")

def get_chunks(pdf_file_path):
    max_characters = 1000
    text = ""
    splitter = TextSplitter(max_characters, trim=False)

    reader = PdfReader(pdf_file_path)
    for page in reader.pages:
        text += page.extract_text()

    chunks = splitter.chunks(text)
    return chunks

# Save document metadata and chunks into the database
async def save_to_db(chunks, file_name, description):
    try:
        global db_connection
        document_id = await db_connection.fetchval("""
            INSERT INTO documents (source, description) 
            VALUES ($1, $2) 
            RETURNING id
        """, file_name, description)
        
        for idx, chunk in enumerate(chunks):
            await db_connection.execute("""
                INSERT INTO chunks (document_id, chunk_index, content) 
                VALUES ($1, $2, $3)
            """, document_id, idx, chunk)  # Removed embedding from the insertion
    except Exception as e:
        print(f"Error during database operation: {str(e)}")

class Node(BaseModel):
    id: int
    name: str
    text: str
    link: str

def initialize_json():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w') as f:
            json.dump([], f)

def load_nodes():
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_nodes(nodes):
    with open(DATA_FILE, 'w') as f:
        json.dump(nodes, f)

@app.get("/nodes")
def get_visible_nodes():
    initialize_json()
    nodes = load_nodes()
    if not nodes:
        return {"message": "No nodes visible yet"}
    return {"nodes": nodes}

@app.post("/nodes")
def add_visible_node(node: Node):
    initialize_json()
    nodes = load_nodes()
    if any(n["id"] == node.id for n in nodes):
        raise HTTPException(status_code=400, detail="Node already exists")
    nodes.append(node.dict())
    save_nodes(nodes)
    return {"message": "Node added", "nodes": nodes}

UPLOAD_DIRECTORY = "./uploads"

if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

uploaded_files = []

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_location = f"{UPLOAD_DIRECTORY}/{file.filename}"
        
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_metadata = {"id": len(uploaded_files) + 1, "name": file.filename}
        uploaded_files.append(file_metadata)
        
        chunks = get_chunks(file_location)
        await save_to_db(chunks, file.filename, "PDF document")
        return {"message": "Upload successful"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.get("/files", response_model=List[dict])
async def get_files():
    if not uploaded_files:
        return JSONResponse(content={"files": []}, status_code=200)
    return JSONResponse(content={"files": uploaded_files}, status_code=200)

@app.post("/somewhere/")
async def handle_data(data: dict):
    file_content = data.get("file_content", "")
    print(f"Received file content at /somewhere/: {file_content}")
    return JSONResponse(content={"message": "Data received and processed"}, status_code=200)
