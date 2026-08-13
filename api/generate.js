// Vercel Serverless Function — Gemini 프록시
// 브라우저에는 키가 절대 내려가지 않는다. 키는 Vercel 환경변수 GEMINI_API_KEY 로만 존재.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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
          maxOutputTokens: Math.min(Number(maxTokens) || 1200, 4096),
          temperature: 1,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("gemini error", r.status, detail.slice(0, 500));
      return res.status(502).json({ error: "생성 실패" });
    }

    const data = await r.json();
    const text = (data.candidates?.[0]?.content?.parts || [])
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
