import "./style.css";
import "./styles/buttons.css";

import { renderLuksongBakaGame } from "./activities/activity4/activity4.js";
import { renderReadingAssessment } from "./activities/reading-assessment/reading-assessment.js";

const app = document.querySelector("#app");

function launchGame() {
  renderLuksongBakaGame(app, launchGame);
}

function renderCurrentPage() {
  if (window.location.hash === "#reading-assessment") {
    renderReadingAssessment(app, () => {
      window.location.hash = "";
    });
    return;
  }

  launchGame();

  const assessmentButton = document.createElement("a");
  assessmentButton.className = "reading-assessment-shortcut";
  assessmentButton.href = "#reading-assessment";
  assessmentButton.textContent = "📖 Reading Assessment";
  assessmentButton.setAttribute("aria-label", "Open the My Morning reading assessment");
  app.appendChild(assessmentButton);
}

window.addEventListener("hashchange", renderCurrentPage);
renderCurrentPage();
