// lib/spotify.js
// Get user's top tracks
export async function getUserTopTracks(token, timeRange = 'medium_term', limit = 20) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch top tracks: ${response.status}`);
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    throw error;
  }
}

// Get user's top artists
export async function getUserTopArtists(token, timeRange = 'medium_term', limit = 10) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch top artists: ${response.status}`);
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error fetching top artists:', error);
    throw error;
  }
}

// Get recommendations based on seeds
export async function getRecommendations(token, seedTracks = [], seedArtists = [], limit = 20) {
  try {
    let params = new URLSearchParams();
    let usedSeedType = "none";
    let seedIds = [];

    if (seedTracks && seedTracks.length > 0) {
      // ✅ Filter tracks with valid IDs and popularity > 50
      const filteredTracks = seedTracks.filter(track => track.id && track.popularity > 50);
      const trackIds = filteredTracks.slice(0, 5).map(track => track.id);

      if (trackIds.length === 0) {
        throw new Error("No valid seed tracks found (popularity too low or missing IDs).");
      }

      seedIds = trackIds;
      usedSeedType = "tracks";
      params.append('seed_tracks', trackIds.join(','));
      console.log("Using seed tracks:", trackIds.join(','));
    } else if (seedArtists && seedArtists.length > 0) {
      const artistIds = seedArtists.slice(0, 5).map(artist => artist.id);
      seedIds = artistIds;
      usedSeedType = "artists";
      params.append('seed_artists', artistIds.join(','));
      console.log("Using seed artists:", artistIds.join(','));
    } else {
      usedSeedType = "genres";
      seedIds = ['pop', 'rock', 'hip-hop'];
      params.append('seed_genres', 'pop,rock,hip-hop');
      console.log("Using seed genres: pop,rock,hip-hop");
    }

    params.append('limit', limit.toString());

    const requestUrl = `https://api.spotify.com/v1/recommendations?${params.toString()}`;
    console.log("Recommendations URL:", requestUrl);
    console.log(`Seed type: ${usedSeedType}, Seed IDs: ${seedIds.join(',')}`);

    const response = await fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = `Failed to fetch recommendations: ${response.status}`;
      try {
        const text = await response.text();
        if (text && text.trim()) {
          const errorData = JSON.parse(text);
          console.error('Recommendation API error details:', errorData);
          if (errorData.error?.message) {
            errorMessage += ` - ${errorData.error.message}`;
          }
        } else {
          console.log("Empty response body");
        }
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.tracks;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
}


// Get recently played tracks as an alternative to recommendations
export async function getRecentlyPlayedTracks(token, limit = 20) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log(`Recently played status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recently played: ${response.status}`);
    }

    const data = await response.json();
    return data.items.map(item => item.track);
  } catch (error) {
    console.error('Error fetching recently played tracks:', error);
    throw error;
  }
}

// Create a playlist for the user
export async function createPlaylist(token, userId, name, description = '', isPublic = false) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          public: isPublic
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create playlist: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
}

// Add tracks to a playlist
export async function addTracksToPlaylist(token, playlistId, trackUris) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: trackUris
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add tracks to playlist: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding tracks to playlist:', error);
    throw error;
  }
}

// Test API call for debugging
export async function testApiCall(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log("API test status:", response.status);
    
    if (!response.ok) {
      throw new Error(`API test failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API test error:', error);
    throw error;
  }
}