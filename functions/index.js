const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// The GEMINI_KEY secret is set via:
//   firebase functions:secrets:set GEMINI_KEY
// It never touches the browser.

exports.generateRoadmap = onCall(
  {
    secrets: ["GEMINI_KEY"],
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (request) => {
    // Require authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in first.");
    }

    const { name, goal, commitment } = request.data;

    if (!name || !goal || !commitment) {
      throw new HttpsError("invalid-argument", "name, goal, and commitment are required.");
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const prompt = `You are a learning coach. A user is starting a personal project and wants a structured roadmap.

Project name: ${name}
Goal: ${goal}
Commitment / effort: ${commitment}

Design a realistic roadmap. Pick a sensible total number of DAYS (between 14 and 90) based on the goal and the daily commitment. Break the journey into 3-6 named phases. Each phase covers a contiguous range of days.

Return ONLY valid JSON in exactly this format:
{
  "totalDays": <integer>,
  "summary": "<one motivating sentence about the journey>",
  "phases": [
    {
      "title": "<phase name>",
      "days": <integer, number of days in this phase>,
      "focus": "<one short line on what to focus on>"
    }
  ]
}

IMPORTANT: The sum of all phase "days" values MUST equal totalDays exactly.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      // Validate structure
      if (!parsed.totalDays || !parsed.phases || !Array.isArray(parsed.phases) || parsed.phases.length === 0) {
        throw new Error("Invalid roadmap structure");
      }

      // Fix sum if needed
      const sum = parsed.phases.reduce((a, p) => a + p.days, 0);
      if (sum !== parsed.totalDays) {
        parsed.totalDays = sum;
      }

      return parsed;
    } catch (error) {
      console.error("Gemini error:", error);
      throw new HttpsError("internal", "Failed to generate roadmap. Please try again.");
    }
  }
);
