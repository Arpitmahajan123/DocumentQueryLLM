import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { storage as dbStorage } from "./storage";
import { documentAnalyzer } from "./services/documentAnalyzer";
import { insertDocumentSchema, insertQuerySchema } from "@shared/schema";
import { handleFileUpload } from "./multerConfig";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("Created uploads directory");
    } catch (err) {
      console.error("Failed to create uploads directory:", err);
    }
  }
  
  // Create demo user on startup
  let DEMO_USER_ID = "demo-user-123";  // Initialize demo user
  const initDemoUser = async () => {
    try {
      let user = await dbStorage.getUserByUsername("demo-user");
      if (!user) {
        user = await dbStorage.createUser({
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

  // Upload document endpoint - using our custom file upload handler
  app.post("/api/documents/upload", handleFileUpload('document'), async (req, res) => {
    try {
      // At this point, multer has already validated the file and attached it to req.file
      // Our custom handleFileUpload middleware ensures req.file is not undefined
      if (!req.file) {
        // This should never happen due to our middleware, but TypeScript doesn't know that
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      console.log("File uploaded successfully:", req.file);
      
      const documentData = {
        userId: DEMO_USER_ID,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype || 'application/octet-stream',
        extractedText: null
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await dbStorage.createDocument(validatedData);

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
      res.status(500).json({ error: "Failed to process uploaded document" });
    }
  });

  // Get user documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await dbStorage.getUserDocuments(DEMO_USER_ID);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const document = await dbStorage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Delete the file from the filesystem
      try {
        const filePath = path.join(process.cwd(), 'uploads', document.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (fsError) {
        console.error("Error deleting file:", fsError);
        // Continue with database deletion even if file deletion fails
      }

      // Delete the document from the database
      await dbStorage.deleteDocument(req.params.id);
      console.log(`Deleted document from database: ${req.params.id}`);

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
  
  // Document preview endpoint
  app.get("/api/documents/:id/preview", async (req, res) => {
    try {
      const document = await dbStorage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!document.isProcessed) {
        return res.status(400).json({ error: "Document is still being processed" });
      }

      const filePath = path.join(process.cwd(), 'uploads', document.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Document file not found" });
      }

      // For PDF files, serve directly
      if (document.mimeType === 'application/pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      } 
      // For other document types, serve the extracted text as HTML
      else {
        res.setHeader('Content-Type', 'text/html');
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${document.originalName}</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
                h1 { color: #333; }
                .content { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <h1>${document.originalName}</h1>
              <div class="content">${document.extractedText || 'No content available'}</div>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error("Error serving document preview:", error);
      res.status(500).json({ error: "Failed to generate document preview" });
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
