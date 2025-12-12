import { GoogleGenAI, Schema } from "@google/genai";
import { DocumentAnalysis, RiskLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeDocument = async (file: File): Promise<DocumentAnalysis> => {
  const base64Data = await fileToGenerativePart(file);

  const model = "gemini-2.5-flash";
  
  const prompt = `
    Analyze this financial document image. Act as a predatory debt hunter and financial legal expert.
    Identify any predatory terms, high interest rates (calculate true APR if possible), hidden fees, rollover clauses, or dangerous legal stipulations.
    
    Return a JSON object with the following structure:
    {
      "summary": "A brief 2-sentence summary of what this document is.",
      "riskScore": 0 to 100 (where 100 is extremely predatory/dangerous),
      "riskLevel": "SAFE" | "CAUTION" | "PREDATORY" | "URGENT",
      "clauses": [
        { "text": "The exact text of the clause", "type": "danger" | "warning" | "info", "explanation": "Why this is bad in plain language" }
      ],
      "extractedAmounts": [
        { "label": "e.g. Total Due", "amount": "$100.00" }
      ],
      "actionableAdvice": "One paragraph of direct advice on what the user should do next."
    }
    
    Ensure the response is valid JSON. Do not use Markdown formatting in the JSON output if possible, but if you do, I will clean it.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const json = JSON.parse(text);

    return {
      id: crypto.randomUUID(),
      fileName: file.name,
      timestamp: Date.now(),
      ...json
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze document. Please try again.");
  }
};

export const generateNegotiationContent = async (
  docContext: DocumentAnalysis,
  type: 'email' | 'script' | 'letter',
  userGoal: string
): Promise<string> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    Context: A user has analyzed a financial document with a risk level of ${docContext.riskLevel}.
    Summary of doc: ${docContext.summary}.
    Key dangerous clauses: ${docContext.clauses.filter(c => c.type === 'danger').map(c => c.text).join('; ')}.
    
    Task: Generate a ${type} for the user to negotiate with the issuer.
    User Goal: ${userGoal}
    
    Tone: Professional, firm, polite, but assertive. Cite consumer rights loosely if applicable (generic context).
    Format: Return just the text content of the ${type}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt
    });
    return response.text || "Could not generate content.";
  } catch (error) {
    console.error("Gemini Negotiation Error:", error);
    return "Error generating negotiation content.";
  }
};

export const simulateScenarioAdvice = async (
  currentSavings: number,
  monthlyExpenses: number,
  scenario: string
): Promise<string> => {
   const model = "gemini-2.5-flash";
   const prompt = `
    You are a personal finance simulator.
    User Data:
    - Current Savings: $${currentSavings}
    - Monthly Expenses: $${monthlyExpenses}
    
    Scenario to Simulate: ${scenario}
    
    Provide a brief (3-4 sentences) analysis of how this scenario impacts their runway and risk exposure. Be realistic but helpful.
   `;

   try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt
    });
    return response.text || "Simulation analysis unavailable.";
   } catch (error) {
     return "Error running simulation analysis.";
   }
}
