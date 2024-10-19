import ForceGraph from "../components/forcegraph"
import { db } from '@/db/index'
import { sql } from 'drizzle-orm';

export default async function Home() {
  const linkQuery = sql`
  WITH similar_chunks AS (
    SELECT 
      c1.id AS source_id,
      c2.id AS target_id,
      c1.content AS source_content,
      c2.content AS target_content,
      d1.source AS source_document,
      d2.source AS target_document,
      c1.chunk_index AS source_index,
      c2.chunk_index AS target_index
    FROM chunks c1
    JOIN chunks c2 ON c1.id <> c2.id
    JOIN documents d1 ON c1.document_id = d1.id
    JOIN documents d2 ON c2.document_id = d2.id
    ORDER BY c1.embedding <-> c2.embedding -- Cosine similarity
  )
  SELECT 
    source_id, 
    source_content,
    target_id, 
    target_content
  FROM similar_chunks
`;

  const links = await db.execute(linkQuery);

  const nodesQuery = sql`
  WITH similar_chunks AS (
    SELECT 
      c1.id AS chunk_id,
      c1.content AS chunk_content,
      d1.source AS source_name
    FROM chunks c1
    JOIN chunks c2 ON c1.id <> c2.id
    JOIN documents d1 ON c1.document_id = d1.id
    ORDER BY c1.embedding <-> c2.embedding -- Cosine similarity
  )
  SELECT DISTINCT
    chunk_id AS id, 
    source_name AS name,
    chunk_content AS text
  FROM similar_chunks
`;

  // Execute the query using your database connection
  const nodes = await db.execute(nodesQuery);

  const data = {
    nodes: nodes.rows.map(row => ({ id: row.id, name: row.name, text: row.text, link: '' })),
    links: links.rows.map(row => ({ source: row.source_id, target: row.target_id }))
  };

  return (
    <>
      <div>
        <ForceGraph data={data} />
        {/* <FileUploadSection/> */}


      </div>
      {/* <div className="w-1/2 flex flex-col border-r border-gray-700 py-4 space-y-4">
        <Documents />
      </div>
      <KnowledgeGraph /> */}

    </>
  );
}
