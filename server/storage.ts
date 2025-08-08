import { type User, type InsertUser, type Document, type InsertDocument, type Query, type InsertQuery, type QueryResult, type InsertQueryResult, type DocumentClause, type InsertDocumentClause } from "@shared/schema";
import { nanoid } from "nanoid";

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

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private documents = new Map<string, Document>();
  private queries = new Map<string, Query>();
  private queryResults = new Map<string, QueryResult>();
  private documentClauses = new Map<string, DocumentClause>();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: nanoid(),
      username: insertUser.username,
      passwordHash: insertUser.passwordHash,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const document: Document = {
      id: nanoid(),
      userId: insertDocument.userId,
      originalName: insertDocument.originalName,
      fileSize: insertDocument.fileSize,
      extractedText: insertDocument.extractedText,
      isProcessed: insertDocument.isProcessed ?? false,
      uploadedAt: new Date(),
      processedAt: insertDocument.processedAt,
    };
    this.documents.set(document.id, document);
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    const userDocs = Array.from(this.documents.values())
      .filter(doc => doc.userId === userId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    return userDocs;
  }

  async updateDocumentText(id: string, extractedText: string): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      document.extractedText = extractedText;
      document.processedAt = new Date();
    }
  }

  async markDocumentProcessed(id: string): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      document.isProcessed = true;
      document.processedAt = new Date();
    }
  }

  async createQuery(insertQuery: InsertQuery): Promise<Query> {
    const query: Query = {
      id: nanoid(),
      userId: insertQuery.userId,
      queryText: insertQuery.queryText,
      structuredData: insertQuery.structuredData,
      createdAt: new Date(),
    };
    this.queries.set(query.id, query);
    return query;
  }

  async getQuery(id: string): Promise<Query | undefined> {
    return this.queries.get(id);
  }

  async getUserQueries(userId: string): Promise<Query[]> {
    const userQueries = Array.from(this.queries.values())
      .filter(query => query.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
    return userQueries;
  }

  async createQueryResult(insertResult: InsertQueryResult): Promise<QueryResult> {
    const result: QueryResult = {
      id: nanoid(),
      queryId: insertResult.queryId,
      decision: insertResult.decision,
      amount: insertResult.amount,
      deductible: insertResult.deductible,
      justification: insertResult.justification,
      confidenceScore: insertResult.confidenceScore,
      processingTimeMs: insertResult.processingTimeMs,
      createdAt: new Date(),
    };
    this.queryResults.set(result.id, result);
    return result;
  }

  async getQueryResult(queryId: string): Promise<QueryResult | undefined> {
    for (const result of this.queryResults.values()) {
      if (result.queryId === queryId) {
        return result;
      }
    }
    return undefined;
  }

  async createDocumentClause(insertClause: InsertDocumentClause): Promise<DocumentClause> {
    const clause: DocumentClause = {
      id: nanoid(),
      documentId: insertClause.documentId,
      clauseText: insertClause.clauseText,
      clauseType: insertClause.clauseType,
      embedding: insertClause.embedding,
      createdAt: new Date(),
    };
    this.documentClauses.set(clause.id, clause);
    return clause;
  }

  async getDocumentClauses(documentId: string): Promise<DocumentClause[]> {
    return Array.from(this.documentClauses.values())
      .filter(clause => clause.documentId === documentId);
  }

  async getAllClauses(): Promise<DocumentClause[]> {
    return Array.from(this.documentClauses.values());
  }
}

export const storage = new MemStorage();
