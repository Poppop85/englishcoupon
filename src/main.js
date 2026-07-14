import "./style.css";
import "./styles/buttons.css";

import { renderAlphabetGoalGame } from "./activities/activity1/activity1.js";

const app = document.querySelector("#app");

function showStartScreen() {
  app.innerHTML = `
    <main class="start-screen">
      <section class="start-card">
        <div class="start-icon" aria-hidden="true">⚽</div>

        <p class="start-label">Activity 1</p>

        <h1>Alphabet Goal Challenge</h1>

        <p class="start-description">
          Listen to the letter and kick the football into the correct goal!
        </p>

        <button
          class="app-button app-button-primary"
          id="startActivityButton"
          type="button"
        >
          Start Game
        </button>
      </section>
    </main>
  `;

  document
    .querySelector("#startActivityButton")
    .addEventListener("click", () => {
      renderAlphabetGoalGame(app, showStartScreen);
    });
}

showStartScreen();