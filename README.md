# PrepWise - AI Cooking To-Do Assistant

PrepWise is a smart, single-repo micro-app that generates a personalized, dynamic cooking plan and shopping checklist based on a user's schedule, budget, and dietary preferences. It integrates with Google's Generative AI SDK using structured JSON schema configurations to guarantee reliable, parseable responses.

## Tech Stack & Architecture

- **Backend**: Node.js, Express, TypeScript, and `tsx` for high-speed execution/hot-reloading.
- **Frontend**: Plain HTML5, Vanilla JavaScript, and TailwindCSS via CDN (secured through Helmet CSP policies).
- **Security**: Express server hardened with custom `helmet` policies allowing cross-origin styling and font delivery (Tailwind & Google Fonts).
- **AI Integration**: Google Generative AI SDK (`@google/generative-ai`) leveraging `gemini-1.5-flash` with zero-shot prompting inside structured boundaries.
- **Testing**: Jest, Supertest, and `ts-jest` for integration testing.

---

## Approach & Logic: Strict JSON Enforcements

To guarantee that Gemini returns a strict, non-broken JSON object, we utilize native Schema enforcement rather than basic regex parsing. We achieve this inside [ai.service.ts](file:///home/avesta/Downloads/Krunal/promptwars-hackathon/src/services/ai.service.ts) by passing a `responseSchema` property with type definitions (`Type.OBJECT`, `Type.ARRAY`, `Type.STRING`, `Type.NUMBER`, `Type.BOOLEAN`) inside the `generationConfig` setup:

```typescript
const schema: Schema = {
  type: Type.OBJECT,
  properties: {
    mealPlan: {
      type: Type.OBJECT,
      properties: {
        breakfast: { type: Type.STRING },
        lunch: { type: Type.STRING },
        dinner: { type: Type.STRING }
      },
      required: ["breakfast", "lunch", "dinner"]
    },
    groceryList: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    substitutions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          substitute: { type: Type.STRING },
          reason: { type: Type.STRING }
        },
        required: ["original", "substitute", "reason"]
      }
    },
    budgetFeasibility: {
      type: Type.OBJECT,
      properties: {
        isFeasible: { type: Type.BOOLEAN },
        estimatedCost: { type: Type.NUMBER },
        explanation: { type: Type.STRING }
      },
      required: ["isFeasible", "estimatedCost", "explanation"]
    }
  },
  required: ["mealPlan", "groceryList", "substitutions", "budgetFeasibility"]
};
```

By specifying `responseMimeType: "application/json"` and binding the schema, the model uses constrained decoding. The response from the model is guaranteed to be clean, parseable JSON conforming perfectly to the schema.

---

## Setup & Run Instructions

### 1. Install Dependencies
Run the following command in the project root to install the server and development dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Run the App
Launch the Express application in development mode with active watch checking:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 4. Run Tests
To run Jest integration tests (which utilize mock AI layers):
```bash
npm run test
```

---

## Assumptions Made

1. **Currency System**: The budget and cost calculations are modeled after USD ($) but can represent any standardized fiat notation (numeric).
2. **Grocery Estimates**: AI-generated price estimations reflect average US grocery store prices. Estimates do not account for local tax rates or store-specific pricing.
3. **Availability**: Substitution recommendations assume standard convenience store or supermarket availability.
4. **Internet Connectivity**: The server requires outbound internet access to make requests to the Google Gemini API.
