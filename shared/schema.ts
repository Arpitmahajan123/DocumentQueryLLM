import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, decimal, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  extractedText: text("extracted_text"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  isProcessed: boolean("is_processed").default(false),
});

export const queries = pgTable("queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  queryText: text("query_text").notNull(),
  structuredData: jsonb("structured_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const queryResults = pgTable("query_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  queryId: varchar("query_id").references(() => queries.id),
  decision: text("decision").notNull(), // approved, rejected, pending
  amount: decimal("amount", { precision: 10, scale: 2 }),
  deductible: decimal("deductible", { precision: 10, scale: 2 }),
  justification: jsonb("justification"),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documentClauses = pgTable("document_clauses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => documents.id),
  clauseText: text("clause_text").notNull(),
  section: text("section"),
  clauseNumber: text("clause_number"),
  embedding: text("embedding"), // Store as JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  queries: many(queries),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  clauses: many(documentClauses),
}));

export const queriesRelations = relations(queries, ({ one, many }) => ({
  user: one(users, {
    fields: [queries.userId],
    references: [users.id],
  }),
  results: many(queryResults),
}));

export const queryResultsRelations = relations(queryResults, ({ one }) => ({
  query: one(queries, {
    fields: [queryResults.queryId],
    references: [queries.id],
  }),
}));

export const documentClausesRelations = relations(documentClauses, ({ one }) => ({
  document: one(documents, {
    fields: [documentClauses.documentId],
    references: [documents.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
  processedAt: true,
  isProcessed: true,
});

export const insertQuerySchema = createInsertSchema(queries).omit({
  id: true,
  createdAt: true,
});

export const insertQueryResultSchema = createInsertSchema(queryResults).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentClauseSchema = createInsertSchema(documentClauses).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Query = typeof queries.$inferSelect;
export type InsertQuery = z.infer<typeof insertQuerySchema>;

export type QueryResult = typeof queryResults.$inferSelect;
export type InsertQueryResult = z.infer<typeof insertQueryResultSchema>;

export type DocumentClause = typeof documentClauses.$inferSelect;
export type InsertDocumentClause = z.infer<typeof insertDocumentClauseSchema>;

// Query processing types
export interface StructuredQuery {
  age?: number;
  gender?: string;
  procedure?: string;
  location?: string;
  policyDuration?: number;
  policyDurationUnit?: string;
  preExistingConditions?: string[];
  additionalInfo?: string;
}

export interface DecisionJustification {
  criterion: string;
  status: 'met' | 'not_met' | 'unclear';
  sourceClause: string;
  description: string;
  documentId?: string;
}

export interface ProcessingResult {
  decision: 'approved' | 'rejected' | 'pending';
  amount?: number;
  deductible?: number;
  coverageDetails: {
    procedure?: string;
    location?: string;
    patientAge?: number;
    policyDurationMonths?: number;
  };
  justification: DecisionJustification[];
  confidenceScore: number;
  processingTimeMs: number;
}
