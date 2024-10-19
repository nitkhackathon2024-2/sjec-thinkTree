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
import ollama, asyncpg, os

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
    # On startup: Establish the database connection
    try:
        db_connection = await asyncpg.connect(DATABASE_URL)
        print("Database connection established")
    except Exception as e:
        print(f"Failed to connect to the database: {e}")
        db_connection = None
    yield  # The application runs while this context is active
    # On shutdown: Close the database connection
    if db_connection:
        await db_connection.close()
        print("Database connection closed")
# Create the FastAPI app using the lifespan manager
app = FastAPI(lifespan=lifespan)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allow your frontend's origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

def extract_text_from_pdf(file: UploadFile):
    try:
        # Read the file content
        reader = PdfReader(file.file)
        text = ""
        # Extract text from each page
        for page in reader.pages:
            text += page.extract_text()

        return text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting text from PDF: {str(e)}")
def get_chunks(pdf_file_path):
    max_characters = 1000
    text = ""
    splitter = TextSplitter(max_characters, trim=False)
    
    # Read PDF content
    reader = PdfReader(pdf_file_path)
    for page in reader.pages:
        text += page.extract_text()
    
    # Chunking
    chunks = splitter.chunks(text)
    return chunks
# Save document metadata and chunks with embeddings into the database
async def save_to_db(chunks, file_name, description):
    try:
        global db_connection
        # Insert into documents table
        document_id = await db_connection.fetchval("""
            INSERT INTO documents (source, description) 
            VALUES ($1, $2) 
            RETURNING id
        """, file_name, description)
        
        # Insert each chunk with its embedding into the chunks table
        for idx, (chunk) in enumerate(zip(chunks)):
            await db_connection.execute("""
                INSERT INTO chunks (document_id, chunk_index, content, ) 
                VALUES ($1, $2, $3, $4)
            """, document_id, idx, chunk)
    except Exception as e:
        print(f"Error during database operation: {str(e)}")
# Pydantic model for the node
class Node(BaseModel):
    id: int
    name: str
    text: str
    link: str

# Initialize the JSON file if it doesn't exist
def initialize_json():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w') as f:
            json.dump([], f)

# Load nodes from the JSON file
def load_nodes():
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

# Save nodes to the JSON file
def save_nodes(nodes):
    with open(DATA_FILE, 'w') as f:
        json.dump(nodes, f)

# Get request to retrieve stored nodes
@app.get("/nodes")
def get_visible_nodes():
    initialize_json()
    nodes = load_nodes()
    if not nodes:
        return {"message": "No nodes visible yet"}
    return {"nodes": nodes}

# Post request to add a new node to the JSON file
@app.post("/nodes")
def add_visible_node(node: Node):
    initialize_json()
    nodes = load_nodes()

    # Check if node is already in the file
    if any(n["id"] == node.id for n in nodes):
        raise HTTPException(status_code=400, detail="Node already exists")

    nodes.append(node.dict())
    save_nodes(nodes)
    return {"message": "Node added", "nodes": nodes}

UPLOAD_DIRECTORY = "./uploads"

# Ensure the directory exists
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

# In-memory storage for file metadata (you can use a database instead)
uploaded_files = []

# POST: Handle file upload

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_location = f"{UPLOAD_DIRECTORY}/{file.filename}"
        
        # Save the file to the upload directory
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Store metadata in the uploaded_files list (e.g., ID and file name)
        file_metadata = {"id": len(uploaded_files) + 1, "name": file.filename}
        uploaded_files.append(file_metadata)
        # Read the content of the uploaded text file
        chuncks = get_chunks(file_location)
        await save_to_db(chuncks,  file.filename, "PDF document")
        return("Successful")
    

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")


# GET: Retrieve the list of uploaded files
@app.get("/files", response_model=List[dict])
async def get_files():
    if not uploaded_files:
        return JSONResponse(content={"files": []}, status_code=200)
    return JSONResponse(content={"files": uploaded_files}, status_code=200)
@app.post("/somewhere/")
async def handle_data(data: dict):
    file_content = data.get("file_content", "")
    # Do something with the file_content, such as storing it in a database or processing it
    print(f"Received file content at /somewhere/: {file_content}")
    
    return JSONResponse(content={"message": "Data received and processed"}, status_code=200)
