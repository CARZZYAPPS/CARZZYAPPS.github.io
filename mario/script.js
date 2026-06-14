const API_URL = "https://carzzyapps.vercel.app/api/score";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const form = document.getElementById("player-form");
const usernameInput = document.getElementById("username");
const hudUsername = document.getElementById("hud-username");
const hudScore = document.getElementById("hud-score");
const hudStatus = document.getElementById("hud-status");

const statHigh = document.getElementById("stat-high");
const statGames = document.getElementById("stat-games");
const statLast = document.getElementById("stat-last");
const statAvg = document.getElementById("stat-avg");
const leaderboardBody = document.getElementById("leaderboard-body");

let username = null;
let score = 0;
let gameRunning = false;
let gameOver = false;

const gravity = 0.6;
const groundY = canvas.height * 0.75;

const player = {
  x: 80,
  y: groundY - 40,
  width: 32,
  height: 40,
  vy: 0,
  onGround: true
};

const obstacles = [];
let obstacleTimer = 0;
const obstacleInterval = 120;

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  Space: false,
  ArrowUp: false
};

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") e.preventDefault();
  if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
});

document.addEventListener("keyup", (e) => {
  if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

// Load leaderboard on page load
loadLeaderboard();

// Load stats when username changes (on blur)
usernameInput.addEventListener("blur", () => {
  const value = usernameInput.value.trim();
  if (!value) return;
  loadStatsAndLeaderboard(value);
});

// Start game
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = usernameInput.value.trim();
  if (!value) return;
  username = value;
  hudUsername.textContent = username;
  resetGame();
  gameRunning = true;
  hudStatus.textContent = "Playing…";
});

function resetGame() {
  score = 0;
  hudScore.textContent = score;
  gameOver = false;
  player.x = 80;
  player.y = groundY - player.height;
  player.vy = 0;
  player.onGround = true;
  obstacles.length = 0;
  obstacleTimer = 0;
}

function loop() {
  if (gameRunning && !gameOver) update();
  draw();
  requestAnimationFrame(loop);
}

function update() {
  const speed = 4;
  if (keys.ArrowLeft) player.x = Math.max(0, player.x - speed);
  if (keys.ArrowRight) player.x = Math.min(canvas.width - player.width, player.x + speed);

  if ((keys.Space || keys.ArrowUp) && player.onGround) {
    player.vy = -12;
    player.onGround = false;
  }

  player.vy += gravity;
  player.y += player.vy;

  if (player.y + player.height >= groundY) {
    player.y = groundY - player.height;
    player.vy = 0;
    player.onGround = true;
  }

  obstacleTimer++;
  if (obstacleTimer >= obstacleInterval) {
    obstacleTimer = 0;
    obstacles.push({
      x: canvas.width + 30,
      y: groundY - 30,
      width: 30,
      height: 30,
      vx: -4
    });
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x += o.vx;

    if (o.x + o.width < 0) {
      obstacles.splice(i, 1);
      score += 10;
      hudScore.textContent = score;
    } else if (rectsCollide(player, o)) {
      endGame();
    }
  }
}

function rectsCollide(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#654321";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  ctx.fillStyle = "#ff0000";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = "#b71c1c";
  ctx.fillRect(player.x, player.y - 10, player.width, 10);

  obstacles.forEach((o) => {
    ctx.fillStyle = "#8b4513";
    ctx.fillRect(o.x, o.y, o.width, o.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(o.x + 6, o.y + 8, 6, 6);
    ctx.fillRect(o.x + o.width - 12, o.y + 8, 6, 6);
  });

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "32px sans-serif";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px sans-serif";
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText("Press Enter to restart", canvas.width / 2, canvas.height / 2 + 40);
  }
}

function endGame() {
  if (gameOver) return;
  gameOver = true;
  hudStatus.textContent = "Game Over – saving score…";
  if (!username) return;

  saveScore(username, score)
    .then((data) => {
      hudStatus.textContent = "Score saved!";
      updateStatsFromResponse(data.stats);
      updateLeaderboardFromResponse(data.topScores);
    })
    .catch(() => {
      hudStatus.textContent = "Failed to save score.";
    });
}

document.addEventListener("keydown", (e) => {
  if (gameOver && e.code === "Enter") {
    resetGame();
    gameRunning = true;
    hudStatus.textContent = "Playing…";
  }
});

async function saveScore(username, score) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, score })
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function loadLeaderboard() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    updateLeaderboardFromResponse(data.topScores || []);
  } catch {
    leaderboardBody.innerHTML = `<tr><td colspan="3">Error loading leaderboard</td></tr>`;
  }
}

async function loadStatsAndLeaderboard(name) {
  hudStatus.textContent = "Loading stats…";
  try {
    const res = await fetch(`${API_URL}?username=${encodeURIComponent(name)}`);
    const data = await res.json();
    updateStatsFromResponse(data.stats);
    updateLeaderboardFromResponse(data.topScores || []);
    hudStatus.textContent = "Stats loaded. Press Start Game.";
  } catch {
    hudStatus.textContent = "Error loading stats.";
  }
}

function updateStatsFromResponse(stats) {
  if (!stats) {
    statHigh.textContent = "-";
    statGames.textContent = "-";
    statLast.textContent = "-";
    statAvg.textContent = "-";
    return;
  }
  statHigh.textContent = stats.highScore ?? "-";
  statGames.textContent = stats.gamesPlayed ?? "-";
  statLast.textContent = stats.lastScore ?? "-";
  statAvg.textContent = stats.averageScore != null ? stats.averageScore.toFixed(1) : "-";
}

function updateLeaderboardFromResponse(scores) {
  if (!scores || scores.length === 0) {
    leaderboardBody.innerHTML = `<tr><td colspan="3">No scores yet</td></tr>`;
    return;
  }
  leaderboardBody.innerHTML = "";
  scores.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.username}</td>
      <td>${entry.score}</td>
    `;
    leaderboardBody.appendChild(row);
  });
}

loop();
