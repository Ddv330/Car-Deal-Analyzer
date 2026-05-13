// server.js
// Run with: node server.js
// Install deps first: npm install

import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serves your frontend

const SYSTEM_PROMPT = `You are an automotive expert. Given a car listing, respond ONLY with raw JSON (no markdown):
{"extracted":{"year":"string or null","make":"string or null","model":"string or null","trim":"string or null","miles":"string or null","price":"string or null"},"verdict":"GREAT DEAL","verdict_explanation":"1-2 sentence explanation","known_issues":[{"issue":"string","typical_mileage":"string","severity":"Low"}]}
Verdict must be one of: GREAT DEAL, GOOD DEAL, FAIR PRICE, OVERPRICED, NEEDS RESEARCH. List 4-6 known issues.`;

app.post("/analyze", async (req, res) => {
  const { listing } = req.body;
  if (!listing) return res.status(400).json({ error: "No listing provided." });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: listing }],
    });

    const text = message.content.map((b) => b.text || "").join("");
    const result = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

app.listen(3000, () => console.log("✅ Server running at http://localhost:3000"));
