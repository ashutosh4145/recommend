const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8787";

// Sends the user's request + full product list to our backend, which
// forwards it to OpenAI (API key stays server-side, never in the browser).
export async function fetchRecommendations(userInput, products) {
  const response = await fetch(`${BASE_URL}/api/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userInput, products }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Failed to fetch recommendations.");
  }
  if (!Array.isArray(data.ids)) {
    throw new Error("Unexpected response shape from server.");
  }
  return data.ids;
}
