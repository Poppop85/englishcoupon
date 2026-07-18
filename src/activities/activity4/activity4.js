import "./activity4.css";

const TARGET_JUMPS = 10;

export function renderLuksongBakaGame(container, onExit) {
  let score = 0;
  let round = 0;
  let playing = true;
  let jumping = false;
  let collided = false;
  let animationFrame = null;
  let restartTimer = null;

  container.innerHTML = `
    <main class="baka-game">
      <header class="baka-header">
        <button class="app-button app-button-secondary app-button-small" id="bakaHomeButton" type="button">Home</button>
        <div class="baka-title"><span aria-hidden="true">🐄</span> <strong>Luksong Baka</strong></div>
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
      </section>

      <footer class="baka-controls">
        <div class="baka-progress" aria-label="Jump progress"><div id="bakaProgress"></div></div>
        <button class="baka-jump-button" id="bakaJumpButton" type="button">JUMP!</button>
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
    container.innerHTML = `
      <main class="baka-results">
        <section class="baka-results-card">
          <div class="baka-trophy" aria-hidden="true">🏆</div>
          <p class="baka-result-label">Activity 4 complete</p>
          <h1>Luksong Baka Champion!</h1>
          <p>You cleared all ${TARGET_JUMPS} jumps. Ang galing!</p>
          <div class="baka-final-score">${TARGET_JUMPS} / ${TARGET_JUMPS}</div>
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
    scoreDisplay.textContent = String(score);
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
    clearTimeout(restartTimer);
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("keydown", handleKeydown);
  }

  obstacle.addEventListener("animationend", obstaclePassed);
  jumpButton.addEventListener("click", jump);
  window.addEventListener("keydown", handleKeydown);
  container.querySelector("#bakaHomeButton").addEventListener("click", () => {
    cleanup();
    onExit();
  });

  // Keep the field reference alive for browsers that defer its first layout.
  field.getBoundingClientRect();
  startRound();
}
