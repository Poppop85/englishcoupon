import "./activity3.css";

const QUESTIONS = [
  {
    prompt: "Choose the red apple.",
    options: [
      { visual: "🍎", label: "red apple" },
      { visual: "🍏", label: "green apple" },
      { visual: "🍌", label: "banana" },
    ],
    answer: 0,
  },
  {
    prompt: "I can see three stars.",
    options: [
      { visual: "⭐", label: "one star" },
      { visual: "⭐⭐⭐", label: "three stars" },
      { visual: "⭐⭐", label: "two stars" },
    ],
    answer: 1,
  },
  {
    prompt: "The boy is running.",
    options: [
      { visual: "🧍", label: "standing" },
      { visual: "😴", label: "sleeping" },
      { visual: "🏃", label: "running" },
    ],
    answer: 2,
  },
  {
    prompt: "It is raining today.",
    options: [
      { visual: "☀️", label: "sunny" },
      { visual: "🌧️", label: "raining" },
      { visual: "❄️", label: "snowing" },
    ],
    answer: 1,
  },
  {
    prompt: "She is very happy.",
    options: [
      { visual: "😢", label: "sad" },
      { visual: "😀", label: "happy" },
      { visual: "😴", label: "tired" },
    ],
    answer: 1,
  },
  {
    prompt: "I eat a banana for breakfast.",
    options: [
      { visual: "🍞", label: "bread" },
      { visual: "🍌", label: "banana" },
      { visual: "🥚", label: "egg" },
    ],
    answer: 1,
  },
  {
    prompt: "We go to school by bus.",
    options: [
      { visual: "🚲", label: "bicycle" },
      { visual: "🚗", label: "car" },
      { visual: "🚌", label: "bus" },
    ],
    answer: 2,
  },
  {
    prompt: "The cat is under the table.",
    options: [
      { visual: "🐈\n────────", label: "cat above the table" },
      { visual: "────────\n🐈", label: "cat under the table" },
      { visual: "🐈  🚪", label: "cat next to the door" },
    ],
    answer: 1,
  },
];

export function renderListeningTreasureHunt(container, onExit) {
  let questionIndex = 0;
  let score = 0;
  let acceptingAnswer = true;
  let speechTimer = null;

  container.innerHTML = `
    <main class="listening-game">
      <header class="listening-header">
        <button class="app-button app-button-secondary app-button-small" id="listeningHomeButton" type="button">Home</button>
        <div class="listening-title"><span aria-hidden="true">🗺️</span> <strong>Listening Treasure Hunt</strong></div>
        <div class="listening-score"><span id="listeningScore">0</span>/${QUESTIONS.length}</div>
      </header>

      <section class="listening-map-progress" aria-label="Treasure hunt progress">
        ${QUESTIONS.map((_, index) => `<span class="map-step" data-step="${index}">${index + 1}</span>`).join("")}
        <span class="map-treasure" aria-hidden="true">🎁</span>
      </section>

      <section class="listening-card">
        <p class="listening-round" id="listeningRound">Clue 1 of ${QUESTIONS.length}</p>
        <div class="listening-character" aria-hidden="true">🧭</div>
        <h1>Listen to the clue!</h1>
        <p class="listening-help" id="listeningHelp">Tap the speaker if you want to hear it again.</p>
        <button class="listening-play-button" id="listeningPlayButton" type="button" aria-label="Play the listening clue"><span aria-hidden="true">🔊</span> Play clue</button>
        <div class="listening-feedback" id="listeningFeedback" aria-live="polite"></div>
        <div class="listening-options" id="listeningOptions"></div>
      </section>
    </main>
  `;

  const scoreDisplay = container.querySelector("#listeningScore");
  const roundDisplay = container.querySelector("#listeningRound");
  const help = container.querySelector("#listeningHelp");
  const feedback = container.querySelector("#listeningFeedback");
  const options = container.querySelector("#listeningOptions");

  function speakClue() {
    const question = QUESTIONS[questionIndex];

    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      help.textContent = question.prompt;
      return;
    }

    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(question.prompt);
    speech.lang = "en-US";
    speech.rate = 0.82;
    speech.pitch = 1.04;
    window.speechSynthesis.speak(speech);
  }

  function renderQuestion() {
    const question = QUESTIONS[questionIndex];
    acceptingAnswer = true;
    roundDisplay.textContent = `Clue ${questionIndex + 1} of ${QUESTIONS.length}`;
    help.textContent = "Tap the speaker if you want to hear it again.";
    feedback.textContent = "";
    feedback.className = "listening-feedback";
    options.innerHTML = "";

    container.querySelectorAll(".map-step").forEach((step, index) => {
      step.classList.toggle("map-step-complete", index < questionIndex);
      step.classList.toggle("map-step-current", index === questionIndex);
    });

    question.options.forEach((option, optionIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "listening-option";
      button.setAttribute("aria-label", option.label);
      button.innerHTML = `<span class="listening-visual" aria-hidden="true">${option.visual}</span>`;
      button.addEventListener("click", () => selectAnswer(button, optionIndex));
      options.appendChild(button);
    });

    clearTimeout(speechTimer);
    speechTimer = setTimeout(speakClue, 350);
  }

  function selectAnswer(selectedButton, selectedIndex) {
    if (!acceptingAnswer) {
      return;
    }

    acceptingAnswer = false;
    window.speechSynthesis?.cancel();
    const question = QUESTIONS[questionIndex];
    const isCorrect = selectedIndex === question.answer;
    const allButtons = [...options.querySelectorAll(".listening-option")];
    allButtons.forEach((button) => { button.disabled = true; });

    if (isCorrect) {
      score += 1;
      scoreDisplay.textContent = String(score);
      selectedButton.classList.add("listening-option-correct");
      feedback.textContent = "You found the clue! ⭐";
      feedback.className = "listening-feedback listening-feedback-correct";
    } else {
      selectedButton.classList.add("listening-option-wrong");
      allButtons[question.answer].classList.add("listening-option-correct");
      feedback.textContent = `The answer was: ${question.options[question.answer].label}.`;
      feedback.className = "listening-feedback listening-feedback-wrong";
    }

    setTimeout(() => {
      questionIndex += 1;
      if (questionIndex >= QUESTIONS.length) {
        showResults();
      } else {
        renderQuestion();
      }
    }, 1250);
  }

  function showResults() {
    clearTimeout(speechTimer);
    window.speechSynthesis?.cancel();
    const percentage = Math.round((score / QUESTIONS.length) * 100);
    const levelMessage = score >= 7
      ? "Excellent A1 listening!"
      : score >= 5
        ? "Good listening—keep practising!"
        : "Nice start—listen and try again!";

    container.innerHTML = `
      <main class="treasure-results-screen">
        <section class="treasure-results-card">
          <div class="treasure-chest" aria-hidden="true">🎁</div>
          <p class="result-label">All three activities complete</p>
          <h1>Treasure Found!</h1>
          <p>${levelMessage}</p>
          <div class="listening-final-score">${score} / ${QUESTIONS.length} <small>${percentage}%</small></div>
          <div class="reward-coupon">
            <span>⭐ ENGLISH STAR ⭐</span>
            <strong>SUPER LEARNER COUPON</strong>
            <p>Reward: Choose a fun treat or activity!</p>
          </div>
          <div class="result-actions">
            <button class="app-button app-button-primary" id="listeningAgainButton" type="button">Try Assessment Again</button>
            <button class="app-button app-button-secondary" id="listeningFinishButton" type="button">Return Home</button>
          </div>
        </section>
      </main>
    `;

    container.querySelector("#listeningAgainButton").addEventListener("click", () => renderListeningTreasureHunt(container, onExit));
    container.querySelector("#listeningFinishButton").addEventListener("click", onExit);
  }

  function cleanup() {
    clearTimeout(speechTimer);
    window.speechSynthesis?.cancel();
  }

  container.querySelector("#listeningHomeButton").addEventListener("click", () => {
    cleanup();
    onExit();
  });
  container.querySelector("#listeningPlayButton").addEventListener("click", speakClue);

  renderQuestion();
}
