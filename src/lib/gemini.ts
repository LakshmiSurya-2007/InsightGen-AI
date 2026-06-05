// Client-side helper that streams from our secure /api/gemini server route.
// The Gemini API key lives ONLY on the server as GEMINI_API_KEY.

export const DEFAULT_MODEL = "gemini-2.5-flash";

export async function* streamGemini(opts: {
  system: string;
  prompt: string;
  model?: string;
}): AsyncGenerator<string> {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: opts.system,
      prompt: opts.prompt,
      model: opts.model ?? DEFAULT_MODEL,
    }),
  });

  if (!res.ok || !res.body) {
    let message = `Gemini request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) yield decoder.decode(value, { stream: true });
    }
    const tail = decoder.decode();
    if (tail) yield tail;
  } finally {
    reader.releaseLock();
  }
}

// The key is server-only now. The client always assumes it's available;
// real errors surface from the /api/gemini route.
export function hasGeminiKey(): boolean {
  return true;
}
