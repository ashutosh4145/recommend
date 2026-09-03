import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8787;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3.6-flash";

// ==========================================
// RECOMMEND PRODUCTS
// ==========================================

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

    const prompt = `
You are a product recommendation engine.

User request:
${userInput}

Products:
${JSON.stringify(products)}

Return ONLY a JSON array containing the IDs of the products
that best match the user's request.

Example:
[1, 4, 7]

If nothing matches:
[]
`;

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },

      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
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

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", response.status, data);

      return res.status(502).json({
        error: "Upstream AI request failed.",
        geminiStatus: response.status,
        geminiError: data
      });
    }

    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";

    let ids;

    try {
      ids = JSON.parse(raw);

      if (!Array.isArray(ids)) {
        throw new Error("Gemini response is not an array");
      }
    } catch (error) {
      console.error("Could not parse Gemini response:", raw);

      return res.status(502).json({
        error: "AI returned an invalid response."
      });
    }

    return res.json({
      ids
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Something went wrong on the server.",
      details: error.message
    });
  }
});


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true
  });
});


// ==========================================
// CHECK AVAILABLE GEMINI MODELS
// ==========================================

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

    console.log(
      "Gemini models response:",
      JSON.stringify(data, null, 2)
    );

    return res.status(response.status).json(data);

  } catch (error) {
    console.error("Models error:", error);

    return res.status(500).json({
      error: error.message
    });
  }
});


// ==========================================
// DIRECT GEMINI TEST
// ==========================================

app.get("/api/test-gemini", async (_req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Server is missing GEMINI_API_KEY."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Say hello in one word."
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log(
      "Gemini test response:",
      JSON.stringify(data, null, 2)
    );

    return res.status(response.status).json(data);

  } catch (error) {
    console.error("Gemini test error:", error);

    return res.status(500).json({
      error: error.message
    });
  }
});


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `Recommendation backend running on http://localhost:${PORT}`
  );
});