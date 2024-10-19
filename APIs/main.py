from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import json
import os

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
