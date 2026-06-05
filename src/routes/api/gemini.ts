// Secure server-side Gemini proxy. Keeps GEMINI_API_KEY off the client.
import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-2.5-flash";

type Body = {
  system?: string;
  prompt: string;
  model?: string;
};

export const Route = createFileRoute("/api/gemini")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Missing GEMINI_API_KEY on server." }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }

        if (!body?.prompt || typeof body.prompt !== "string") {
          return new Response(JSON.stringify({ error: "`prompt` is required." }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }

        const client = new GoogleGenAI({ apiKey });

        try {
          const stream = await client.models.generateContentStream({
            model: body.model ?? DEFAULT_MODEL,
            contents: body.prompt,
            config: body.system ? { systemInstruction: body.system } : undefined,
          });

          const encoder = new TextEncoder();
          const readable = new ReadableStream<Uint8Array>({
            async start(controller) {
              try {
                for await (const chunk of stream) {
                  const text = chunk.text;
                  if (text) controller.enqueue(encoder.encode(text));
                }
                controller.close();
              } catch (err) {
                controller.error(err);
              }
            },
          });

          return new Response(readable, {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
              "X-Accel-Buffering": "no",
            },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Gemini request failed";
          return new Response(JSON.stringify({ error: message }), {
            status: 502, headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
