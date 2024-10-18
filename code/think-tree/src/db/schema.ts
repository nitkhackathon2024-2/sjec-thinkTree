import { index, integer, pgTable, serial, text, timestamp, varchar, vector } from "drizzle-orm/pg-core";

export const documentsTable = pgTable("documents", {
  id: serial().primaryKey(),
  source: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const chunksTable = pgTable(
  'chunks',
  {
    id: serial().primaryKey(),
    documentId: integer('document_id')
      .references(() => documentsTable.id)
      .notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    content: text().notNull(),
    embedding: vector('embedding', {
      dimensions: parseInt(process.env.EMBEDDING_DIMENSION!)
    }),
  },
  (table) => ({
    embeddingIndex: index('embeddingIndex')
      .using('hnsw', table.embedding.op('vector_cosine_ops')),
  }),
);
