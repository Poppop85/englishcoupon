import "./activity2.css";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const TARGET_SCORE = 10;
const STARTING_LIVES = 3;

export function renderAlphabetNinjaGame(
  container,
  onExit,
  onComplete = onExit,
) {
  let targetLetter = "";
  let score = 0;
  let lives = STARTING_LIVES;
  let roundId = 0;
  let targetOnScreen = false;
  let distractorsSinceTarget = 0;
  let spawnTimer = null;
  let speechTimer = null;
  let acceptingInput = true;

  container.innerHTML = `
    <main class="ninja-game">
      <header class="ninja-header">
        <button class="app-button app-button-secondary app-button-small" id="ninjaHomeButton" type="button">Home</button>
        <div class="ninja-title"><span aria-hidden="true">🥷</span> <strong>Alphabet Ninja</strong></div>
        <div class="ninja-score"><span id="ninjaScore">0</span>/${TARGET_SCORE}</div>
      </header>

      <section class="ninja-instruction">
        <p>Slice the letter</p>
        <div class="ninja-target-row">
          <strong class="ninja-target" id="ninjaTarget">A</strong>
          <button class="listen-button" id="ninjaListenButton" type="button" aria-label="Hear the target letter again">🔊</button>
        </div>
        <p class="ninja-feedback" id="ninjaFeedback">Tap the correct falling letter!</p>
      </section>

      <section class="ninja-arena" id="ninjaArena" aria-label="Falling letter game area">
        <div class="ninja-sky-decoration" aria-hidden="true">☁️</div>
        <div class="ninja-sky-decoration ninja-cloud-right" aria-hidden="true">☁️</div>
        <div class="ninja-slice-layer" id="ninjaSliceLayer"></div>
      </section>

      <footer class="ninja-footer">
        <div class="ninja-lives" id="ninjaLives" aria-label="3 lives">❤️ ❤️ ❤️</div>
        <div class="progress-track"><div class="progress-fill ninja-progress" id="ninjaProgress"></div></div>
      </footer>
    </main>
  `;

  const arena = container.querySelector("#ninjaArena");
  const scoreDisplay = container.querySelector("#ninjaScore");
  const targetDisplay = container.querySelector("#ninjaTarget");
  const feedback = container.querySelector("#ninjaFeedback");
  const livesDisplay = container.querySelector("#ninjaLives");
  const progress = container.querySelector("#ninjaProgress");
  const sliceLayer = container.querySelector("#ninjaSliceLayer");

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function speakTarget() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(`Slice the letter ${targetLetter}`);
    speech.lang = "en-US";
    speech.rate = 0.78;
    speech.pitch = 1.08;
    window.speechSynthesis.speak(speech);
  }

  function updateLives() {
    livesDisplay.textContent = `${"❤️ ".repeat(lives)}${"🤍 ".repeat(STARTING_LIVES - lives)}`.trim();
    livesDisplay.setAttribute("aria-label", `${lives} ${lives === 1 ? "life" : "lives"}`);
  }

  function clearFallingLetters() {
    arena.querySelectorAll(".falling-letter").forEach((letter) => letter.remove());
    targetOnScreen = false;
    distractorsSinceTarget = 0;
  }

  function showSlice(letterButton, isCorrect) {
    const letterRect = letterButton.getBoundingClientRect();
    const arenaRect = arena.getBoundingClientRect();
    const mark = document.createElement("span");
    mark.className = isCorrect ? "slice-mark slice-correct" : "slice-mark slice-wrong";
    mark.textContent = isCorrect ? "✨" : "💥";
    mark.style.left = `${letterRect.left - arenaRect.left + letterRect.width / 2}px`;
    mark.style.top = `${letterRect.top - arenaRect.top + letterRect.height / 2}px`;
    sliceLayer.appendChild(mark);
    setTimeout(() => mark.remove(), 650);
  }

  function loseLife(message) {
    lives -= 1;
    updateLives();
    feedback.textContent = message;
    feedback.className = "ninja-feedback ninja-feedback-wrong";

    if (lives <= 0) {
      finishGame(false);
    }
  }

  function chooseNextTarget() {
    roundId += 1;
    targetLetter = randomItem(ALPHABET);
    targetDisplay.textContent = targetLetter;
    feedback.textContent = `Find ${targetLetter}!`;
    feedback.className = "ninja-feedback";
    clearFallingLetters();
    clearTimeout(speechTimer);
    speechTimer = setTimeout(speakTarget, 250);
  }

  function handleLetter(letterButton) {
    if (!acceptingInput || letterButton.dataset.clicked === "true") {
      return;
    }

    letterButton.dataset.clicked = "true";
    const isCorrect = letterButton.dataset.isTarget === "true" && Number(letterButton.dataset.round) === roundId;
    showSlice(letterButton, isCorrect);
    letterButton.classList.add(isCorrect ? "letter-sliced" : "letter-bumped");

    if (isCorrect) {
      acceptingInput = false;
      score += 1;
      scoreDisplay.textContent = String(score);
      progress.style.width = `${(score / TARGET_SCORE) * 100}%`;
      feedback.textContent = "Great slice! ✨";
      feedback.className = "ninja-feedback ninja-feedback-correct";

      setTimeout(() => {
        if (score >= TARGET_SCORE) {
          finishGame(true);
          return;
        }

        acceptingInput = true;
        chooseNextTarget();
      }, 500);
    } else {
      loseLife(`Oops! Find ${targetLetter}.`);
      setTimeout(() => letterButton.remove(), 260);
    }
  }

  function spawnLetter() {
    if (!acceptingInput || lives <= 0 || score >= TARGET_SCORE) {
      return;
    }

    const shouldSpawnTarget = !targetOnScreen && (distractorsSinceTarget >= 2 || Math.random() < 0.34);
    const letter = shouldSpawnTarget
      ? targetLetter
      : randomItem(ALPHABET.filter((item) => item !== targetLetter));
    const letterButton = document.createElement("button");
    const duration = Math.max(2.35, 4.2 - score * 0.13);

    letterButton.type = "button";
    letterButton.className = "falling-letter";
    letterButton.textContent = letter;
    letterButton.style.left = `${6 + Math.random() * 80}%`;
    letterButton.style.setProperty("--fall-duration", `${duration}s`);
    letterButton.style.setProperty("--letter-rotation", `${-18 + Math.random() * 36}deg`);
    letterButton.dataset.isTarget = String(shouldSpawnTarget);
    letterButton.dataset.round = String(roundId);
    letterButton.setAttribute("aria-label", `Letter ${letter}`);

    if (shouldSpawnTarget) {
      targetOnScreen = true;
      distractorsSinceTarget = 0;
    } else {
      distractorsSinceTarget += 1;
    }

    letterButton.addEventListener("click", () => handleLetter(letterButton));
    letterButton.addEventListener("animationend", () => {
      if (letterButton.dataset.isTarget === "true" && Number(letterButton.dataset.round) === roundId && letterButton.dataset.clicked !== "true") {
        targetOnScreen = false;
        loseLife(`The ${targetLetter} escaped!`);
      }
      letterButton.remove();
    });

    arena.appendChild(letterButton);
  }

  function scheduleSpawn() {
    spawnLetter();
    const delay = Math.max(440, 850 - score * 35);
    spawnTimer = setTimeout(scheduleSpawn, delay);
  }

  function cleanup() {
    clearTimeout(spawnTimer);
    clearTimeout(speechTimer);
    window.speechSynthesis?.cancel();
  }

  function finishGame(won) {
    acceptingInput = false;
    cleanup();
    container.innerHTML = `
      <main class="ninja-results-screen">
        <section class="ninja-results-card">
          <div class="ninja-result-icon" aria-hidden="true">${won ? "🏆" : "🥷"}</div>
          <p class="result-label">Activity 2</p>
          <h1>${won ? "Alphabet Ninja!" : "Good Try!"}</h1>
          <p>${won ? "You sliced all ten target letters." : `You sliced ${score} of ${TARGET_SCORE} target letters.`}</p>
          <div class="result-score">${score} / ${TARGET_SCORE}</div>
          <div class="result-actions">
            <button class="app-button app-button-primary" id="ninjaAgainButton" type="button">Play Again</button>
            <button class="app-button app-button-secondary" id="ninjaFinishButton" type="button">${won ? "Start Activity 3" : "Return Home"}</button>
          </div>
        </section>
      </main>
    `;

    container.querySelector("#ninjaAgainButton").addEventListener("click", () => renderAlphabetNinjaGame(container, onExit, onComplete));
    container.querySelector("#ninjaFinishButton").addEventListener("click", won ? onComplete : onExit);
  }

  container.querySelector("#ninjaHomeButton").addEventListener("click", () => {
    cleanup();
    onExit();
  });
  container.querySelector("#ninjaListenButton").addEventListener("click", speakTarget);

  updateLives();
  chooseNextTarget();
  scheduleSpawn();
}
