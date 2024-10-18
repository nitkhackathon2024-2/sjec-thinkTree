import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import { db } from "@/db";
import { chunk } from 'llm-chunk'
import pdf from "pdf-parse-new"
import { chunksTable, documentsTable } from "@/db/schema";
import { embed } from "@/ollama/ollama";

export async function POST(request: NextRequest) {
	if (file) {
		const savePath = `./uploads/${file.name}`;

		const parsedPdf = pdf(file);
		const chunks = chunk(parsedPdf.text, { splitter: 'paragraph' });

		const insertedDocument = await db.insert(documentsTable).values({
			source: file.name || 'Unknown PDF',
			description: 'PDF uploaded and processed',
		}).returning();

		const documentId = insertedDocument[0].id;
		const embeddingPromises = chunks.map(async (chunkText, index) => {
			const embedding = await embed(chunkText);

			await db.insert(chunksTable).values({
				documentId,
				chunkIndex: index,
				content: chunkText,
				embedding: embedding.embeddings[0]
			});
		});

		await Promise.all(embeddingPromises)
	}

	return NextResponse.json({ status: 201 });
}
