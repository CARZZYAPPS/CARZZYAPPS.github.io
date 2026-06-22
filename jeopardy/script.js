    const EDITOR_CODE = asdk
        /*["W", "F", "N", "k", "a", "z", "=", "="]
  .join("")
  .replace(/ /g, "")
  |> atob;*/
    const MUSIC_DURATION = 32;
    const STORAGE_KEY_BOARD = "jeopardyBoardV2";
    const STORAGE_KEY_STATE = "jeopardyGameStateV2";

    const DEFAULT_BOARD = {
      title: "My Jeopardy Board",
      categories: Array(5).fill(0).map((_, i) => ({
        name: "Category " + (i + 1),
        clues: [200, 400, 600, 800, 1000].map(v => ({
          value: v,
          prompt: "Clue " + v,
          answer: "Answer " + v,
          used: false
        }))
      }))
    };

    function loadBoard() {
      const raw = localStorage.getItem(STORAGE_KEY_BOARD);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_BOARD));
      try {
        return JSON.parse(raw);
      } catch {
        return JSON.parse(JSON.stringify(DEFAULT_BOARD));
      }
    }

    function loadGameState() {
      const raw = localStorage.getItem(STORAGE_KEY_STATE);
      if (!raw) {
        return {
          teams: null,
          activeTeamIndex: 0
        };
      }
      try {
        return JSON.parse(raw);
      } catch {
        return {
          teams: null,
          activeTeamIndex: 0
        };
      }
    }

    let boardData = loadBoard();
    let gameState = loadGameState();

    (function loadSharedBoardFromURL() {
      const params = new URLSearchParams(location.search);
      const encoded = params.get("board");
      if (encoded) {
        try {
          const json = atob(decodeURIComponent(encoded));
          const sharedBoard = JSON.parse(json);
          boardData = sharedBoard;
          saveBoard();
          console.log("Loaded shared board from URL.");
        } catch (e) {
          console.error("Failed to load shared board:", e);
        }
      }
    })();

    function saveBoard() {
      localStorage.setItem(STORAGE_KEY_BOARD, JSON.stringify(boardData));
    }

    function saveGameState() {
      const state = {
        teams,
        activeTeamIndex
      };
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
    }

    let editorMode = false;
    let activeTeamIndex = gameState.activeTeamIndex ?? 0;
    let teams = gameState.teams ?? [
      { name: "Team 1", score: 0 },
      { name: "Team 2", score: 0 }
    ];

    let currentClue = null;
    let timerInterval = null;
    let timerRemaining = 0;
    let clueAlreadyScored = false;

    const gameTitleEl = document.getElementById("gameTitle");
    const boardEl = document.getElementById("board");
    const editorPanelEl = document.getElementById("editorPanel");
    const editorToggleBtn = document.getElementById("editorToggleBtn");
    const titleInput = document.getElementById("titleInput");
    const saveBoardBtn = document.getElementById("saveBoardBtn");
    const resetBoardBtn = document.getElementById("resetBoardBtn");

    const scoreboardEl = document.getElementById("scoreboard");
    const manageTeamsBtn = document.getElementById("manageTeamsBtn");
    const resetTeamsBtn = document.getElementById("resetTeamsBtn");
    const startGameBtn = document.getElementById("startGameBtn");
    const endGameBtn = document.getElementById("endGameBtn");

    const endGameResetContainer = document.getElementById("endGameResetContainer");
    const endGameResetBtn = document.getElementById("endGameResetBtn");

    const modalBackdrop = document.getElementById("modalBackdrop");
    const modalClueTitle = document.getElementById("modalClueTitle");
    const modalContent = document.getElementById("modalContent");
    const modalTimer = document.getElementById("modalTimer");
    const modalShowAnswerBtn = document.getElementById("modalShowAnswerBtn");
    const modalCorrectBtn = document.getElementById("modalCorrectBtn");
    const modalWrongBtn = document.getElementById("modalWrongBtn");
    const modalCloseBtn = document.getElementById("modalCloseBtn");

    const howToPlayBtn = document.getElementById("howToPlayBtn");
    const howToPlayBackdrop = document.getElementById("howToPlayBackdrop");
    const howToPlayCloseBtn = document.getElementById("howToPlayCloseBtn");

    const jeopardyMusic = document.getElementById("jeopardyMusic");
    const blackoutOverlay = document.getElementById("blackoutOverlay");

    function renderTitle() {
      gameTitleEl.textContent = boardData.title;
      titleInput.value = boardData.title;
    }

    function renderBoard() {
      boardEl.innerHTML = "";

      boardData.categories.forEach((cat, catIndex) => {
        const header = document.createElement("div");
        header.className = "category-header";
        header.textContent = cat.name;
        boardEl.appendChild(header);
      });

      const maxClues = Math.max(...boardData.categories.map(c => c.clues.length));

      for (let row = 0; row < maxClues; row++) {
        boardData.categories.forEach((cat, catIndex) => {
          const clue = cat.clues[row];
          const cell = document.createElement("div");
          cell.className = "clue-cell";

          if (!clue) {
            cell.textContent = "";
            cell.style.visibility = "hidden";
          } else {
            cell.textContent = "$" + clue.value;
            if (clue.used) {
              cell.classList.add("used");
            }

            cell.addEventListener("click", () => {
              if (editorMode) {
                openClueEditor(catIndex, row);
              } else {
                openClueModal(catIndex, row);
              }
            });
          }

          boardEl.appendChild(cell);
        });
      }

      checkEndOfGame();
    }

    function renderScoreboard() {
      scoreboardEl.innerHTML = "";
      teams.forEach((team, index) => {
        const div = document.createElement("div");
        div.className = "team";
        if (index === activeTeamIndex) {
          div.classList.add("active");
        }

        const nameEl = document.createElement("div");
        nameEl.className = "team-name";
        nameEl.textContent = team.name;

        const scoreEl = document.createElement("div");
        scoreEl.className = "team-score";
        scoreEl.textContent = team.score;

        div.appendChild(nameEl);
        div.appendChild(scoreEl);

        scoreboardEl.appendChild(div);
      });
    }

    editorToggleBtn.addEventListener("click", () => {
      if (!editorMode) {
        const code = prompt("Enter editor code:");
        if (code !== EDITOR_CODE) {
          alert("Incorrect code.");
          return;
        }
        editorMode = true;
      } else {
        editorMode = false;
      }
      updateEditorVisibility();
    });

    function updateEditorVisibility() {
      editorPanelEl.style.display = editorMode ? "block" : "none";
    }

    titleInput.addEventListener("input", () => {
      boardData.title = titleInput.value;
      renderTitle();
    });

    saveBoardBtn.addEventListener("click", () => {
      saveBoard();
      alert("Board saved.");
    });

    resetBoardBtn.addEventListener("click", () => {
      if (!confirm("Reset board and scores?")) return;
      resetBoardState();
    });

    document.getElementById("shareBoardBtn").addEventListener("click", async () => {
      if (!editorMode) {
        alert("You can only share a board while in Editor Mode.");
        return;
      }

      try {
        const json = JSON.stringify(boardData);
        const encoded = encodeURIComponent(btoa(json));
        const link = `${location.origin}${location.pathname}?board=${encoded}`;

        await navigator.clipboard.writeText(link);
        alert("Share link copied to clipboard!");
      } catch (err) {
        console.error("Copy failed:", err);
        alert("Could not copy link.");
      }
    });

    function openClueEditor(catIndex, clueIndex) {
      const clue = boardData.categories[catIndex].clues[clueIndex];
      const newPrompt = prompt("Edit clue prompt:", clue.prompt);
      if (newPrompt !== null) clue.prompt = newPrompt;

      const newAnswer = prompt("Edit clue answer:", clue.answer);
      if (newAnswer !== null) clue.answer = newAnswer;

      const newValueStr = prompt("Edit clue value:", clue.value);
      if (newValueStr !== null && !isNaN(parseInt(newValueStr))) {
        clue.value = parseInt(newValueStr);
      }

      renderBoard();
      saveBoard();
    }

    function openClueModal(catIndex, clueIndex) {
      currentClue = { catIndex, clueIndex };
      const clue = boardData.categories[catIndex].clues[clueIndex];

      modalClueTitle.textContent = boardData.categories[catIndex].name + " - $" + clue.value;
      modalContent.textContent = clue.prompt;
      modalTimer.textContent = "";
      clueAlreadyScored = clue.used;

      modalShowAnswerBtn.style.display = "inline-block";
      modalCorrectBtn.style.display = clueAlreadyScored ? "none" : "inline-block";
      modalWrongBtn.style.display = clueAlreadyScored ? "none" : "inline-block";

      modalBackdrop.style.display = "flex";

      startMusicAndTimer();
    }

    function closeClueModal() {
      stopMusicAndTimer();
      modalBackdrop.style.display = "none";
      currentClue = null;
    }

    modalCloseBtn.addEventListener("click", () => {
      closeClueModal();
    });

    modalShowAnswerBtn.addEventListener("click", () => {
      if (!currentClue) return;
      const clue = boardData.categories[currentClue.catIndex].clues[currentClue.clueIndex];
      modalContent.textContent = clue.answer;

      stopMusicAndTimer();

      modalShowAnswerBtn.style.display = "none";

      if (!clueAlreadyScored) {
        modalCorrectBtn.style.display = "inline-block";
        modalWrongBtn.style.display = "inline-block";
      } else {
        modalCorrectBtn.style.display = "none";
        modalWrongBtn.style.display = "none";
      }
    });

    modalCorrectBtn.addEventListener("click", () => {
      if (!currentClue) return;
      const clue = boardData.categories[currentClue.catIndex].clues[currentClue.clueIndex];

      if (!clue.used) {
        teams[activeTeamIndex].score += clue.value;
        clue.used = true;
        saveBoard();
        saveGameState();
      }

      renderScoreboard();
      renderBoard();

      advanceToNextTeam();

      closeClueModal();
    });

    modalWrongBtn.addEventListener("click", () => {
      if (!currentClue) return;
      const clue = boardData.categories[currentClue.catIndex].clues[currentClue.clueIndex];

      if (!clue.used) {
        teams[activeTeamIndex].score -= clue.value;
        clue.used = true;
        saveBoard();
        saveGameState();
      }

      renderScoreboard();
      renderBoard();

      advanceToNextTeam();

      closeClueModal();
    });

    function startMusicAndTimer() {
      try {
        jeopardyMusic.currentTime = 0;
        jeopardyMusic.play();
      } catch {}

      timerRemaining = MUSIC_DURATION;
      modalTimer.textContent = "Time: " + timerRemaining + "s";

      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        timerRemaining--;
        if (timerRemaining <= 0) {
          timerRemaining = 0;
          modalTimer.textContent = "Time: 0s";
          clearInterval(timerInterval);
          timerInterval = null;
          handleTimerEndAutoReveal();
        } else {
          modalTimer.textContent = "Time: " + timerRemaining + "s";
        }
      }, 1000);
    }

    function stopMusicAndTimer() {
      try {
        jeopardyMusic.pause();
      } catch {}
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }

    function handleTimerEndAutoReveal() {
      if (!currentClue) return;
      const clue = boardData.categories[currentClue.catIndex].clues[currentClue.clueIndex];

      modalContent.textContent = clue.answer;
      modalShowAnswerBtn.style.display = "none";

      if (!clue.used) {
        teams[activeTeamIndex].score -= clue.value;
        clue.used = true;
        saveBoard();
        saveGameState();
      }

      renderScoreboard();
      renderBoard();

      modalCorrectBtn.style.display = "none";
      modalWrongBtn.style.display = "none";
    }

    function resetBoardState() {
      boardData.categories.forEach(cat => {
        cat.clues.forEach(clue => {
          clue.used = false;
        });
      });

      teams.forEach(team => {
        team.score = 0;
      });

      activeTeamIndex = 0;
      saveBoard();
      saveGameState();
      renderBoard();
      renderScoreboard();
      endGameResetContainer.style.display = "none";
    }

    endGameResetBtn.addEventListener("click", () => {
      if (!confirm("Reset board and scores?")) return;
      resetBoardState();
    });

    function checkEndOfGame() {
      const allUsed = boardData.categories.every(cat =>
        cat.clues.every(clue => clue.used)
      );
      endGameResetContainer.style.display = allUsed ? "block" : "none";
    }

    manageTeamsBtn.addEventListener("click", () => {
      const names = teams.map(t => t.name).join(", ");
      const newNames = prompt(
        "Edit team names (comma-separated):",
        names || "Team 1, Team 2"
      );
      if (newNames === null) return;
      const arr = newNames.split(",").map(s => s.trim()).filter(s => s.length > 0);
      if (arr.length === 0) return;

      if (arr.length === teams.length) {
        teams = arr.map((name, i) => ({
          name,
          score: teams[i].score
        }));
      } else {
        teams = arr.map(name => ({
          name,
          score: 0
        }));
      }

      activeTeamIndex = 0;
      saveGameState();
      renderScoreboard();
    });

    resetTeamsBtn.addEventListener("click", () => {
      if (!confirm("Reset teams (names and scores)?")) return;

      teams = [
        { name: "Team 1", score: 0 },
        { name: "Team 2", score: 0 }
      ];
      activeTeamIndex = 0;
      saveGameState();
      renderScoreboard();
    });

    startGameBtn.addEventListener("click", () => {
      if (teams.length === 0) {
        alert("Add teams first.");
        return;
      }

      const teamEls = Array.from(scoreboardEl.querySelectorAll(".team"));
      if (teamEls.length === 0) {
        alert("No teams to select.");
        return;
      }

      let index = 0;
      let cycles = 0;
      const maxCycles = 20;

      const interval = setInterval(() => {
        teamEls.forEach(el => el.classList.remove("active", "flash"));
        const el = teamEls[index];
        el.classList.add("flash");

        index = (index + 1) % teamEls.length;
        cycles++;

        if (cycles >= maxCycles) {
          clearInterval(interval);

          let newIndex = Math.floor(Math.random() * teams.length);
          if (teams.length > 1 && newIndex === activeTeamIndex) {
            newIndex = (newIndex + 1) % teams.length;
          }
          activeTeamIndex = newIndex;

          renderScoreboard();

          teamEls.forEach(el => el.classList.remove("flash", "active"));
          teamEls[activeTeamIndex].classList.add("active");

          saveGameState();
        }
      }, 100);
    });

    endGameBtn.addEventListener("click", () => {
      if (!confirm("Are you sure you want to end the game and reset the board scores?")) return;

      boardData.categories.forEach(cat => {
        cat.clues.forEach(clue => {
          clue.used = false;
        });
      });

      teams.forEach(team => {
        team.score = 0;
      });

      activeTeamIndex = 0;
      saveBoard();
      saveGameState();
      renderBoard();
      renderScoreboard();

      alert("Game ended. Scores reset, teams kept.");
    });

    howToPlayBtn.addEventListener("click", () => {
      howToPlayBackdrop.style.display = "flex";
    });

    howToPlayCloseBtn.addEventListener("click", () => {
      howToPlayBackdrop.style.display = "none";
    });

    document.addEventListener("contextmenu", e => {
      e.preventDefault();
      triggerBlackout();
    });

    document.addEventListener("keydown", e => {
      if (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === "i" || e.key.toLowerCase() === "u")) {
        e.preventDefault();
        triggerBlackout();
      }
    });

    function triggerBlackout() {
      blackoutOverlay.style.display = "flex";

      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      }

      setTimeout(() => {
        blackoutOverlay.style.display = "none";
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }, 2000);
    }

    function advanceToNextTeam() {
      activeTeamIndex = (activeTeamIndex + 1) % teams.length;
      saveGameState();
      renderScoreboard();
    }

    function init() {
      renderTitle();
      renderBoard();
      renderScoreboard();
      updateEditorVisibility();
    }

    init();
