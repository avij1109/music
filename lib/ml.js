export async function getMLRecommendations(topTracks, recentlyPlayed) {
    try {
      const response = await fetch("http://192.168.29.218:5000/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          top_tracks: topTracks,
          recently_played: recentlyPlayed,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to get recommendations from ML server");
      }
  
      const data = await response.json();
      return data.recommended_tracks;
    } catch (error) {
      console.error("ML Recommendation error:", error);
      return [];
    }
  }
  