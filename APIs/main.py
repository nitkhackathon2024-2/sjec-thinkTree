from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pypdf import PdfReader
import json
import os
import shutil
import requests

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allow your frontend's origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# File path for storing visible nodes
DATA_FILE = 'node_history.json'

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

        if file.filename.endswith(".pdf"):
        # raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
            # Extract text from the uploaded PDF file
            pdf_text = extract_text_from_pdf(file)  
            # You can now use pdf_text in your logic
            # print(f"PDF content: {pdf_text} i was here")   
            # Make another POST request to '/somewhere/' with the PDF text
            response = requests.post('http://localhost:8000/somewhere/', json={"pdf_content": pdf_text})    
            # Check if the request was successful
            if response.status_code == 200:
                return JSONResponse(content={"message": "PDF uploaded and forwarded successfully"}, status_code=200)
            else:
                return JSONResponse(content={"message": "Failed to forward data"}, status_code=response.status_code)
    

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
