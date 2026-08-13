// Vercel Serverless Function — Gemini 프록시
// 브라우저에는 키가 절대 내려가지 않는다. 키는 Vercel 환경변수 GEMINI_API_KEY 로만 존재.

// gemini-2.5-flash 는 신규 키에 더 이상 열리지 않는다. flash-latest 별칭을 쓴다.
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST만 허용" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "GEMINI_API_KEY 미설정" });

  const { system, prompt, maxTokens } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "prompt 없음" });
  }

  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: String(system) }] } : undefined,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: Math.min(Number(maxTokens) || 2048, 8192),
          temperature: 1,
          // thinkingBudget 은 이 모델에서 400. thinkingLevel "minimal" 이 사고 토큰을 0으로 만든다.
          thinkingConfig: { thinkingLevel: "minimal" },
        },
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("gemini error", r.status, detail.slice(0, 500));
      return res.status(502).json({ error: "생성 실패" });
    }

    const data = await r.json();
    const cand = data.candidates?.[0];

    // 토큰 한도에 걸려 잘리면 JSON 파싱이 깨진다. 클라이언트에 넘기지 않는다.
    if (cand?.finishReason && cand.finishReason !== "STOP") {
      console.error("gemini finishReason", cand.finishReason, data.usageMetadata);
      return res.status(502).json({ error: "생성 실패" });
    }

    const text = (cand?.content?.parts || [])
      .map((p) => p.text || "")
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    if (!text) return res.status(502).json({ error: "빈 응답" });
    return res.status(200).json({ text });
  } catch (e) {
    console.error("gemini exception", e);
    return res.status(502).json({ error: "생성 실패" });
  }
}
