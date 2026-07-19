import "./style.css";
import "./styles/buttons.css";

import { renderAlphabetGoalGame } from "./activities/activity1/activity1.js";
import { renderAlphabetNinjaGame } from "./activities/activity2/activity2.js";
import { renderListeningTreasureHunt } from "./activities/activity3/activity3.js";
import { renderLuksongBakaGame } from "./activities/activity4/activity4.js";
import { renderReadingAssessment } from "./activities/reading-assessment/reading-assessment.js";

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

        <div class="start-actions">
          <button
            class="app-button app-button-primary"
            id="startActivityButton"
            type="button"
          >
            Start Activity 1
          </button>

          <button
            class="app-button app-button-secondary"
            id="startNinjaButton"
            type="button"
          >
            Play Activity 2
          </button>

          <button
            class="app-button app-button-secondary"
            id="startListeningButton"
            type="button"
          >
            Play Activity 3
          </button>

          <button
            class="app-button app-button-secondary"
            id="startBakaButton"
            type="button"
          >
            Play Activity 4
          </button>

          <button
            class="app-button app-button-secondary"
            id="startReadingButton"
            type="button"
          >
            📖 Reading Assessment
          </button>
        </div>
      </section>
    </main>
  `;

  document
    .querySelector("#startActivityButton")
    .addEventListener("click", () => {
      renderAlphabetGoalGame(
        app,
        showStartScreen,
        () => renderAlphabetNinjaGame(
          app,
          showStartScreen,
          () => renderListeningTreasureHunt(
            app,
            showStartScreen,
            () => renderLuksongBakaGame(app, showStartScreen),
          ),
        ),
      );
    });

  document
    .querySelector("#startNinjaButton")
    .addEventListener("click", () => {
      renderAlphabetNinjaGame(
        app,
        showStartScreen,
        () => renderListeningTreasureHunt(
          app,
          showStartScreen,
          () => renderLuksongBakaGame(app, showStartScreen),
        ),
      );
    });

  document
    .querySelector("#startListeningButton")
    .addEventListener("click", () => {
      renderListeningTreasureHunt(
        app,
        showStartScreen,
        () => renderLuksongBakaGame(app, showStartScreen),
      );
    });

  document
    .querySelector("#startBakaButton")
    .addEventListener("click", () => {
      renderLuksongBakaGame(app, showStartScreen);
    });

  document
    .querySelector("#startReadingButton")
    .addEventListener("click", () => {
      renderReadingAssessment(app, showStartScreen);
    });
}

showStartScreen();
