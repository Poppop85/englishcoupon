const allowedOrigins = new Set([
  "https://poppop85.github.io",
  "http://localhost:5173",
]);

function cors(origin: string | null) {
  const allowed = origin && allowedOrigins.has(origin) ? origin : "https://poppop85.github.io";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const headers = cors(origin);
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST" || !origin || !allowedOrigins.has(origin)) {
    return Response.json({ error: "Request not allowed." }, { status: 403, headers });
  }

  try {
    const key = Deno.env.get("AZURE_SPEECH_KEY");
    const region = Deno.env.get("AZURE_SPEECH_REGION") || "australiaeast";
    if (!key) throw new Error("Azure Speech is not configured.");

    const form = await request.formData();
    const audio = form.get("audio");
    const referenceText = String(form.get("referenceText") || "").trim();
    if (!(audio instanceof File) || audio.size < 1000 || !referenceText) {
      return Response.json({ error: "Audio and reference text are required." }, { status: 400, headers });
    }

    const config = btoa(JSON.stringify({
      ReferenceText: referenceText,
      GradingSystem: "HundredMark",
      Granularity: "Phoneme",
      Dimension: "Comprehensive",
      EnableMiscue: true,
      EnableProsodyAssessment: true,
    }));
    const endpoint = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
    const azure = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Pronunciation-Assessment": config,
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        "Accept": "application/json",
      },
      body: await audio.arrayBuffer(),
    });
    const data = await azure.json();
    if (!azure.ok || data.RecognitionStatus !== "Success" || !data.NBest?.[0]) {
      console.error("Azure response", data);
      throw new Error(data.DisplayText || data.RecognitionStatus || "Azure could not assess this recording.");
    }

    const best = data.NBest[0];
    const assessment = best.PronunciationAssessment || {};
    const transcript = best.Display || data.DisplayText || "";
    const practiceWords = (best.Words || [])
      .map((word: Record<string, unknown>) => ({
        word: word.Word,
        accuracy: Number((word.PronunciationAssessment as Record<string, unknown>)?.AccuracyScore ?? 0),
        errorType: (word.PronunciationAssessment as Record<string, unknown>)?.ErrorType || "None",
      }))
      .filter((word: { accuracy: number; errorType: unknown }) => word.accuracy < 75 || word.errorType !== "None")
      .slice(0, 12);

    return Response.json({
      pronunciation: assessment.PronScore ?? 0,
      accuracy: assessment.AccuracyScore ?? 0,
      fluency: assessment.FluencyScore ?? 0,
      completeness: assessment.CompletenessScore ?? 0,
      prosody: assessment.ProsodyScore ?? null,
      transcript,
      confidence: best.Confidence ?? null,
      detectedSpeech: transcript.trim().length > 0,
      practiceWords,
    }, { headers });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error instanceof Error ? error.message : "Assessment failed." }, { status: 502, headers });
  }
});
