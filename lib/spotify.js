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
// Get recommendations based on seeds with enhanced debugging
// Modified getRecommendations function for spotify.js
export async function getRecommendations(token, seedTracks = [], seedArtists = [], limit = 20) {
  try {
    // Build the query parameters
    let params = new URLSearchParams();
    
    // Initialize tracking variables for debugging
    let usedSeedType = "none";
    let seedIds = [];
    
    if (seedTracks && seedTracks.length > 0) {
      // Extract just the track IDs - simplify to avoid object reference issues
      const trackIds = seedTracks.slice(0, 5).map(track => track.id);
      seedIds = trackIds;
      usedSeedType = "tracks";
      params.append('seed_tracks', trackIds.join(','));
      console.log("Using seed tracks:", trackIds.join(','));
    } else if (seedArtists && seedArtists.length > 0) {
      // Extract just the artist IDs
      const artistIds = seedArtists.slice(0, 5).map(artist => artist.id);
      seedIds = artistIds;
      usedSeedType = "artists";
      params.append('seed_artists', artistIds.join(','));
      console.log("Using seed artists:", artistIds.join(','));
    } else {
      // Fallback to generic genres
      usedSeedType = "genres";
      seedIds = ['pop', 'rock', 'hip-hop'];
      params.append('seed_genres', 'pop,rock,hip-hop');
      console.log("Using seed genres: pop,rock,hip-hop");
    }
    
    params.append('limit', limit.toString());
    
    const requestUrl = `https://api.spotify.com/v1/recommendations?${params.toString()}`;
    console.log("Recommendations URL:", requestUrl);
    console.log(`Seed type: ${usedSeedType}, Seed IDs: ${seedIds.join(',')}`);
    
    // Make the API call
    const response = await fetch(
      requestUrl,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Log the complete response for debugging
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      let errorMessage = `Failed to fetch recommendations: ${response.status}`;
      try {
        // Only try to parse as JSON if content exists
        const text = await response.text();
        if (text && text.trim()) {
          const errorData = JSON.parse(text);
          console.error('Recommendation API error details:', errorData);
          if (errorData.error && errorData.error.message) {
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

// Add a new simplified test function that uses track IDs directly
export async function getRecommendationsByTrackIds(token, trackIds = [], limit = 20) {
  try {
    if (!trackIds || trackIds.length === 0) {
      throw new Error("No track IDs provided");
    }
    
    // Take up to 5 seed tracks max (Spotify API limit)
    const seedIds = trackIds.slice(0, 5);
    
    // Build the query parameters
    let params = new URLSearchParams();
    params.append('seed_tracks', seedIds.join(','));
    params.append('limit', limit.toString());
    
    const requestUrl = `https://api.spotify.com/v1/recommendations?${params.toString()}`;
    console.log("Simplified recommendations URL:", requestUrl);
    
    // Make the API call
    const response = await fetch(
      requestUrl,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations: ${response.status}`);
    }

    const data = await response.json();
    return data.tracks;
  } catch (error) {
    console.error('Error fetching recommendations with track IDs:', error);
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
export async function testRecommendationWithGenre(token) {
  try {
    // Just use a single genre seed with minimal parameters
    const params = new URLSearchParams();
    params.append('seed_genres', 'pop');
    params.append('limit', '1');
    
    const requestUrl = `https://api.spotify.com/v1/recommendations?${params.toString()}`;
    console.log("Test recommendation URL:", requestUrl);
    
    const response = await fetch(
      requestUrl,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log(`Test recommendation status: ${response.status}`);
    
    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        console.error('Test recommendation error details:', errorData);
        errorText = JSON.stringify(errorData);
      } catch (e) {
        errorText = 'Could not parse error response';
      }
      throw new Error(`Test recommendation failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Test recommendation error:', error);
    throw error;
  }
}