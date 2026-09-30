export type ChatLine = { role: "user" | "assistant"; content: string; error?: boolean };

const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const base = configured || (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

export async function checkMiloConnection(signal?: AbortSignal): Promise<boolean> {
  if (!base) return false;
  try {
    const response = await fetch(`${base}/ai/status`, { signal, cache: "no-store" });
    if (!response.ok) return false;
    const status = (await response.json()) as { ready?: boolean };
    return status.ready === true;
  } catch {
    return false;
  }
}

export async function askMilo(messages: ChatLine[]): Promise<string> {
  if (!base) throw new Error("Add NEXT_PUBLIC_API_URL to connect Milo to the backend.");
  let response: Response;
  try {
    response = await fetch(`${base}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages
          .filter((message) => !message.error)
          .slice(-12)
          .map(({ role, content }) => ({ role, content })),
      }),
    });
  } catch {
    throw new Error("Milo cannot reach the API yet. Check the backend connection.");
  }
  if (response.status === 503)
    throw new Error("Milo is waiting for a Groq API key on the backend.");
  if (response.status === 429)
    throw new Error("Milo is taking a short break. Please try again soon.");
  if (!response.ok) throw new Error("Milo could not answer just now. Please try again.");
  const data = (await response.json()) as { reply?: unknown };
  if (typeof data.reply !== "string" || !data.reply.trim())
    throw new Error("Milo received an empty answer. Please try again.");
  return data.reply.trim();
}
