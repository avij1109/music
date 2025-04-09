// lib/auth.js

import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import * as AuthSession from 'expo-auth-session';

// Make sure to call this at the top level of your file
WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = "f31d3bdeaf1747d68013b7159f73d73b"; // Your Spotify Client ID
const REDIRECT_URI = AuthSession.makeRedirectUri({ useProxy: true });

const SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-library-read",
  "playlist-read-private"
];

export async function loginWithSpotify() {
  try {
    console.log("Redirect URI:", REDIRECT_URI); // For debugging
    
    const discovery = {
      authorizationEndpoint: 'https://accounts.spotify.com/authorize',
      tokenEndpoint: 'https://accounts.spotify.com/api/token',
    };
    
    const request = new AuthSession.AuthRequest({
      clientId: CLIENT_ID,
      scopes: SCOPES,
      responseType: ResponseType.Token,
      redirectUri: REDIRECT_URI,
    });
    
    const result = await request.promptAsync(discovery, { useProxy: true });
    console.log("Auth result type:", result.type); // For debugging
    
    if (result.type === 'success') {
      return result.params.access_token;
    } else {
      console.log("Auth failed with type:", result.type);
      throw new Error(`Authentication error: ${result.type}`);
    }
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
}

// Function to get the current user's profile
export async function getUserProfile(token) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}