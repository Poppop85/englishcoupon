import "./activity4.css";

const TARGET_JUMPS = 10;

// Original modern messages inspired by themes of change, patience, and balance.
const INSPIRATIONAL_QUOTES = [
  "Begin with courage. A small, sincere action can open a new path.",
  "Strength also means listening. Make room for the help life is offering.",
  "A hard beginning is not a bad sign. Grow patiently through the confusion.",
  "Preparation is progress. Use this pause to become ready for your moment.",
  "Let your inner values and outward actions support one another today.",
  "Quiet confidence travels far. Let your work speak without forcing attention.",
  "Move toward what gives you honest energy, then share that energy kindly.",
  "You can always return to what matters. One good choice begins the journey home.",
  "When the way is uncertain, choose the next safe step instead of the whole road.",
  "Keep close to what brings clarity, warmth, and meaning to your life.",
  "Lasting change is built through gentle actions repeated with care.",
  "Release what no longer needs to be carried. Your energy has better work to do.",
  "Steady growth may look small today, but every honest step raises you.",
  "Change becomes wise when the time is right and your purpose is clear.",
  "Trust gradual progress. Roots deepen before branches reach the sky.",
  "Celebrate what is finished, then care for it so the good result can last.",
];

function randomQuote() {
  return INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)];
}

export function renderLuksongBakaGame(container, onExit) {
  let score = 0;
  let round = 0;
  let playing = true;
  let jumping = false;
  let collided = false;
  let animationFrame = null;
  let restartTimer = null;
  let stopped = false;
  let audioContext = null;
  let musicTimer = null;
  let musicEnabled = true;
  let musicStep = 0;

  container.innerHTML = `
    <main class="baka-game">
      <header class="baka-header">
        <button class="app-button app-button-secondary app-button-small" id="bakaStopButton" type="button">Stop</button>
        <div class="baka-title"><span aria-hidden="true">🐄</span> <strong>Luksong Baka</strong></div>
        <button class="baka-audio-button" id="bakaAudioButton" type="button" aria-label="Turn music off" aria-pressed="true">🔊</button>
        <div class="baka-score"><span id="bakaScore">0</span>/${TARGET_JUMPS}</div>
      </header>

      <section class="baka-instruction">
        <p id="bakaRound">Jump 1 of ${TARGET_JUMPS}</p>
        <h1>Jump over the cow!</h1>
        <p class="baka-feedback" id="bakaFeedback" aria-live="polite">Tap JUMP when the cow gets close.</p>
      </section>

      <section class="baka-field" id="bakaField" aria-label="Luksong Baka game area">
        <div class="baka-cloud baka-cloud-one" aria-hidden="true">☁️</div>
        <div class="baka-cloud baka-cloud-two" aria-hidden="true">☁️</div>
        <div class="baka-hills" aria-hidden="true"></div>
        <div class="baka-ground" aria-hidden="true"></div>
        <div class="baka-runner" id="bakaRunner" role="img" aria-label="Running child">
          <span class="runner-emoji" aria-hidden="true">🏃</span>
          <span class="runner-shadow" aria-hidden="true"></span>
        </div>
        <div class="baka-obstacle" id="bakaObstacle" role="img" aria-label="Cow obstacle">🐄</div>
        <div class="baka-reward-layer" id="bakaRewardLayer" aria-live="polite"></div>
      </section>

      <footer class="baka-controls">
        <div class="baka-progress" aria-label="Jump progress"><div id="bakaProgress"></div></div>
        <button class="baka-jump-button" id="bakaJumpButton" type="button">JUMP!</button>
        <div class="baka-milk-count" id="bakaMilkCount" aria-label="0 milk rewards">🥛 0/${TARGET_JUMPS}</div>
      </footer>
    </main>
  `;

  const field = container.querySelector("#bakaField");
  const runner = container.querySelector("#bakaRunner");
  const obstacle = container.querySelector("#bakaObstacle");
  const jumpButton = container.querySelector("#bakaJumpButton");
  const feedback = container.querySelector("#bakaFeedback");
  const roundDisplay = container.querySelector("#bakaRound");
  const scoreDisplay = container.querySelector("#bakaScore");
  const progress = container.querySelector("#bakaProgress");
  const rewardLayer = container.querySelector("#bakaRewardLayer");
  const milkCount = container.querySelector("#bakaMilkCount");
  const audioButton = container.querySelector("#bakaAudioButton");

  function ensureAudio() {
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      audioContext = new AudioContext();
    }
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function playTone(frequency, delay = 0, duration = 0.16, volume = 0.035, type = "triangle") {
    const context = ensureAudio();
    if (!context || !musicEnabled) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  function scheduleMusicBeat() {
    if (!musicEnabled) return;
    const melody = [392, 493.88, 523.25, 659.25, 523.25, 493.88, 440, 523.25];
    const bass = [130.81, 130.81, 146.83, 146.83, 174.61, 174.61, 196, 196];
    const step = musicStep % melody.length;

    // Bright lead, bouncing bass, and a short off-beat pluck create the groove.
    playTone(melody[step], 0, 0.2, 0.055, "triangle");
    playTone(bass[step], 0, 0.13, 0.04, "sine");
    if (musicStep % 2 === 1) playTone(melody[step] * 1.5, 0.02, 0.07, 0.025, "square");
    if (musicStep % 4 === 0) {
      playTone(melody[step] / 2, 0, 0.08, 0.045, "square");
    }
    musicStep += 1;
  }

  function startMusic() {
    if (!musicEnabled || musicTimer) return;
    ensureAudio();
    scheduleMusicBeat();
    musicTimer = setInterval(scheduleMusicBeat, 230);
  }

  function stopMusic() {
    clearInterval(musicTimer);
    musicTimer = null;
  }

  function playSuccessChime() {
    playTone(523.25, 0, 0.14, 0.05, "sine");
    playTone(659.25, 0.12, 0.16, 0.05, "sine");
    playTone(783.99, 0.24, 0.24, 0.055, "sine");
  }

  function playCrashSound() {
    playTone(185, 0, 0.18, 0.065, "sawtooth");
    playTone(110, 0.1, 0.24, 0.055, "square");
  }

  function showMilkReward() {
    const reward = document.createElement("div");
    reward.className = "baka-milk-reward";
    reward.innerHTML = '<span aria-hidden="true">🥛</span><strong>Milk earned!</strong>';
    rewardLayer.replaceChildren(reward);
    setTimeout(() => reward.remove(), 650);
  }

  function boxesOverlap(a, b) {
    const padding = Math.min(a.width, b.width) * 0.18;
    return a.right - padding > b.left + padding
      && a.left + padding < b.right - padding
      && a.bottom - padding > b.top + padding
      && a.top + padding < b.bottom - padding;
  }

  function checkCollision() {
    if (!playing) return;
    if (boxesOverlap(runner.getBoundingClientRect(), obstacle.getBoundingClientRect())) {
      collided = true;
      playing = false;
      playCrashSound();
      obstacle.classList.add("baka-obstacle-hit");
      runner.classList.add("baka-runner-hit");
      feedback.textContent = "Oops! Try that jump again.";
      feedback.className = "baka-feedback baka-feedback-fail";
      jumpButton.disabled = true;
      restartTimer = setTimeout(startRound, 900);
      return;
    }
    animationFrame = requestAnimationFrame(checkCollision);
  }

  function startRound() {
    clearTimeout(restartTimer);
    cancelAnimationFrame(animationFrame);
    round += 1;
    playing = true;
    jumping = false;
    collided = false;
    runner.className = "baka-runner";
    obstacle.className = "baka-obstacle";
    jumpButton.disabled = false;
    roundDisplay.textContent = `Jump ${score + 1} of ${TARGET_JUMPS}`;
    feedback.textContent = "Tap JUMP when the cow gets close.";
    feedback.className = "baka-feedback";

    // Restart the CSS run animation even when retrying immediately.
    void obstacle.offsetWidth;
    obstacle.style.setProperty("--run-time", `${Math.max(2.35, 3.35 - score * 0.07)}s`);
    obstacle.classList.add("baka-obstacle-running");
    animationFrame = requestAnimationFrame(checkCollision);
  }

  function jump() {
    if (!playing || jumping) return;
    startMusic();
    jumping = true;
    runner.classList.add("baka-runner-jumping");
    feedback.textContent = "Great jump!";
    feedback.className = "baka-feedback baka-feedback-ready";
    setTimeout(() => {
      jumping = false;
      runner.classList.remove("baka-runner-jumping");
    }, 850);
  }

  function finishGame() {
    cleanup();
    const quote = randomQuote();
    container.innerHTML = `
      <main class="baka-results">
        <section class="baka-results-card">
          <div class="baka-trophy" aria-hidden="true">🏆</div>
          <p class="baka-result-label">Activity 4 complete</p>
          <h1>Luksong Baka Champion!</h1>
          <p>You cleared all ${TARGET_JUMPS} jumps. Ang galing!</p>
          <div class="baka-final-score">${TARGET_JUMPS} / ${TARGET_JUMPS}</div>
          <section class="baka-reflection-card" aria-live="polite">
            <p>Your Inspirational Message</p>
            <blockquote>${quote}</blockquote>
          </section>
          <div class="result-actions">
            <button class="app-button app-button-primary" id="bakaAgainButton" type="button">Play Again</button>
            <button class="app-button app-button-secondary" id="bakaFinishButton" type="button">Return Home</button>
          </div>
        </section>
      </main>
    `;
    container.querySelector("#bakaAgainButton").addEventListener("click", () => renderLuksongBakaGame(container, onExit));
    container.querySelector("#bakaFinishButton").addEventListener("click", onExit);
  }

  function obstaclePassed() {
    if (!playing || collided) return;
    playing = false;
    cancelAnimationFrame(animationFrame);
    score += 1;
    playSuccessChime();
    showMilkReward();
    scoreDisplay.textContent = String(score);
    milkCount.textContent = `🥛 ${score}/${TARGET_JUMPS}`;
    milkCount.setAttribute("aria-label", `${score} milk ${score === 1 ? "reward" : "rewards"}`);
    progress.style.width = `${(score / TARGET_JUMPS) * 100}%`;
    feedback.textContent = "Success! You cleared the cow!";
    feedback.className = "baka-feedback baka-feedback-success";
    jumpButton.disabled = true;
    if (score >= TARGET_JUMPS) {
      restartTimer = setTimeout(finishGame, 800);
    } else {
      restartTimer = setTimeout(startRound, 700);
    }
  }

  function handleKeydown(event) {
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      jump();
    }
  }

  function cleanup() {
    playing = false;
    stopMusic();
    clearTimeout(restartTimer);
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("keydown", handleKeydown);
  }

  obstacle.addEventListener("animationend", obstaclePassed);
  jumpButton.addEventListener("click", jump);
  audioButton.addEventListener("click", () => {
    musicEnabled = !musicEnabled;
    audioButton.textContent = musicEnabled ? "🔊" : "🔇";
    audioButton.setAttribute("aria-label", musicEnabled ? "Turn music off" : "Turn music on");
    audioButton.setAttribute("aria-pressed", String(musicEnabled));
    if (musicEnabled) startMusic();
    else stopMusic();
  });
  window.addEventListener("keydown", handleKeydown);
  const stopButton = container.querySelector("#bakaStopButton");
  stopButton.addEventListener("click", () => {
    if (stopped) {
      onExit();
      return;
    }

    stopped = true;
    cleanup();
    obstacle.style.animationPlayState = "paused";
    jumpButton.disabled = true;
    feedback.textContent = "Game stopped.";
    feedback.className = "baka-feedback baka-feedback-fail";
    stopButton.textContent = "Restart";
  });

  // Keep the field reference alive for browsers that defer its first layout.
  field.getBoundingClientRect();
  startRound();
}
