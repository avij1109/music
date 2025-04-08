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
    // Build the query parameters
    let params = new URLSearchParams();
    
    if (seedTracks.length > 0) {
      // Take up to 5 seed tracks max (Spotify API limit)
      const trackIds = seedTracks.slice(0, 5).map(track => track.id);
      params.append('seed_tracks', trackIds.join(','));
    } else if (seedArtists.length > 0) {
      // Take up to 5 seed artists max (Spotify API limit)
      const artistIds = seedArtists.slice(0, 5).map(artist => artist.id);
      params.append('seed_artists', artistIds.join(','));
    } else {
      // Fallback to generic genres
      params.append('seed_genres', 'pop,rock,hip-hop');
    }
    
    params.append('limit', limit.toString());
    
    console.log("Recommendations URL:", `https://api.spotify.com/v1/recommendations?${params.toString()}`);
    
    // Make the API call
    const response = await fetch(
      `https://api.spotify.com/v1/recommendations?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Recommendation API error:', response.status, errorData);
      throw new Error(`Failed to fetch recommendations: ${response.status}`);
    }

    const data = await response.json();
    return data.tracks;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
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