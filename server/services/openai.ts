import OpenAI from "openai";
import { StructuredQuery, ProcessingResult, DecisionJustification } from "@shared/schema";

// Check if API key exists
const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
if (!apiKey) {
  console.warn("WARNING: OPENAI_API_KEY environment variable is not set. Some AI features will not work properly.");
}

// Create OpenAI client with provided key or use fallback mode
const openai = new OpenAI({ 
  apiKey: apiKey || "sk-dummy-key-for-fallback-mode"
});

export class OpenAIService {
  async parseQuery(queryText: string): Promise<StructuredQuery> {
    try {
      if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY_ENV_VAR) {
        console.warn("OpenAI API key not provided, using fallback mode");
        // Return a basic structured query in fallback mode
        return {
          age: undefined,
          gender: undefined,
          procedure: queryText.length > 30 ? queryText.substring(0, 30) : queryText,
          location: undefined,
          policyDuration: undefined,
          policyDurationUnit: undefined,
          preExistingConditions: [],
          additionalInfo: "Processed in fallback mode (no API key)"
        };
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert at parsing insurance and healthcare queries. Extract structured information from natural language queries.
            
            Parse the following information if present:
            - age: numerical age
            - gender: M/F/Male/Female
            - procedure: medical procedure or condition
            - location: city or geographic location
            - policyDuration: numerical duration
            - policyDurationUnit: days/weeks/months/years
            - preExistingConditions: array of conditions
            - additionalInfo: any other relevant information
            
            Respond with JSON in this exact format:
            {
              "age": number,
              "gender": "string",
              "procedure": "string", 
              "location": "string",
              "policyDuration": number,
              "policyDurationUnit": "string",
              "preExistingConditions": ["string"],
              "additionalInfo": "string"
            }`
          },
          {
            role: "user",
            content: queryText
          }
        ],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(response.choices[0].message.content || "{}");
      return parsed as StructuredQuery;
    } catch (error) {
      console.error("Error parsing query:", error);
      throw new Error("Failed to parse query with AI");
    }
  }

  async findRelevantClauses(queryText: string, structuredQuery: StructuredQuery, allClauses: string[]): Promise<string[]> {
    try {
      if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY_ENV_VAR) {
        console.warn("OpenAI API key not provided, using fallback mode for clause selection");
        // In fallback mode, return the first few clauses (if available)
        return allClauses.slice(0, Math.min(3, allClauses.length));
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert at finding relevant insurance policy clauses. Given a query and available clauses, identify the most relevant ones.
            
            Query: ${queryText}
            Structured Data: ${JSON.stringify(structuredQuery)}
            
            From the provided clauses, select the most relevant ones for making an insurance decision. Return as JSON array of clause indices.
            
            Respond with JSON in this format:
            {
              "relevantClauseIndices": [0, 1, 2],
              "reasoning": "Brief explanation of why these clauses are relevant"
            }`
          },
          {
            role: "user",
            content: `Available clauses:\n${allClauses.map((clause, index) => `${index}: ${clause}`).join('\n\n')}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.relevantClauseIndices?.map((index: number) => allClauses[index]) || [];
    } catch (error) {
      console.error("Error finding relevant clauses:", error);
      return [];
    }
  }

  async makeDecision(queryText: string, structuredQuery: StructuredQuery, relevantClauses: string[]): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY_ENV_VAR) {
        console.warn("OpenAI API key not provided, using fallback mode for decision making");
        // Return a default fallback response
        return {
          decision: "pending",
          confidenceScore: 0.5,
          processingTimeMs: Date.now() - startTime,
          coverageDetails: {
            procedure: structuredQuery.procedure,
            location: structuredQuery.location,
            patientAge: structuredQuery.age,
            policyDurationMonths: structuredQuery.policyDuration
          },
          justification: [
            {
              criterion: "API Key Validation",
              status: "unclear",
              sourceClause: "System Configuration",
              description: "The system is running in fallback mode due to missing API key. Human review required."
            }
          ]
        };
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert insurance claims processor. Based on the query and relevant policy clauses, make a decision.
            
            Rules:
            1. Analyze each criterion: age eligibility, procedure coverage, waiting periods, geographic coverage, pre-existing conditions
            2. Make a decision: approved, rejected, or pending
            3. Calculate coverage amount and deductible if applicable
            4. Provide detailed justification referencing specific clauses
            5. Assign confidence score (0-1)
            
            Respond with JSON in this exact format:
            {
              "decision": "approved|rejected|pending",
              "amount": number,
              "deductible": number,
              "coverageDetails": {
                "procedure": "string",
                "location": "string", 
                "patientAge": number,
                "policyDurationMonths": number
              },
              "justification": [
                {
                  "criterion": "string",
                  "status": "met|not_met|unclear",
                  "sourceClause": "string", 
                  "description": "string"
                }
              ],
              "confidenceScore": number
            }`
          },
          {
            role: "user",
            content: `Query: ${queryText}
            
            Structured Query: ${JSON.stringify(structuredQuery)}
            
            Relevant Policy Clauses:
            ${relevantClauses.join('\n\n')}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const processingTime = Date.now() - startTime;

      return {
        ...result,
        processingTimeMs: processingTime
      } as ProcessingResult;
    } catch (error) {
      console.error("Error making decision:", error);
      throw new Error("Failed to process decision with AI");
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      return [];
    }
  }
}

export const openaiService = new OpenAIService();
