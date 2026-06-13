import request from 'supertest';
import app from '../src/server';
import { AIService } from '../src/services/ai.service';

// Mock AIService
jest.mock('../src/services/ai.service');

describe('POST /api/generate-plan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and the correct JSON structure when AI succeeds', async () => {
    const mockPlan = {
      mealPlan: {
        breakfast: 'Oatmeal with fresh fruits',
        lunch: 'Quinoa Salad with Chickpeas',
        dinner: 'Baked Salmon with Sweet Potatoes'
      },
      groceryList: ['Oats', 'Fruits', 'Quinoa', 'Chickpeas', 'Salmon', 'Sweet Potatoes'],
      substitutions: [
        {
          original: 'Salmon',
          substitute: 'Tofu',
          reason: 'Vegetarian option'
        }
      ],
      budgetFeasibility: {
        isFeasible: true,
        estimatedCost: 18.5,
        explanation: 'The ingredients are standard staples and cost roughly $18.50, which fits within the $25 budget.'
      }
    };

    (AIService.prototype.generateCookingPlan as jest.Mock).mockResolvedValue(mockPlan);

    const response = await request(app)
      .post('/api/generate-plan')
      .send({
        schedule: 'Moderately Busy',
        budget: 25.00,
        preferences: 'none'
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockPlan);
    expect(AIService.prototype.generateCookingPlan).toHaveBeenCalledWith('Moderately Busy', 25, 'none');
  });

  it('should return 400 if budget is invalid or negative', async () => {
    const response = await request(app)
      .post('/api/generate-plan')
      .send({
        schedule: 'Busy',
        budget: -5.00,
        preferences: 'none'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Budget must be a positive number');
  });

  it('should return 400 if schedule is empty or invalid', async () => {
    const response = await request(app)
      .post('/api/generate-plan')
      .send({
        schedule: '',
        budget: 20.00,
        preferences: 'none'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Schedule must be a non-empty string');
  });

  it('should return 500 when the AI service fails', async () => {
    (AIService.prototype.generateCookingPlan as jest.Mock).mockRejectedValue(new Error('Gemini model error'));

    const response = await request(app)
      .post('/api/generate-plan')
      .send({
        schedule: 'Busy',
        budget: 20.00,
        preferences: 'none'
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toContain('An error occurred');
  });
});
