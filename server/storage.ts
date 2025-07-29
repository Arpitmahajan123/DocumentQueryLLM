import { users, documents, queries, queryResults, documentClauses } from "@shared/schema";
import { type User, type InsertUser, type Document, type InsertDocument, type Query, type InsertQuery, type QueryResult, type InsertQueryResult, type DocumentClause, type InsertDocumentClause } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Document methods
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getUserDocuments(userId: string): Promise<Document[]>;
  updateDocumentText(id: string, extractedText: string): Promise<void>;
  markDocumentProcessed(id: string): Promise<void>;

  // Query methods
  createQuery(query: InsertQuery): Promise<Query>;
  getQuery(id: string): Promise<Query | undefined>;
  getUserQueries(userId: string): Promise<Query[]>;

  // Query result methods
  createQueryResult(result: InsertQueryResult): Promise<QueryResult>;
  getQueryResult(queryId: string): Promise<QueryResult | undefined>;

  // Document clause methods
  createDocumentClause(clause: InsertDocumentClause): Promise<DocumentClause>;
  getDocumentClauses(documentId: string): Promise<DocumentClause[]>;
  getAllClauses(): Promise<DocumentClause[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.uploadedAt));
  }

  async updateDocumentText(id: string, extractedText: string): Promise<void> {
    await db
      .update(documents)
      .set({ 
        extractedText,
        processedAt: new Date()
      })
      .where(eq(documents.id, id));
  }

  async markDocumentProcessed(id: string): Promise<void> {
    await db
      .update(documents)
      .set({ 
        isProcessed: true,
        processedAt: new Date()
      })
      .where(eq(documents.id, id));
  }

  async createQuery(insertQuery: InsertQuery): Promise<Query> {
    const [query] = await db
      .insert(queries)
      .values(insertQuery)
      .returning();
    return query;
  }

  async getQuery(id: string): Promise<Query | undefined> {
    const [query] = await db.select().from(queries).where(eq(queries.id, id));
    return query || undefined;
  }

  async getUserQueries(userId: string): Promise<Query[]> {
    return await db
      .select()
      .from(queries)
      .where(eq(queries.userId, userId))
      .orderBy(desc(queries.createdAt))
      .limit(10);
  }

  async createQueryResult(insertResult: InsertQueryResult): Promise<QueryResult> {
    const [result] = await db
      .insert(queryResults)
      .values(insertResult)
      .returning();
    return result;
  }

  async getQueryResult(queryId: string): Promise<QueryResult | undefined> {
    const [result] = await db.select().from(queryResults).where(eq(queryResults.queryId, queryId));
    return result || undefined;
  }

  async createDocumentClause(insertClause: InsertDocumentClause): Promise<DocumentClause> {
    const [clause] = await db
      .insert(documentClauses)
      .values(insertClause)
      .returning();
    return clause;
  }

  async getDocumentClauses(documentId: string): Promise<DocumentClause[]> {
    return await db
      .select()
      .from(documentClauses)
      .where(eq(documentClauses.documentId, documentId));
  }

  async getAllClauses(): Promise<DocumentClause[]> {
    return await db.select().from(documentClauses);
  }
}

export const storage = new DatabaseStorage();
