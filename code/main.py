from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from semantic_text_splitter import TextSplitter
from pypdf import PdfReader
import ollama, asyncpg, os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path("./think-tree/.env")
load_dotenv(dotenv_path=env_path)

# Environment variables
DATABASE_URL = os.getenv('DATABASE_URL')
OLLAMA_URL = os.getenv("OLLAMA_URL")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION"))
LLM = os.getenv("LLM")

# Global variable to hold the connection
db_connection = None

# Lifespan manager to handle startup and shutdown events
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

# Ollama embedding API endpoint
def get_embedding(text: str):
    try:
        response = ollama.embed({
            "model": EMBEDDING_MODEL,  # Use the model specified in your .env
            "text": text
        })
        embedding = response['embedding']
        
        # Ensure the embedding has the expected number of dimensions
        if len(embedding) != EMBEDDING_DIMENSION:
            raise ValueError(f"Embedding dimension mismatch. Expected {EMBEDDING_DIMENSION}, but got {len(embedding)}")
        
        return embedding

    except Exception as e:
        print(f"Error during embedding: {str(e)}")
        return None

# Method to chunk the PDF content
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
async def save_to_db(chunks, embeddings, file_name, description):
    try:
        global db_connection
        # Insert into documents table
        document_id = await db_connection.fetchval("""
            INSERT INTO documents (source, description) 
            VALUES ($1, $2) 
            RETURNING id
        """, file_name, description)
        
        # Insert each chunk with its embedding into the chunks table
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            await db_connection.execute("""
                INSERT INTO chunks (document_id, chunk_index, content, embedding) 
                VALUES ($1, $2, $3, $4)
            """, document_id, idx, chunk, embedding)

    except Exception as e:
        print(f"Error during database operation: {str(e)}")

# Upload PDF and process
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != 'application/pdf':
        return JSONResponse(content={"error": "Only PDF files are allowed"}, status_code=400)
    
    try:
        # Step 1: Save the uploaded PDF
        file_location = f"files/{file.filename}"
        with open(file_location, "wb") as pdf_file:
            pdf_file.write(await file.read())
        
        # Step 2: Extract text and create chunks
        chunks = get_chunks(file_location)

        # Step 3: Get embeddings for each chunk
        embeddings = []
        for chunk in chunks:
            embedding = get_embedding(chunk)
            if embedding:
                embeddings.append(embedding)

        # Step 4: Save document metadata and chunks with embeddings into the database
        await save_to_db(chunks, embeddings, file.filename, "PDF document")

        return {"message": "PDF uploaded and processed successfully"}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
