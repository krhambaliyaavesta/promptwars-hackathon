import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai.service';

const router = Router();
const aiService = new AIService();

router.post('/generate-plan', async (req: Request, res: Response) => {
  try {
    const { schedule, budget, preferences } = req.body;

    // Validation
    if (typeof schedule !== 'string' || schedule.trim() === '') {
      return res.status(400).json({ error: "Schedule must be a non-empty string." });
    }

    const numericBudget = Number(budget);
    if (isNaN(numericBudget) || numericBudget <= 0) {
      return res.status(400).json({ error: "Budget must be a positive number." });
    }

    if (typeof preferences !== 'string') {
      return res.status(400).json({ error: "Preferences must be a string." });
    }

    const result = await aiService.generateCookingPlan(
      schedule.trim(),
      numericBudget,
      preferences.trim()
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error generating cooking plan:", error);
    
    if (error.message && error.message.includes("API key")) {
      return res.status(500).json({
        error: "Server configuration issue: GEMINI_API_KEY is missing or invalid. Please check the backend .env configuration."
      });
    }

    if (error.message && error.message.includes("Gemini API client is not initialized")) {
      return res.status(500).json({
        error: "Server configuration issue: Gemini API key is not configured."
      });
    }
    
    return res.status(500).json({
      error: "An error occurred while generating your cooking plan. Please try again later."
    });
  }
});

export default router;
