// api/score.js

let scores = []; // temporary in‑memory storage

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { username, score } = req.body;

  if (!username || typeof score !== "number") {
    return res.status(400).json({ error: "Invalid data" });
  }

  const entry = {
    username,
    score,
    timestamp: new Date().toISOString()
  };

  scores.push(entry);

  // Sort top 10
  const topScores = [...scores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return res.status(200).json({
    message: "Score saved",
    yourScore: entry,
    topScores
  });
}
