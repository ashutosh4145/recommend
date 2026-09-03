import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8787;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// POST /api/recommend
// body:
// {
//   userInput: "phones for gaming",
//   products: [
//     { id, name, category, price, description }
//   ]
// }
//
// returns:
// { ids: [1, 4, 7] }

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

    const systemPrompt =
      "You are a product recommendation engine. " +
      "Given a list of products and a user request, return ONLY a JSON array " +
      "of the product IDs that best match the request. " +
      "No explanation, no markdown, just the raw JSON array. " +
      "Example valid response: [2, 5, 9]. " +
      "If nothing matches well, return [].";

    const userPrompt =
      `Product list: ${JSON.stringify(products)}\n\n` +
      `User request: ${userInput}`;

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
          temperature: 0
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
        error: "Upstream AI request failed."
      });
    }

    const data = await response.json();

    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";

    let ids;

    try {
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      ids = JSON.parse(cleaned);

      if (!Array.isArray(ids)) {
        throw new Error("Response was not an array");
      }
    } catch (parseErr) {
      console.error(
        "Failed to parse model response:",
        raw
      );

      return res.status(502).json({
        error: "AI returned an unparseable response."
      });
    }

    return res.json({ ids });

  } catch (err) {
    console.error(
      "Unexpected error:",
      err
    );

    return res.status(500).json({
      error: "Something went wrong on the server."
    });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(
    `Recommendation backend running on http://localhost:${PORT}`
  );
});