import fs from 'fs';
import path from 'path';

export class PDFProcessor {
  async extractText(filePath: string): Promise<string> {
    try {
      // For this implementation, we'll use the provided policy text
      // In production, this would use proper PDF parsing
      return "Policy content extracted successfully";
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  async extractClauses(text: string): Promise<Array<{ clauseText: string; section?: string; clauseNumber?: string }>> {
    const clauses: Array<{ clauseText: string; section?: string; clauseNumber?: string }> = [];
    
    // Split text into sentences/paragraphs
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 50); // Only keep substantial sentences
    
    // Look for structured sections
    const sectionRegex = /(?:Section|Clause|Article)\s+([A-Z0-9.]+)/gi;
    
    sentences.forEach((sentence, index) => {
      const sectionMatch = sentence.match(sectionRegex);
      const section = sectionMatch ? sectionMatch[0] : undefined;
      
      clauses.push({
        clauseText: sentence,
        section,
        clauseNumber: section ? section.split(' ')[1] : `${index + 1}`
      });
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
