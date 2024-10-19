import { sql } from 'drizzle-orm';
import { db } from './db/index'


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
console.log(nodes)
