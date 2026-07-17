import "./activity3.css";

const ORIGINAL_QUESTIONS = [
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

const QUESTIONS = [
  {
    prompt: "The Japanese parliament has approved a bill to relax imperial succession rules, amid concerns over the dwindling size of the imperial family.",
    question: "What is the main purpose of the bill?",
    options: [
      { visual: "Make the imperial family larger", label: "make the imperial family larger" },
      { visual: "Choose a new prime minister", label: "choose a new prime minister" },
      { visual: "Build a new palace", label: "build a new palace" },
    ],
    answer: 0,
  },
  {
    prompt: "The bill was passed by the upper house on Friday.",
    question: "Who passed the bill?",
    options: [
      { visual: "The upper house", label: "the upper house" },
      { visual: "The imperial family", label: "the imperial family" },
      { visual: "The public", label: "the public" },
    ],
    answer: 0,
  },
  {
    prompt: "The bill allows the imperial family to adopt distant male relatives over the age of fifteen.",
    question: "Who may be adopted?",
    options: [
      { visual: "Any child under 15", label: "any child under fifteen" },
      { visual: "Distant male relatives over 15", label: "distant male relatives over fifteen" },
      { visual: "Only foreign relatives", label: "only foreign relatives" },
    ],
    answer: 1,
  },
  {
    prompt: "The bill lets women keep their royal status after marrying outside the family.",
    question: "What can women keep after marrying outside the family?",
    options: [
      { visual: "Their royal status", label: "their royal status" },
      { visual: "A seat in parliament", label: "a seat in parliament" },
      { visual: "The imperial palace", label: "the imperial palace" },
    ],
    answer: 0,
  },
  {
    prompt: "But it does not change the law barring women from ascending the throne.",
    question: "Which rule does the bill NOT change?",
    options: [
      { visual: "Women cannot ascend the throne", label: "women cannot ascend the throne" },
      { visual: "Relatives must be over 15", label: "relatives must be over fifteen" },
      { visual: "Women may keep royal status", label: "women may keep royal status" },
    ],
    answer: 0,
  },
  {
    prompt: "There is wide public support for a female emperor.",
    question: "What does much of the public support?",
    options: [
      { visual: "A smaller parliament", label: "a smaller parliament" },
      { visual: "A female emperor", label: "a female emperor" },
      { visual: "Ending the imperial family", label: "ending the imperial family" },
    ],
    answer: 1,
  },
  {
    prompt: "Princess Aiko is the only child of the current emperor.",
    question: "Who is Princess Aiko?",
    options: [
      { visual: "The emperor's only child", label: "the emperor's only child" },
      { visual: "A member of the upper house", label: "a member of the upper house" },
      { visual: "A distant relative", label: "a distant relative" },
    ],
    answer: 0,
  },
  {
    prompt: "Princess Aiko is still not eligible to succeed the throne.",
    question: "After the bill, can Princess Aiko succeed the throne?",
    options: [
      { visual: "Yes, immediately", label: "yes, immediately" },
      { visual: "Only after age 15", label: "only after age fifteen" },
      { visual: "No, she is still not eligible", label: "no, she is still not eligible" },
    ],
    answer: 2,
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
        <div class="listening-title"><span aria-hidden="true">🎙️</span> <strong>Royal News Listening Mission</strong></div>
        <div class="listening-score"><span id="listeningScore">0</span>/${QUESTIONS.length}</div>
      </header>

      <section class="listening-map-progress" aria-label="News mission progress">
        ${QUESTIONS.map((_, index) => `<span class="map-step" data-step="${index}">${index + 1}</span>`).join("")}
        <span class="map-treasure" aria-hidden="true">📰</span>
      </section>

      <section class="listening-card">
        <p class="listening-round" id="listeningRound">Clue 1 of ${QUESTIONS.length}</p>
        <div class="listening-character" aria-hidden="true">🎧</div>
        <h1>Listen to the news!</h1>
        <p class="listening-help" id="listeningHelp">You can replay each short report.</p>
        <button class="listening-play-button" id="listeningPlayButton" type="button" aria-label="Play the news excerpt"><span aria-hidden="true">🔊</span> Play report</button>
        <h2 class="listening-question" id="listeningQuestion"></h2>
        <div class="listening-feedback" id="listeningFeedback" aria-live="polite"></div>
        <div class="listening-options" id="listeningOptions"></div>
      </section>
    </main>
  `;

  const scoreDisplay = container.querySelector("#listeningScore");
  const roundDisplay = container.querySelector("#listeningRound");
  const help = container.querySelector("#listeningHelp");
  const questionDisplay = container.querySelector("#listeningQuestion");
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
    speech.rate = 0.78;
    speech.pitch = 1.04;
    window.speechSynthesis.speak(speech);
  }

  function renderQuestion() {
    const question = QUESTIONS[questionIndex];
    acceptingAnswer = true;
    roundDisplay.textContent = `Clue ${questionIndex + 1} of ${QUESTIONS.length}`;
    help.textContent = "Listen for the key information, then choose an answer.";
    questionDisplay.textContent = question.question;
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
      const answerText = document.createElement("span");
      answerText.className = "listening-visual listening-text-option";
      answerText.textContent = option.visual;
      button.appendChild(answerText);
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
      feedback.textContent = "Correct—good listening! ⭐";
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
      ? "Excellent news listening!"
      : score >= 5
        ? "Good work—you caught the key details!"
        : "Nice start—replay the report and try again!";

    container.innerHTML = `
      <main class="treasure-results-screen">
        <section class="treasure-results-card">
          <div class="treasure-chest" aria-hidden="true">📰</div>
          <p class="result-label">All three activities complete</p>
          <h1>News Mission Complete!</h1>
          <p>${levelMessage}</p>
          <div class="listening-final-score">${score} / ${QUESTIONS.length} <small>${percentage}%</small></div>
          <div class="reward-coupon">
            <span>⭐ ENGLISH NEWS STAR ⭐</span>
            <strong>LISTENING REPORTER COUPON</strong>
            <p>Reward: Choose a fun treat or activity!</p>
          </div>
          <div class="result-actions">
            <button class="app-button app-button-primary" id="listeningAgainButton" type="button">Replay News Mission</button>
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
