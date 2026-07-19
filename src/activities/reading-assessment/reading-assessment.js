import "./reading-assessment.css";

const SENTENCES = [
  "I wake up early every morning.",
  "I brush my teeth and wash my face.",
  "I eat breakfast with my family.",
  "I usually drink coffee or tea.",
  "Then I go to school or work.",
  "I enjoy learning new things every day.",
  "I feel happy when I finish my activities.",
];

const TARGET_TEXT = SENTENCES.join(" ");

// Supabase publishable values are intentionally safe to use in a browser app.
// Environment variables can override these defaults for another deployment.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  || "https://ainfigfcsyayxqguiecy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  || "sb_publishable_ZGvyEHuIM-5ZIuOUL4174A_VgSni472";

function words(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Sequence matching gives partial credit while preventing repeated words from
// artificially increasing the result.
export function calculateReadingAccuracy(target, spoken) {
  const expected = words(target);
  const heard = words(spoken);
  const previous = new Array(heard.length + 1).fill(0);

  for (let row = 1; row <= expected.length; row += 1) {
    let diagonal = previous[0];

    for (let column = 1; column <= heard.length; column += 1) {
      const oldValue = previous[column];

      if (expected[row - 1] === heard[column - 1]) {
        previous[column] = diagonal + 1;
      } else {
        previous[column] = Math.max(previous[column], previous[column - 1]);
      }

      diagonal = oldValue;
    }
  }

  return expected.length === 0
    ? 0
    : Math.round((previous[heard.length] / expected.length) * 100);
}

async function saveAssessment(result) {
  const url = SUPABASE_URL;
  const key = SUPABASE_PUBLISHABLE_KEY;
  const table = import.meta.env.VITE_SUPABASE_READING_TABLE || "reading_assessments";

  if (!url || !key) {
    return { saved: false, reason: "not-configured" };
  }

  const response = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase returned ${response.status}.`);
  }

  return { saved: true };
}

export function renderReadingAssessment(container, onExit) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let finalTranscript = "";
  let interimTranscript = "";
  let isRecording = false;

  container.innerHTML = `
    <main class="reading-page">
      <section class="reading-card">
        <header class="reading-header">
          <button class="reading-back" id="readingBack" type="button" aria-label="Return to the activities">← Back</button>
          <div class="reading-icon" aria-hidden="true">📖</div>
          <p class="reading-eyebrow">Phonics Kids</p>
          <h1>Reading Assessment</h1>
          <p>Read the passage aloud. Speak clearly and at your natural pace.</p>
        </header>

        <section class="passage" aria-labelledby="passageTitle">
          <h2 id="passageTitle">My Morning</h2>
          <ol>${SENTENCES.map((sentence) => `<li>${sentence}</li>`).join("")}</ol>
        </section>

        <div class="recording-status" id="recordingStatus" role="status" aria-live="polite">
          Press Start Recording when you are ready.
        </div>

        <div class="reading-actions">
          <button class="record-button record-start" id="startRecording" type="button">🎤 Start Recording</button>
          <button class="record-button record-stop" id="stopRecording" type="button" disabled>■ Stop Recording</button>
          <button class="record-button record-submit" id="submitReading" type="button" disabled>📤 Submit</button>
        </div>

        <section class="transcript-card" id="transcriptCard" hidden>
          <h2>What we heard</h2>
          <p id="transcriptText"></p>
        </section>

        <section class="reading-result" id="readingResult" aria-live="polite" hidden>
          <p class="result-kicker">Your result</p>
          <div class="accuracy-ring"><strong id="accuracyScore">0%</strong><span>Reading accuracy</span></div>
          <p id="resultMessage"></p>
          <p class="save-status" id="saveStatus"></p>
        </section>
      </section>
    </main>
  `;

  const startButton = container.querySelector("#startRecording");
  const stopButton = container.querySelector("#stopRecording");
  const submitButton = container.querySelector("#submitReading");
  const status = container.querySelector("#recordingStatus");
  const transcriptCard = container.querySelector("#transcriptCard");
  const transcriptText = container.querySelector("#transcriptText");
  const result = container.querySelector("#readingResult");
  const score = container.querySelector("#accuracyScore");
  const resultMessage = container.querySelector("#resultMessage");
  const saveStatus = container.querySelector("#saveStatus");

  function updateTranscript() {
    const transcript = `${finalTranscript} ${interimTranscript}`.trim();
    transcriptText.textContent = transcript || "Listening…";
    transcriptCard.hidden = false;
  }

  function stopRecording() {
    if (recognition && isRecording) recognition.stop();
  }

  function setStoppedState() {
    isRecording = false;
    startButton.disabled = false;
    stopButton.disabled = true;
    submitButton.disabled = !finalTranscript.trim();
    status.classList.remove("is-recording");
    status.textContent = finalTranscript.trim()
      ? "Recording stopped. Check the text, then press Submit."
      : "No speech was captured. Please try again.";
  }

  startButton.addEventListener("click", () => {
    if (!Recognition) {
      status.textContent = "Speech recognition is not supported in this browser. Please use Chrome or Edge and allow microphone access.";
      status.classList.add("has-error");
      return;
    }

    finalTranscript = "";
    interimTranscript = "";
    result.hidden = true;
    transcriptCard.hidden = true;
    recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      interimTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalTranscript += ` ${text}`;
        else interimTranscript += ` ${text}`;
      }
      updateTranscript();
    };

    recognition.onerror = (event) => {
      status.classList.add("has-error");
      status.textContent = event.error === "not-allowed"
        ? "Microphone permission was blocked. Allow microphone access and try again."
        : `Recording error: ${event.error}. Please try again.`;
    };

    recognition.onend = setStoppedState;

    try {
      recognition.start();
      isRecording = true;
      startButton.disabled = true;
      stopButton.disabled = false;
      submitButton.disabled = true;
      status.className = "recording-status is-recording";
      status.textContent = "● Recording… Read all seven sentences aloud.";
    } catch {
      setStoppedState();
    }
  });

  stopButton.addEventListener("click", stopRecording);

  submitButton.addEventListener("click", async () => {
    const recognizedText = finalTranscript.trim();
    const accuracy = calculateReadingAccuracy(TARGET_TEXT, recognizedText);
    const feedback = accuracy >= 90
      ? "Excellent reading! You matched almost every word."
      : accuracy >= 75
        ? "Good reading! Try once more for an even higher score."
        : "Nice start. Read slowly, speak clearly, and try again.";

    score.textContent = `${accuracy}%`;
    resultMessage.textContent = feedback;
    result.hidden = false;
    saveStatus.textContent = "Saving result…";
    submitButton.disabled = true;

    try {
      const saved = await saveAssessment({
        activity: "my_morning",
        accuracy,
        transcript: recognizedText,
        target_text: TARGET_TEXT,
      });
      saveStatus.textContent = saved.saved
        ? "✓ Result saved."
        : "Score is ready. Supabase saving will begin when the deployment variables are connected.";
    } catch (error) {
      console.error("Could not save reading assessment", error);
      saveStatus.textContent = "Your score is shown, but it could not be saved. Please try again.";
      submitButton.disabled = false;
    }

    result.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  container.querySelector("#readingBack").addEventListener("click", () => {
    stopRecording();
    onExit();
  });
}
