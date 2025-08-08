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
    const users = Array.from(this.users.values());
    return users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: nanoid(),
      username: insertUser.username,
      password: insertUser.password,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const document: Document = {
      id: nanoid(),
      userId: insertDocument.userId || null,
      filename: insertDocument.filename,
      originalName: insertDocument.originalName,
      fileSize: insertDocument.fileSize,
      mimeType: insertDocument.mimeType,
      extractedText: insertDocument.extractedText || null,
      isProcessed: false,
      uploadedAt: new Date(),
      processedAt: null,
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
      .sort((a, b) => {
        const aTime = a.uploadedAt?.getTime() || 0;
        const bTime = b.uploadedAt?.getTime() || 0;
        return bTime - aTime;
      });
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
      userId: insertQuery.userId || null,
      queryText: insertQuery.queryText,
      structuredData: insertQuery.structuredData || null,
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
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, 10);
    return userQueries;
  }

  async createQueryResult(insertResult: InsertQueryResult): Promise<QueryResult> {
    const result: QueryResult = {
      id: nanoid(),
      queryId: insertResult.queryId || null,
      decision: insertResult.decision,
      amount: insertResult.amount || null,
      deductible: insertResult.deductible || null,
      justification: insertResult.justification || null,
      confidenceScore: insertResult.confidenceScore || null,
      processingTimeMs: insertResult.processingTimeMs || null,
      createdAt: new Date(),
    };
    this.queryResults.set(result.id, result);
    return result;
  }

  async getQueryResult(queryId: string): Promise<QueryResult | undefined> {
    const results = Array.from(this.queryResults.values());
    return results.find(result => result.queryId === queryId);
  }

  async createDocumentClause(insertClause: InsertDocumentClause): Promise<DocumentClause> {
    const clause: DocumentClause = {
      id: nanoid(),
      documentId: insertClause.documentId || null,
      clauseText: insertClause.clauseText,
      section: insertClause.section || null,
      clauseNumber: insertClause.clauseNumber || null,
      embedding: insertClause.embedding || null,
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
