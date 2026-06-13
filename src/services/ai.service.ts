import {
  GoogleGenerativeAI,
  FunctionDeclarationSchemaType,
} from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

export interface MealPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface Substitution {
  original: string;
  substitute: string;
  reason: string;
}

export interface BudgetFeasibility {
  isFeasible: boolean;
  estimatedCost: number;
  explanation: string;
}

export interface CookingPlanResponse {
  mealPlan: MealPlan;
  groceryList: string[];
  substitutions: Substitution[];
  budgetFeasibility: BudgetFeasibility;
}

export class AIService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      console.warn(
        "WARNING: GEMINI_API_KEY environment variable is not defined. AI requests will fail unless mocked.",
      );
    }
  }

  async generateCookingPlan(
    schedule: string,
    budget: number,
    preferences: string,
  ): Promise<CookingPlanResponse> {
    if (!this.genAI) {
      throw new Error(
        "Gemini API client is not initialized. Please set the GEMINI_API_KEY environment variable.",
      );
    }

    // Use gemini-1.5-flash as default model
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      systemInstruction:
        "You are a professional culinary assistant. Generate a highly detailed daily meal plan (Breakfast, Lunch, Dinner), a consolidated grocery list, ingredient substitutions, and budget feasibility logic strictly using the JSON schema provided.",
    });

    const prompt = `
Generate a personal cooking plan and list based on:
- User's daily schedule: "${schedule}"
- Budget limit: $${budget}
- Dietary restrictions / preferences: "${preferences}"

Please calculate realistic ingredient costs, match them against the budget, and provide alternatives if the budget is too low.
`;

    const schema = {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        mealPlan: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            breakfast: { type: FunctionDeclarationSchemaType.STRING },
            lunch: { type: FunctionDeclarationSchemaType.STRING },
            dinner: { type: FunctionDeclarationSchemaType.STRING },
          },
          required: ["breakfast", "lunch", "dinner"],
        },
        groceryList: {
          type: FunctionDeclarationSchemaType.ARRAY,
          items: { type: FunctionDeclarationSchemaType.STRING },
        },
        substitutions: {
          type: FunctionDeclarationSchemaType.ARRAY,
          items: {
            type: FunctionDeclarationSchemaType.OBJECT,
            properties: {
              original: { type: FunctionDeclarationSchemaType.STRING },
              substitute: { type: FunctionDeclarationSchemaType.STRING },
              reason: { type: FunctionDeclarationSchemaType.STRING },
            },
            required: ["original", "substitute", "reason"],
          },
        },
        budgetFeasibility: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            isFeasible: { type: FunctionDeclarationSchemaType.BOOLEAN },
            estimatedCost: { type: FunctionDeclarationSchemaType.NUMBER },
            explanation: { type: FunctionDeclarationSchemaType.STRING },
          },
          required: ["isFeasible", "estimatedCost", "explanation"],
        },
      },
      required: [
        "mealPlan",
        "groceryList",
        "substitutions",
        "budgetFeasibility",
      ],
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
        temperature: 0.2,
      },
    });

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error("Empty response received from Gemini API");
    }

    try {
      return JSON.parse(responseText) as CookingPlanResponse;
    } catch (error) {
      console.error(
        "Failed to parse Gemini response as JSON. Raw output:",
        responseText,
      );
      throw new Error(
        "Failed to generate a valid structured JSON response from Gemini API.",
      );
    }
  }
}
