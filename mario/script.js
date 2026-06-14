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

const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");
const btnJump = document.getElementById("btn-jump");

// assets (royalty-free)
const playerImg = new Image();
playerImg.src = "Runner.png";

const coinImg = new Image();
coinImg.src = "https://raw.githubusercontent.com/kenneyNL/kenney_game_assets/master/2D%20Pixel%20Art/Coins/coin_gold.png";

const coinSound = new Audio("https://raw.githubusercontent.com/kenneyNL/kenney_sound_effects/master/Audio/coin.wav");
coinSound.volume = 0.4;

const jumpSound = new Audio("https://raw.githubusercontent.com/kenneyNL/kenney_sound_effects/master/Audio/jump.wav");
jumpSound.volume = 0.4;

let username = null;
let score = 0;
let gameRunning = false;
let gameOver = false;

const gravity = 0.7;
const moveSpeed = 4.5;
const jumpSpeed = 13;
const friction = 0.85;

const camera = {
  x: 0
};

const player = {
  x: 100,
  y: 0,
  width: 32,
  height: 48,
  vx: 0,
  vy: 0,
  onGround: false
};

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  Space: false
};

const groundY = 360;

const platforms = [
  { x: 0, y: groundY, width: 2000, height: 40 },
  { x: 300, y: 300, width: 120, height: 20 },
  { x: 500, y: 260, width: 120, height: 20 },
  { x: 750, y: 220, width: 120, height: 20 },
  { x: 1000, y: 280, width: 120, height: 20 },
  { x: 1300, y: 320, width: 120, height: 20 }
];

const enemies = [
  makeGoomba(400, groundY - 32),
  makeGoomba(650, groundY - 32),
  makeGoomba(900, groundY - 32),
  makeGoomba(1150, groundY - 32),
  makeGoomba(1450, groundY - 32)
];

const coins = [
  { x: 350, y: 250, width: 24, height: 24, collected: false },
  { x: 520, y: 210, width: 24, height: 24, collected: false },
  { x: 780, y: 170, width: 24, height: 24, collected: false },
  { x: 1020, y: 240, width: 24, height: 24, collected: false },
  { x: 1350, y: 280, width: 24, height: 24, collected: false }
];

function makeGoomba(x, y) {
  return {
    x,
    y,
    width: 32,
    height: 32,
    vx: -1.2,
    alive: true
  };
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") e.preventDefault();
  if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
});

document.addEventListener("keyup", (e) => {
  if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

document.addEventListener("keydown", (e) => {
  if (gameOver && e.code === "Enter") {
    resetGame();
    gameRunning = true;
    hudStatus.textContent = "Playing…";
  }
});

// mobile controls
function press(key) {
  keys[key] = true;
}
function release(key) {
  keys[key] = false;
}

btnLeft.addEventListener("touchstart", () => press("ArrowLeft"));
btnLeft.addEventListener("touchend", () => release("ArrowLeft"));

btnRight.addEventListener("touchstart", () => press("ArrowRight"));
btnRight.addEventListener("touchend", () => release("ArrowRight"));

btnJump.addEventListener("touchstart", () => press("Space"));
btnJump.addEventListener("touchend", () => release("Space"));

// load leaderboard on page load
loadLeaderboard();

// load stats when username loses focus
usernameInput.addEventListener("blur", () => {
  const value = usernameInput.value.trim();
  if (!value) return;
  loadStatsAndLeaderboard(value);
});

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
  player.x = 100;
  player.y = groundY - player.height;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  camera.x = 0;
  enemies.forEach((e, i) => {
    e.alive = true;
    e.x = [400, 650, 900, 1150, 1450][i];
    e.y = groundY - 32;
    e.vx = -1.2;
  });
  coins.forEach((c) => (c.collected = false));
}

function loop() {
  if (gameRunning && !gameOver) update();
  draw();
  requestAnimationFrame(loop);
}

function update() {
  if (keys.ArrowLeft) player.vx -= 0.6;
  if (keys.ArrowRight) player.vx += 0.6;

  player.vx *= friction;
  if (Math.abs(player.vx) < 0.1) player.vx = 0;

  if ((keys.Space || keys.ArrowUp) && player.onGround) {
    player.vy = -jumpSpeed;
    player.onGround = false;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }

  player.vy += gravity;

  player.x += player.vx;
  player.y += player.vy;

  if (player.x < 0) player.x = 0;

  player.onGround = false;
  platforms.forEach((p) => {
    if (rectsCollide(player, p)) {
      if (player.y + player.height - player.vy <= p.y) {
        player.y = p.y - player.height;
        player.vy = 0;
        player.onGround = true;
      } else if (player.y - player.vy >= p.y + p.height) {
        player.y = p.y + p.height;
        player.vy = 0;
      } else {
        if (player.x < p.x) {
          player.x = p.x - player.width;
        } else {
          player.x = p.x + p.width;
        }
        player.vx = 0;
      }
    }
  });

  enemies.forEach((e) => {
    if (!e.alive) return;
    e.x += e.vx;
    if (e.x < 0 || e.x > 1900) e.vx *= -1;

    let onPlatform = false;
    platforms.forEach((p) => {
      if (
        e.x + e.width > p.x &&
        e.x < p.x + p.width &&
        e.y + e.height <= p.y + 5 &&
        e.y + e.height >= p.y - 5
      ) {
        onPlatform = true;
      }
    });
    if (!onPlatform) {
      e.vy = (e.vy || 0) + gravity;
      e.y += e.vy;
    }

    if (rectsCollide(player, e)) {
      if (player.vy > 0 && player.y + player.height - 8 <= e.y) {
        e.alive = false;
        player.vy = -jumpSpeed * 0.7;
        score += 100;
        hudScore.textContent = score;
      } else {
        endGame();
      }
    }
  });

  coins.forEach((c) => {
    if (!c.collected && rectsCollide(player, c)) {
      c.collected = true;
      score += 50;
      hudScore.textContent = score;
      coinSound.currentTime = 0;
      coinSound.play();
    }
  });

  camera.x = 0;
  if (camera.x < 0) camera.x = 0;

  score = Math.max(score, Math.floor(player.x / 5));
  hudScore.textContent = score;

  if (player.y > canvas.height + 200) {
    endGame();
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

  ctx.fillStyle = "#5c94fc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-camera.x, 0);

  platforms.forEach((p) => {
    if (p.y === groundY) {
      ctx.fillStyle = "#3aa63a";
      ctx.fillRect(p.x, p.y, p.width, p.height);
    } else {
      ctx.fillStyle = "#c96f2d";
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.fillStyle = "#e0a86b";
      ctx.fillRect(p.x + 2, p.y + 2, p.width - 4, p.height - 4);
    }
  });

  coins.forEach((c) => {
    if (!c.collected) {
      ctx.drawImage(coinImg, c.x, c.y, c.width, c.height);
    }
  });

  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  enemies.forEach((e) => {
    if (!e.alive) return;
    ctx.fillStyle = "#8b4513";
    ctx.fillRect(e.x, e.y, e.width, e.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(e.x + 6, e.y + 8, 6, 6);
    ctx.fillRect(e.x + e.width - 12, e.y + 8, 6, 6);
  });

  ctx.restore();

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
  statAvg.textContent =
    stats.averageScore != null ? stats.averageScore.toFixed(1) : "-";
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
