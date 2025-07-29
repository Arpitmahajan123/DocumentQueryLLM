import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { documentAnalyzer } from "./services/documentAnalyzer";
import { insertDocumentSchema, insertQuerySchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create demo user on startup
  let DEMO_USER_ID = "demo-user-123";
  
  // Initialize demo user
  const initDemoUser = async () => {
    try {
      let user = await storage.getUserByUsername("demo-user");
      if (!user) {
        user = await storage.createUser({
          username: "demo-user",
          password: "demo-pass"
        });
        console.log("Demo user created:", user.id);
      }
      DEMO_USER_ID = user.id;
    } catch (error) {
      console.error("Error initializing demo user:", error);
    }
  };
  
  await initDemoUser();

  // Upload document endpoint
  app.post("/api/documents/upload", upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const documentData = {
        userId: DEMO_USER_ID,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        extractedText: null
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);

      // Process document asynchronously
      setTimeout(async () => {
        try {
          await documentAnalyzer.processDocument(document.id);
        } catch (error) {
          console.error("Background document processing failed:", error);
        }
      }, 1000);

      res.json({ 
        success: true, 
        document: {
          id: document.id,
          originalName: document.originalName,
          fileSize: document.fileSize,
          uploadedAt: document.uploadedAt,
          isProcessed: document.isProcessed
        }
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Get user documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getUserDocuments(DEMO_USER_ID);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // In production, you'd actually delete the file and database record
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Process natural language query
  app.post("/api/queries/process", async (req, res) => {
    try {
      const { queryText } = req.body;
      
      if (!queryText || typeof queryText !== 'string') {
        return res.status(400).json({ error: "Query text is required" });
      }

      const result = await documentAnalyzer.analyzeQuery(queryText, DEMO_USER_ID);
      
      res.json({
        success: true,
        result
      });
    } catch (error) {
      console.error("Query processing error:", error);
      res.status(500).json({ error: "Failed to process query" });
    }
  });

  // Get query history
  app.get("/api/queries/history", async (req, res) => {
    try {
      const history = await documentAnalyzer.getQueryHistory(DEMO_USER_ID);
      res.json(history);
    } catch (error) {
      console.error("Error fetching query history:", error);
      res.status(500).json({ error: "Failed to fetch query history" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
