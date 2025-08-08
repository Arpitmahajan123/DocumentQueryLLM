import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

export class PDFProcessor {
  /**
   * Extract text from a PDF file
   * @param filePath The path to the PDF file
   * @returns The extracted text content
   */
  async extractText(filePath: string): Promise<string> {
    try {
      console.log(`Extracting text from PDF at ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
      }
      
      // Read the file as a buffer
      const dataBuffer = fs.readFileSync(filePath);
      console.log(`File size: ${dataBuffer.length} bytes`);
      
      // Check if file is a valid PDF by checking magic number
      if (dataBuffer.length < 5 || dataBuffer.toString('ascii', 0, 5) !== '%PDF-') {
        console.error('Invalid PDF file format');
        return "Invalid PDF file format";
      }
      
      // Parse the PDF
      try {
        const data = await pdfParse(dataBuffer);
        console.log(`PDF parsed successfully. ${data.numpages} pages, text length: ${data.text.length}`);
        
        // Return the text content
        return data.text || "No text content found in PDF";
      } catch (parseError) {
        console.error('Error parsing PDF:', parseError);
        return "Error parsing PDF content";
      }
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractClauses(text: string): Promise<Array<{ clauseText: string; section?: string; clauseNumber?: string }>> {
    const clauses: Array<{ clauseText: string; section?: string; clauseNumber?: string }> = [];
    
    // Split text into sentences/paragraphs
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20); // Only keep substantial sentences
    
    // Regular expressions to identify important sections
    const sectionRegex = /(?:Section|Clause|Article|Chapter)\s+([A-Z0-9.]+)/i;
    const clauseRegex = /(\d+(?:\.\d+)*)\s+([A-Za-z])/;
    const definitionRegex = /\b(\w+)\s+means\b/i;
    
    let currentSection = '';
    
    sentences.forEach((sentence, index) => {
      // Check if this is a new section
      const sectionMatch = sentence.match(sectionRegex);
      if (sectionMatch) {
        currentSection = sentence;
      }
      
      // Check if this is a numbered clause
      const clauseMatch = sentence.match(clauseRegex);
      const clauseNumber = clauseMatch ? clauseMatch[1] : undefined;
      
      // Check if this is a definition
      const definitionMatch = sentence.match(definitionRegex);
      const isDefinition = definitionMatch !== null;
      
      // Only include significant content
      if (
        sentence.length > 30 || 
        sectionMatch || 
        clauseMatch || 
        isDefinition || 
        sentence.includes('covered') || 
        sentence.includes('insurance') ||
        sentence.includes('policy') ||
        sentence.includes('claim') ||
        sentence.includes('benefit') ||
        sentence.includes('exclusion') ||
        sentence.includes('premium')
      ) {
        clauses.push({
          clauseText: sentence,
          section: currentSection || undefined,
          clauseNumber: clauseNumber || `${index + 1}`
        });
      }
    });
    
    return clauses;
  }

  calculateSimilarity(text1: string, text2: string): number {
    // Simple word-based similarity calculation
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set(Array.from(set1).concat(Array.from(set2)));
    
    return intersection.size / union.size;
  }
}

export const pdfProcessor = new PDFProcessor();
