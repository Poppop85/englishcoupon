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
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  || "https://ainfigfcsyayxqguiecy.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  || "sb_publishable_ZGvyEHuIM-5ZIuOUL4174A_VgSni472";
const AZURE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/pronunciation-assessment`;

function mergeAudio(chunks) {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Float32Array(length);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return result;
}

function resample(input, inputRate, outputRate = 16000) {
  if (inputRate === outputRate) return input;
  const ratio = inputRate / outputRate;
  const output = new Float32Array(Math.round(input.length / ratio));

  for (let index = 0; index < output.length; index += 1) {
    const start = Math.round(index * ratio);
    const end = Math.min(Math.round((index + 1) * ratio), input.length);
    let sum = 0;
    for (let source = start; source < end; source += 1) sum += input[source];
    output[index] = sum / Math.max(1, end - start);
  }
  return output;
}

function createWavBlob(chunks, inputRate) {
  const samples = resample(mergeAudio(chunks), inputRate);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset, value) => {
    [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  };

  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);

  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  });
  return new Blob([buffer], { type: "audio/wav" });
}

async function requestAzureAssessment(audio) {
  const form = new FormData();
  form.append("audio", audio, "reading.wav");
  form.append("referenceText", TARGET_TEXT);

  const response = await fetch(AZURE_FUNCTION_URL, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Azure assessment was unavailable.");
  return data;
}

async function saveAssessment(result) {
  const table = import.meta.env.VITE_SUPABASE_READING_TABLE || "reading_assessments";
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(result),
  });
  if (!response.ok) throw new Error(await response.text());
}

function scoreCard(label, value) {
  const safeValue = Number.isFinite(Number(value)) ? Math.round(Number(value)) : "—";
  return `<div class="azure-score"><strong>${safeValue}${safeValue === "—" ? "" : "%"}</strong><span>${label}</span></div>`;
}

export function renderReadingAssessment(container, onExit) {
  let stream = null;
  let audioContext = null;
  let source = null;
  let processor = null;
  let silentGain = null;
  let audioChunks = [];
  let recordedAudio = null;
  let recording = false;
  let peakSignal = 0;

  container.innerHTML = `
    <main class="reading-page"><section class="reading-card">
      <header class="reading-header">
        <button class="reading-back" id="readingBack" type="button">← Back</button>
        <div class="reading-icon" aria-hidden="true">📖</div>
        <p class="reading-eyebrow">Phonics Kids</p>
        <h1>Reading Assessment</h1>
        <p>Read the passage aloud. Speak clearly and at your natural pace.</p>
      </header>
      <section class="passage" aria-labelledby="passageTitle">
        <h2 id="passageTitle">My Morning</h2>
        <ol>${SENTENCES.map((sentence) => `<li>${sentence}</li>`).join("")}</ol>
      </section>
      <div class="recording-status" id="recordingStatus" role="status" aria-live="polite">Press Start Recording when you are ready.</div>
      <div class="reading-actions">
        <button class="record-button record-start" id="startRecording" type="button">🎤 Start Recording</button>
        <button class="record-button record-stop" id="stopRecording" type="button" disabled>■ Stop Recording</button>
        <button class="record-button record-submit" id="submitReading" type="button" disabled>📤 Submit to Azure</button>
      </div>
      <section class="reading-result" id="readingResult" aria-live="polite" hidden>
        <p class="result-kicker">Azure pronunciation assessment</p>
        <div class="azure-scores" id="azureScores"></div>
        <p id="resultMessage"></p>
        <section class="word-feedback" id="wordFeedback" hidden><h2>Words to practise</h2><div id="practiceWords"></div></section>
        <p class="save-status" id="saveStatus"></p>
      </section>
    </section></main>`;

  const startButton = container.querySelector("#startRecording");
  const stopButton = container.querySelector("#stopRecording");
  const submitButton = container.querySelector("#submitReading");
  const status = container.querySelector("#recordingStatus");
  const result = container.querySelector("#readingResult");
  const scores = container.querySelector("#azureScores");
  const resultMessage = container.querySelector("#resultMessage");
  const saveStatus = container.querySelector("#saveStatus");
  const wordFeedback = container.querySelector("#wordFeedback");
  const practiceWords = container.querySelector("#practiceWords");

  async function stopRecording() {
    if (!recording) return;
    recording = false;
    if (processor) processor.onaudioprocess = null;
    processor?.disconnect();
    source?.disconnect();
    silentGain?.disconnect();
    stream?.getTracks().forEach((track) => track.stop());
    recordedAudio = createWavBlob(audioChunks, audioContext.sampleRate);
    await audioContext.close();
    startButton.disabled = false;
    stopButton.disabled = true;
    submitButton.disabled = recordedAudio.size < 1000 || peakSignal < 0.003;
    status.className = "recording-status";
    status.textContent = submitButton.disabled
      ? "The microphone signal was silent or too quiet. Check your microphone and try again."
      : "Recording stopped. Press Submit to receive your Azure scores.";
  }

  startButton.addEventListener("click", async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      status.className = "recording-status has-error";
      status.textContent = "Audio recording is unavailable. Please use a current version of Chrome or Edge.";
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      audioContext = new AudioContext();
      await audioContext.resume();
      source = audioContext.createMediaStreamSource(stream);
      processor = audioContext.createScriptProcessor(4096, 1, 1);
      silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      audioChunks = [];
      recordedAudio = null;
      peakSignal = 0;
      processor.onaudioprocess = (event) => {
        const chunk = new Float32Array(event.inputBuffer.getChannelData(0));
        for (let index = 0; index < chunk.length; index += 1) {
          peakSignal = Math.max(peakSignal, Math.abs(chunk[index]));
        }
        audioChunks.push(chunk);
      };
      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(audioContext.destination);
      recording = true;
      result.hidden = true;
      startButton.disabled = true;
      stopButton.disabled = false;
      submitButton.disabled = true;
      status.className = "recording-status is-recording";
      status.textContent = "● Recording… Read all seven sentences aloud.";
    } catch (error) {
      console.error(error);
      status.className = "recording-status has-error";
      status.textContent = "Microphone permission was blocked. Allow access and try again.";
    }
  });

  stopButton.addEventListener("click", stopRecording);
  submitButton.addEventListener("click", async () => {
    submitButton.disabled = true;
    result.hidden = false;
    scores.innerHTML = "";
    resultMessage.textContent = "Azure is analysing your reading…";
    saveStatus.textContent = "";
    wordFeedback.hidden = true;
    try {
      const assessment = await requestAzureAssessment(recordedAudio);
      if (!assessment.transcript?.trim() || assessment.detectedSpeech === false) {
        throw new Error("Azure could not hear speech in this recording. Check the selected microphone, speak closer to it, and try again.");
      }
      scores.innerHTML = [
        scoreCard("Pronunciation", assessment.pronunciation),
        scoreCard("Accuracy", assessment.accuracy),
        scoreCard("Fluency", assessment.fluency),
        scoreCard("Completeness", assessment.completeness),
        scoreCard("Prosody", assessment.prosody),
      ].join("");
      resultMessage.textContent = assessment.pronunciation >= 90
        ? "Excellent reading—clear, complete, and natural."
        : assessment.pronunciation >= 75
          ? "Good reading. Practise the highlighted words and try again."
          : "Keep practising. Read slowly and focus on each highlighted word.";
      if (assessment.practiceWords?.length) {
        practiceWords.innerHTML = assessment.practiceWords.map((word) => `<span>${word.word} <small>${Math.round(word.accuracy)}%</small></span>`).join("");
        wordFeedback.hidden = false;
      }
      saveStatus.textContent = "Saving result…";
      await saveAssessment({
        activity: "my_morning",
        accuracy: Math.round(assessment.accuracy),
        transcript: assessment.transcript || "",
        target_text: TARGET_TEXT,
        pronunciation: Math.round(assessment.pronunciation),
        fluency: Math.round(assessment.fluency),
        completeness: Math.round(assessment.completeness),
        prosody: assessment.prosody == null ? null : Math.round(assessment.prosody),
        azure_result: assessment,
      });
      saveStatus.textContent = "✓ Detailed result saved.";
    } catch (error) {
      console.error(error);
      scores.innerHTML = scoreCard("Assessment", null);
      resultMessage.textContent = error.message || "Azure assessment was unavailable.";
      saveStatus.textContent = "Your recording was not charged or saved. Please try again after the function is deployed.";
      submitButton.disabled = false;
    }
    result.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  container.querySelector("#readingBack").addEventListener("click", async () => {
    await stopRecording();
    onExit();
  });
}
