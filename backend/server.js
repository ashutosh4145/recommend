import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8787;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// ===============================
// PRODUCT RECOMMENDATION
// ===============================

app.post("/api/recommend", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Server is missing GEMINI_API_KEY."
      });
    }

    const { userInput, products } = req.body || {};

    if (!userInput || typeof userInput !== "string") {
      return res.status(400).json({
        error: "userInput is required."
      });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: "products array is required."
      });
    }

    const systemPrompt = `
You are a product recommendation engine.

Given a list of products and a user's shopping request,
select the products that best match the request.

Return ONLY a JSON array containing the product IDs.

Do not return explanations.
Do not return markdown.
Do not return any other text.

Example:
[2, 5, 9]

If nothing matches well, return:
[]
`;

    const userPrompt = `
Product list:
${JSON.stringify(products)}

User request:
${userInput}
`;

    // Gemini API URL
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },

      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: systemPrompt
            }
          ]
        },

        contents: [
          {
            role: "user",
            parts: [
              {
                text: userPrompt
              }
            ]
          }
        ],

        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();

      console.error(
        "Gemini error:",
        response.status,
        errText
      );

      return res.status(502).json({
        error: "Upstream AI request failed.",
        status: response.status,
        details: errText
      });
    }

    const data = await response.json();

    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";

    let ids;

    try {
      ids = JSON.parse(raw);

      if (!Array.isArray(ids)) {
        throw new Error("AI response was not an array");
      }
    } catch (error) {
      console.error(
        "Failed to parse Gemini response:",
        raw
      );

      return res.status(502).json({
        error: "AI returned an unparseable response."
      });
    }

    return res.json({
      ids
    });

  } catch (error) {
    console.error(
      "Unexpected server error:",
      error
    );

    return res.status(500).json({
      error: "Something went wrong on the server.",
      details: error.message
    });
  }
});


// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true
  });
});


// ===============================
// CHECK AVAILABLE GEMINI MODELS
// ===============================

app.get("/api/models", async (_req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Server is missing GEMINI_API_KEY."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models",
      {
        method: "GET",
        headers: {
          "x-goog-api-key": GEMINI_API_KEY
        }
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (error) {
    console.error("Models error:", error);

    return res.status(500).json({
      error: error.message
    });
  }
});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
  console.log(
    `Recommendation backend running on http://localhost:${PORT}`
  );
});