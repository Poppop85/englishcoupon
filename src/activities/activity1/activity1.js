import "./activity1.css";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const TOTAL_GOALS = 10;
const DOG_IMAGE_URL = `${import.meta.env.BASE_URL}assets/dog-kicker.png`;

export function renderAlphabetGoalGame(
  container,
  onExit,
  onComplete = onExit,
) {
  let targetLetter = "";
  let currentLetters = [];
  let goalsScored = 0;
  let acceptingAnswer = false;
  let nextRoundTimer = null;
  let speechTimer = null;

  container.innerHTML = `
    <main class="football-game">
      <header class="football-header">
        <button
          class="app-button app-button-secondary app-button-small"
          id="homeButton"
          type="button"
        >
          Home
        </button>

        <div class="football-title">
          <span aria-hidden="true">⚽</span>
          <strong>Alphabet Goal</strong>
        </div>

        <div class="score-display">
          <span aria-hidden="true">⭐</span>
          <span id="scoreNumber">0</span>/${TOTAL_GOALS}
        </div>
      </header>

      <section class="instruction-card">
        <p class="round-text" id="roundText">
          Goal 1 of ${TOTAL_GOALS}
        </p>

        <div class="instruction-row">
          <p id="instructionText">Listen carefully!</p>

          <button
            class="listen-button"
            id="listenButton"
            type="button"
            aria-label="Hear the target letter again"
          >
            🔊
          </button>
        </div>

        <p class="feedback-message" id="feedbackMessage"></p>
      </section>

      <section class="football-pitch" id="footballPitch">
        <div class="stadium-lights stadium-lights-left"></div>
        <div class="stadium-lights stadium-lights-right"></div>

        <div class="crowd crowd-left"></div>
        <div class="crowd crowd-right"></div>

        <div class="pitch-lines" aria-hidden="true">
          <div class="centre-circle"></div>
          <div class="centre-line"></div>
        </div>

        <div class="goals-row" id="goalsRow"></div>

        <div class="ball-zone">
          <img
            class="dog-kicker"
            id="dogKicker"
            src="${DOG_IMAGE_URL}"
            alt="A friendly dog football player"
          />

          <button
            class="football"
            id="football"
            type="button"
            aria-label="Football"
            disabled
          >
            ⚽
          </button>

          <div class="kick-shadow" id="kickShadow"></div>
        </div>

        <div class="celebration-layer" id="celebrationLayer"></div>
      </section>

      <footer class="football-footer">
        <div class="progress-track">
          <div class="progress-fill" id="progressFill"></div>
        </div>

        <p>Tap the correct goal to kick the ball.</p>
      </footer>
    </main>
  `;

  const scoreNumber = container.querySelector("#scoreNumber");
  const roundText = container.querySelector("#roundText");
  const instructionText = container.querySelector("#instructionText");
  const feedbackMessage = container.querySelector("#feedbackMessage");
  const listenButton = container.querySelector("#listenButton");
  const homeButton = container.querySelector("#homeButton");
  const goalsRow = container.querySelector("#goalsRow");
  const dogKicker = container.querySelector("#dogKicker");
  const football = container.querySelector("#football");
  const kickShadow = container.querySelector("#kickShadow");
  const progressFill = container.querySelector("#progressFill");
  const celebrationLayer = container.querySelector("#celebrationLayer");

  homeButton.addEventListener("click", () => {
    clearTimeout(nextRoundTimer);
    clearTimeout(speechTimer);
    window.speechSynthesis?.cancel();
    onExit();
  });

  listenButton.addEventListener("click", speakInstruction);

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffle(items) {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));

      [copy[index], copy[randomIndex]] = [
        copy[randomIndex],
        copy[index],
      ];
    }

    return copy;
  }

  function createGoalLetters() {
    const distractors = shuffle(
      ALPHABET.filter((letter) => letter !== targetLetter),
    ).slice(0, 2);

    return shuffle([targetLetter, ...distractors]);
  }

  function speakInstruction() {
    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      feedbackMessage.textContent =
        `Audio is unavailable. Find the letter ${targetLetter}.`;
      return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(
      `Kick the letter ${targetLetter}`,
    );

    speech.lang = "en-US";
    speech.rate = 0.78;
    speech.pitch = 1.08;
    speech.volume = 1;

    window.speechSynthesis.speak(speech);
  }

  function createGoals() {
    goalsRow.innerHTML = "";

    currentLetters.forEach((letter, goalIndex) => {
      const goalButton = document.createElement("button");

      goalButton.type = "button";
      goalButton.className = "letter-goal";
      goalButton.dataset.letter = letter;
      goalButton.dataset.goalIndex = String(goalIndex);

      goalButton.setAttribute(
        "aria-label",
        `Kick into the goal marked ${letter}`,
      );

      goalButton.innerHTML = `
        <span class="goal-frame" aria-hidden="true">
          <span class="goal-top"></span>
          <span class="goal-post goal-post-left"></span>
          <span class="goal-post goal-post-right"></span>
          <span class="goal-net"></span>
        </span>

        <span class="goal-letter">${letter}</span>
      `;

      goalButton.addEventListener("click", () => {
        handleGoalSelection(goalButton);
      });

      goalsRow.appendChild(goalButton);
    });
  }

  function disableGoals() {
    goalsRow.querySelectorAll(".letter-goal").forEach((goal) => {
      goal.disabled = true;
    });
  }

  function enableGoals() {
    goalsRow.querySelectorAll(".letter-goal").forEach((goal) => {
      goal.disabled = false;
    });
  }

  function resetBall() {
    dogKicker.className = "dog-kicker";
    football.className = "football";
    football.style.removeProperty("--kick-x");
    football.style.removeProperty("--kick-y");

    kickShadow.className = "kick-shadow";
  }

  function getBallMovement(goalButton) {
    const pitch = container.querySelector("#footballPitch");
    const ballRect = football.getBoundingClientRect();
    const goalRect = goalButton.getBoundingClientRect();
    const pitchRect = pitch.getBoundingClientRect();

    const ballCentreX =
      ballRect.left - pitchRect.left + ballRect.width / 2;

    const ballCentreY =
      ballRect.top - pitchRect.top + ballRect.height / 2;

    const goalCentreX =
      goalRect.left - pitchRect.left + goalRect.width / 2;

    const goalTargetY =
      goalRect.top - pitchRect.top + goalRect.height * 0.6;

    return {
      x: goalCentreX - ballCentreX,
      y: goalTargetY - ballCentreY,
    };
  }

  function animateKick(goalButton, isCorrect) {
    const movement = getBallMovement(goalButton);

    football.style.setProperty("--kick-x", `${movement.x}px`);
    football.style.setProperty("--kick-y", `${movement.y}px`);

    football.classList.add(
      isCorrect ? "football-kick-correct" : "football-kick-wrong",
    );

    dogKicker.classList.add(
      isCorrect ? "dog-kick-correct" : "dog-kick-wrong",
    );

    kickShadow.classList.add("kick-shadow-moving");

    goalButton.classList.add(
      isCorrect ? "goal-correct" : "goal-wrong",
    );
  }

  function createCelebration() {
    celebrationLayer.innerHTML = "";

    const symbols = ["⭐", "✨", "🎉", "⚽", "🌟"];

    for (let index = 0; index < 18; index += 1) {
      const particle = document.createElement("span");

      particle.className = "celebration-particle";
      particle.textContent = randomItem(symbols);

      particle.style.setProperty(
        "--particle-x",
        `${Math.random() * 100}%`,
      );

      particle.style.setProperty(
        "--particle-delay",
        `${Math.random() * 0.35}s`,
      );

      particle.style.setProperty(
        "--particle-size",
        `${18 + Math.random() * 24}px`,
      );

      celebrationLayer.appendChild(particle);
    }

    setTimeout(() => {
      celebrationLayer.innerHTML = "";
    }, 1400);
  }

  function handleGoalSelection(goalButton) {
    if (!acceptingAnswer) {
      return;
    }

    acceptingAnswer = false;
    disableGoals();

    const selectedLetter = goalButton.dataset.letter;
    const isCorrect = selectedLetter === targetLetter;

    animateKick(goalButton, isCorrect);

    if (isCorrect) {
      goalsScored += 1;

      scoreNumber.textContent = String(goalsScored);
      feedbackMessage.textContent = "GOAL! Fantastic! ⭐";
      feedbackMessage.className =
        "feedback-message feedback-success";

      progressFill.style.width =
        `${(goalsScored / TOTAL_GOALS) * 100}%`;

      createCelebration();

      nextRoundTimer = setTimeout(() => {
        if (goalsScored >= TOTAL_GOALS) {
          showResults();
          return;
        }

        startRound();
      }, 1250);
    } else {
      feedbackMessage.textContent =
        `Almost! Listen again and find ${targetLetter}.`;

      feedbackMessage.className =
        "feedback-message feedback-incorrect";

      nextRoundTimer = setTimeout(() => {
        resetBall();

        goalButton.classList.remove("goal-wrong");

        feedbackMessage.textContent =
          `Try again: kick the letter ${targetLetter}.`;

        feedbackMessage.className = "feedback-message";

        acceptingAnswer = true;
        enableGoals();
        speakInstruction();
      }, 1050);
    }
  }

  function startRound() {
    resetBall();

    targetLetter = randomItem(ALPHABET);
    currentLetters = createGoalLetters();
    acceptingAnswer = true;

    roundText.textContent =
      `Goal ${goalsScored + 1} of ${TOTAL_GOALS}`;

    instructionText.textContent = "Which goal is correct?";

    feedbackMessage.textContent = "";
    feedbackMessage.className = "feedback-message";

    createGoals();

    clearTimeout(speechTimer);
    speechTimer = setTimeout(speakInstruction, 350);
  }

  function showResults() {
    clearTimeout(speechTimer);
    window.speechSynthesis?.cancel();

    container.innerHTML = `
      <main class="goal-results-screen">
        <section class="goal-results-card">
          <div class="result-football" aria-hidden="true">
            ⚽
          </div>

          <p class="result-label">Activity complete</p>

          <h1>Super Striker!</h1>

          <p>You scored all ten alphabet goals.</p>

          <div class="result-score">
            ${goalsScored} / ${TOTAL_GOALS}
          </div>

          <div class="result-stars" aria-hidden="true">
            ⭐ ⭐ ⭐
          </div>

          <div class="result-actions">
            <button
              class="app-button app-button-primary"
              id="playAgainButton"
              type="button"
            >
              Play Again
            </button>

            <button
              class="app-button app-button-secondary"
              id="finishButton"
              type="button"
            >
              Finish Activity
            </button>
          </div>
        </section>
      </main>
    `;

    container
      .querySelector("#playAgainButton")
      .addEventListener("click", () => {
        renderAlphabetGoalGame(container, onExit);
      });

    container
      .querySelector("#finishButton")
      .addEventListener("click", () => {
        container.innerHTML = `
          <main class="goal-results-screen">
            <section class="goal-results-card">
              <div class="result-football" aria-hidden="true">
                🏆
              </div>

              <p class="result-label">Well done!</p>

              <h1>Activity 1 Complete</h1>

              <p>Next up: slice the falling letters!</p>

              <button
                class="app-button app-button-primary"
                id="continueButton"
                type="button"
              >
                Start Activity 2
              </button>
            </section>
          </main>
        `;

        container
          .querySelector("#continueButton")
          .addEventListener("click", onComplete);
      });
  }

  startRound();
}
