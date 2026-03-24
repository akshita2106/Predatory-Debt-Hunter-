import { GoogleGenAI } from "@google/genai";
import { DocumentAnalysis, RiskLevel } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

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

export const analyzeDemoDocument = async (type: 'payday' | 'credit' | 'medical'): Promise<DocumentAnalysis> => {
  const demoData: Record<string, any> = {
    payday: {
      summary: "A high-interest short-term payday loan agreement from 'QuickCash Loans'.",
      riskScore: 92,
      riskLevel: "PREDATORY",
      clauses: [
        { text: "Annual Percentage Rate (APR) of 400%", type: "danger", explanation: "This is 10x higher than standard bank loans and is designed to keep you in a debt cycle." },
        { text: "Automatic rollover fee of $50 every 14 days", type: "danger", explanation: "If you don't pay in full, they charge you a fee just to extend the loan, which doesn't reduce your balance." },
        { text: "Mandatory wage garnishment authorization", type: "warning", explanation: "You are giving them permission to take money directly from your paycheck if you miss a payment." }
      ],
      extractedAmounts: [
        { label: "Principal Amount", amount: "$500.00" },
        { label: "Total Repayment", amount: "$1,250.00" }
      ],
      actionableAdvice: "Do not sign this. This loan is designed to be impossible to pay back. Look for local credit unions or non-profit debt assistance programs instead."
    },
    credit: {
      summary: "A 'MegaBank' credit card statement with hidden penalty terms.",
      riskScore: 45,
      riskLevel: "CAUTION",
      clauses: [
        { text: "Late payment fee of $45", type: "warning", explanation: "This fee is at the legal maximum and can be triggered by being just one hour late." },
        { text: "Penalty APR of 29.99% triggered after one late payment", type: "danger", explanation: "One mistake will double your interest rate permanently." }
      ],
      extractedAmounts: [
        { label: "Minimum Payment", amount: "$35.00" },
        { label: "Statement Balance", amount: "$1,250.00" }
      ],
      actionableAdvice: "Pay more than the minimum. At this rate, paying only the minimum will take 15 years to clear the balance. Set up auto-pay to avoid the penalty APR."
    },
    medical: {
      summary: "An itemized medical bill from 'City General Hospital'.",
      riskScore: 65,
      riskLevel: "PREDATORY",
      clauses: [
        { text: "Uncoded 'Administrative Supply' fee of $450", type: "danger", explanation: "This is a common 'junk fee' used to inflate bills without providing specific services." },
        { text: "Interest accrual starts 30 days from billing date", type: "warning", explanation: "Most hospitals allow 90 days before interest starts. This is an aggressive collection tactic." }
      ],
      extractedAmounts: [
        { label: "Total Charges", amount: "$4,200.00" },
        { label: "Insurance Adjustment", amount: "$0.00" }
      ],
      actionableAdvice: "Request an itemized bill with CPT codes. Call the billing department and ask for 'Financial Assistance' or 'Charity Care'—they are legally required to offer it if you meet income limits."
    }
  };

  return {
    id: crypto.randomUUID(),
    fileName: `demo_${type}.pdf`,
    timestamp: Date.now(),
    ...demoData[type]
  };
};

export const generateNegotiationContent = async (
  docContext: DocumentAnalysis,
  type: 'email' | 'script' | 'letter',
  userGoal: string,
  tone: string = 'Professional & Firm',
  additionalContext: string = ''
): Promise<string> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    Context: A user has analyzed a financial document with a risk level of ${docContext.riskLevel}.
    Summary of doc: ${docContext.summary}.
    Key dangerous clauses: ${docContext.clauses.filter(c => c.type === 'danger').map(c => c.text).join('; ')}.
    
    Task: Generate a ${type} for the user to negotiate with the issuer.
    User Goal: ${userGoal}
    Desired Tone: ${tone}
    Additional User Context: ${additionalContext}
    
    Guidelines:
    - Be ${tone}.
    - Cite consumer protection principles where relevant.
    - If it's a script, include placeholders for names and dates.
    - If it's an email, include a clear subject line.
    - Focus on the user's goal: ${userGoal}.
    
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
  monthlySalary: number,
  monthlyExpenses: number,
  scenario: string,
  currency: string = 'USD'
): Promise<string> => {
   const model = "gemini-2.5-flash";
   const disposableIncome = monthlySalary - monthlyExpenses;
   const prompt = `
    You are an AI Financial Advisor for "Predatory Debt Hunter".
    User Data:
    - Monthly Salary: ${currency} ${monthlySalary}
    - Current Savings: ${currency} ${currentSavings}
    - Monthly Expenses: ${currency} ${monthlyExpenses}
    - Disposable Income: ${currency} ${disposableIncome}
    
    Scenario to Simulate: ${scenario}
    
    Task:
    1. Analyze the impact of the scenario on their financial health.
    2. Provide specific, actionable advice based on their disposable income.
    3. If disposable income > 500, suggest allocations for emergency funds, index funds, and fixed income assets.
    4. Keep it concise (4-5 sentences).
    
    Tone: Professional, empathetic, and data-driven.
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
