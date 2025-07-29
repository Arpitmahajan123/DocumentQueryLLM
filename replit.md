# DocuMind AI - Document Processing and Query System

## Overview

DocuMind AI is a modern full-stack web application that processes insurance policy documents and answers queries about coverage eligibility. The system uses AI to extract information from uploaded documents, parse natural language queries, and provide intelligent responses based on policy terms and conditions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL
- **API Design**: RESTful API with JSON responses
- **File Upload**: Multer middleware for handling document uploads
- **AI Integration**: OpenAI GPT-4o for document analysis and query processing

### Development Environment
- **Monorepo Structure**: Shared TypeScript types and schemas
- **Hot Reloading**: Vite middleware integrated with Express for seamless development
- **Build Process**: Separate frontend (Vite) and backend (esbuild) compilation
- **Path Aliases**: Configured for clean imports across client, server, and shared code

## Key Components

### Document Processing Pipeline
1. **Upload Handler**: Multer-based file upload with validation for PDF, DOC, DOCX files
2. **Text Extraction**: PDF processor service for extracting text content
3. **AI Analysis**: OpenAI service for clause extraction and document understanding
4. **Storage**: Document metadata and extracted text stored in PostgreSQL
5. **Embedding Generation**: Vector embeddings for semantic search capabilities

### Query Processing System
1. **Natural Language Parser**: OpenAI-powered extraction of structured data from user queries
2. **Policy Matcher**: Logic to match query parameters against document clauses
3. **Decision Engine**: AI-driven coverage determination with confidence scoring
4. **Response Generator**: Structured results with justification and supporting clauses

### User Interface Components
- **Dashboard**: Main interface with document upload, query input, and results display
- **Document Upload**: Drag-and-drop file upload with progress tracking
- **Query Processor**: Natural language input with real-time processing
- **Results Display**: Formatted decision output with supporting information
- **Query History**: Historical query tracking and result review

## Data Flow

### Document Upload Flow
1. User uploads policy document via drag-and-drop interface
2. Multer validates file type and size constraints
3. File metadata stored in database with processing status
4. Background AI processing extracts text and identifies policy clauses
5. Extracted clauses stored with embeddings for semantic search
6. Document marked as processed and available for queries

### Query Processing Flow
1. User submits natural language query about coverage
2. OpenAI parses query into structured parameters (age, procedure, location, etc.)
3. System searches document clauses using semantic similarity
4. AI analyzes matching clauses against query parameters
5. Decision generated with approval/rejection status and confidence score
6. Results displayed with supporting documentation and reasoning

### Real-time Updates
- TanStack Query manages server state synchronization
- Optimistic updates for better user experience
- Error handling with toast notifications
- Loading states throughout the interface

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **openai**: GPT-4o integration for AI processing
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **drizzle-kit**: Database schema management and migrations
- **vite**: Frontend build tool and development server

### File Processing
- **multer**: File upload middleware
- **ws**: WebSocket support for Neon database connections

## Deployment Strategy

### Development Environment
- Vite development server with HMR for frontend
- Express server with tsx for backend hot reloading
- Shared TypeScript configuration for type safety
- Environment variables for database and API keys

### Production Build
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Single deployment artifact with static file serving
- Environment-based configuration for database connections

### Database Management
- Drizzle schema definitions in shared directory
- Migration files generated in `migrations/` directory
- Push-based schema updates for development
- PostgreSQL compatibility with Neon serverless hosting

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API authentication
- `NODE_ENV`: Environment-specific behavior control
- Development vs production build optimizations

The application follows modern full-stack practices with type safety throughout, efficient development workflows, and production-ready deployment strategies. The AI-powered document processing provides intelligent query responses while maintaining user-friendly interfaces and robust error handling.