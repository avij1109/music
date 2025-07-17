// lib/ml.js

// --- IMPORTANT: REPLACE THIS WITH YOUR COMPUTER'S ACTUAL IP ADDRESS ---
const YOUR_COMPUTER_IP = "10.247.121.63"; // Example: "192.168.1.5"
const API_URL = `http://${YOUR_COMPUTER_IP}:5000`;

export async function getMLRecommendations(topTracks, recentlyPlayed) {
  try {
    const response = await fetch(`${API_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        top_tracks: topTracks,
        recently_played: recentlyPlayed,
      }),
    });
    if (!response.ok) throw new Error("Failed to get personal recommendations");
    const data = await response.json();
    return data.recommended_tracks;
  } catch (error) {
    console.error("ML Recommendation error:", error);
    throw error;
  }
}

export async function getMoodRecommendations(mood) {
  try {
    const response = await fetch(`${API_URL}/recommend_mood`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: mood }),
    });
    if (!response.ok) throw new Error("Failed to get mood recommendations");
    const data = await response.json();
    return data.recommended_tracks;
  } catch (error) {
    console.error("ML Mood Recommendation error:", error);
    throw error;
  }
}
