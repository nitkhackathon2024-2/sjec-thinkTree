import { promises as fs } from 'fs';
import { db } from "@/db";
import { chunk } from 'llm-chunk'
import pdf from "pdf-parse-new"
import { chunksTable, documentsTable } from "@/db/schema";
import { embed } from "@/ollama/ollama";

const FileUploadForm = () => {
  const upload = async (data: FormData) => {
    'use server'

    console.log(data.get('file'))
  };

  return (
    <div className="max-w-xl">
      <form className="space-y-3" action={upload}>
        <div>
          <label htmlFor="file" className="block mb-2">Upload PDF:</label>
          <input
            type="file"
            accept="application/pdf"
            className="border p-2 w-full"
            name='file'
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

export default FileUploadForm;
