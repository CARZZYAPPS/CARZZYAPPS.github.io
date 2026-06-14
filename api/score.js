let scores = []; // in-memory

export default function handler(req, res) {
  if (req.method === "POST") {
    const { username, score } = req.body || {};

    if (!username || typeof score !== "number") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const entry = {
      username,
      score,
      timestamp: new Date().toISOString()
    };

    scores.push(entry);

    const topScores = getTopScores();
    const stats = getStatsForUser(username);

    return res.status(200).json({
      message: "Score saved",
      yourScore: entry,
      topScores,
      stats
    });
  }

  if (req.method === "GET") {
    const { username } = req.query || {};
    const topScores = getTopScores();
    const stats = username ? getStatsForUser(username) : null;

    return res.status(200).json({ topScores, stats });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

function getTopScores() {
  return [...scores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getStatsForUser(username) {
  const userScores = scores.filter((s) => s.username === username);
  if (userScores.length === 0) {
    return {
      highScore: 0,
      gamesPlayed: 0,
      lastScore: 0,
      averageScore: 0
    };
  }

  const highScore = Math.max(...userScores.map((s) => s.score));
  const gamesPlayed = userScores.length;
  const lastScore = userScores[userScores.length - 1].score;
  const averageScore =
    userScores.reduce((sum, s) => sum + s.score, 0) / gamesPlayed;

  return { highScore, gamesPlayed, lastScore, averageScore };
}
