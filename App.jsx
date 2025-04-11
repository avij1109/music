import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from "react-native";
import { loginWithSpotify, getUserProfile } from "./lib/auth";
import {
  getUserTopTracks,
  getUserTopArtists,
  getRecommendations,
  createPlaylist,
  addTracksToPlaylist,
  testApiCall,
  getRecentlyPlayedTracks
} from "./lib/spotify";
import { getMLRecommendations } from "./lib/ml"; // ML recommender

export default function App() {
  const [token, setToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('medium_term');
  const [error, setError] = useState(null);
  const [recommendationSource, setRecommendationSource] = useState("recommendations");

  useEffect(() => {
    if (token) loadUserData();
  }, [token, timeRange]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const accessToken = await loginWithSpotify();
      const testResult = await testApiCall(accessToken);
      console.log("API test successful:", testResult.display_name);
      setToken(accessToken);
    } catch (error) {
      setError(error.message);
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await getUserProfile(token);
      setUserProfile(profile);

      const tracks = await getUserTopTracks(token, timeRange);
      const artists = await getUserTopArtists(token, timeRange);
      const recentTracks = await getRecentlyPlayedTracks(token);

      setTopTracks(tracks);
      setTopArtists(artists);

      try {
        const topIds = tracks.map(t => t.id);
        const recentIds = recentTracks.map(t => t.id);
        const mlRecommendedIds = await getMLRecommendations(topIds, recentIds);

        const mlTracks = await Promise.all(
          mlRecommendedIds.map(id =>
            fetch(`https://api.spotify.com/v1/tracks/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json())
          )
        );

        setRecommendations(mlTracks);
        setRecommendationSource("ml_recommender");
      } catch (mlError) {
        const recs = await getRecommendations(token, tracks, artists);
        setRecommendations(recs);
        setRecommendationSource("recommendations");
      }
    } catch (error) {
      console.error("Data loading error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createRecommendationPlaylist = async () => {
    try {
      if (!userProfile || recommendations.length === 0) return;
      setLoading(true);
      const playlist = await createPlaylist(
        token,
        userProfile.id,
        "Your Personalized Music Collection",
        `Created by ML Music App - ${new Date().toLocaleDateString()}`
      );
      const uris = recommendations.map(track => track.uri);
      await addTracksToPlaylist(token, playlist.id, uris);
      Alert.alert("Success", "Playlist created on Spotify!");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationTitle = () => {
    switch (recommendationSource) {
      case "ml_recommender":
        return "AI-Powered Picks 🎧";
      case "recently_played":
        return "Recently Played";
      case "top_tracks":
        return "Your Favorites";
      default:
        return "Recommended For You";
    }
  };

  const renderItem = (item, isTrack = true) => {
    const imageUrl = isTrack ? item.album?.images?.[1]?.url : item.images?.[1]?.url;
    const name = item.name || "Unknown";
    const subtitle = isTrack
      ? item.artists?.map(artist => artist.name).join(", ") || "Unknown Artist"
      : `Popularity: ${item.popularity || "N/A"}`;

    return (
      <View key={item.id} style={styles.itemContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, styles.noImage]}>
            <Text style={styles.noImageText}>{name.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{name}</Text>
          <Text style={styles.itemSubtitle}>{subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {!token ? (
          <View style={styles.loginContainer}>
            <Text style={styles.title}>Music Recommender</Text>
            <Text style={styles.subtitle}>Login to Spotify for personalized recommendations</Text>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              <Text style={styles.loginButtonText}>Login with Spotify</Text>
            </TouchableOpacity>
            {loading && <ActivityIndicator color="#1DB954" style={styles.loader} />}
          </View>
        ) : (
          <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>{getRecommendationTitle()}</Text>
            {recommendations.length > 0 ? (
              recommendations.map(track => renderItem(track, true))
            ) : (
              <Text style={styles.emptyText}>No music available</Text>
            )}

            {recommendations.length > 0 && (
              <TouchableOpacity
                style={styles.createPlaylistButton}
                onPress={createRecommendationPlaylist}
                disabled={loading}
              >
                <Text style={styles.createPlaylistButtonText}>Create Playlist</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#121212" },
  container: { flex: 1, backgroundColor: "#121212" },
  loginContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFF", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#B3B3B3", textAlign: "center", marginBottom: 30 },
  loginButton: { backgroundColor: "#1DB954", padding: 12, paddingHorizontal: 30, borderRadius: 25 },
  loginButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#FFF", marginBottom: 10 },
  itemContainer: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  itemImage: { width: 60, height: 60, borderRadius: 6, backgroundColor: "#333" },
  noImage: { justifyContent: "center", alignItems: "center" },
  noImageText: { fontSize: 24, fontWeight: "bold", color: "#1DB954" },
  itemDetails: { marginLeft: 12 },
  itemTitle: { fontSize: 16, fontWeight: "500", color: "#FFF" },
  itemSubtitle: { fontSize: 14, color: "#B3B3B3" },
  createPlaylistButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },
  createPlaylistButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  errorText: { color: "red", textAlign: "center", marginTop: 10 },
  emptyText: { color: "#B3B3B3", textAlign: "center", fontStyle: "italic", marginVertical: 20 },
  loader: { marginTop: 20 },
});
