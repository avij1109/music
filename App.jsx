// App.jsx
import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  Button,
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

export default function App() {
  const [token, setToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('medium_term'); // options: short_term, medium_term, long_term
  const [error, setError] = useState(null);
  const [recommendationSource, setRecommendationSource] = useState("recommendations");

  useEffect(() => {
    if (token) {
      loadUserData();
    }
  }, [token, timeRange]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const accessToken = await loginWithSpotify();
      console.log("Got token:", accessToken ? "Yes" : "No");
      
      // Test the token with a simple API call
      const testResult = await testApiCall(accessToken);
      console.log("API test successful:", testResult.display_name);
      
      setToken(accessToken);
    } catch (error) {
      console.error("Login error:", error);
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
  
      // Get user profile
      const profile = await getUserProfile(token);
      console.log("Got user profile:", profile.display_name);
      setUserProfile(profile);
  
      // Get top tracks and artists
      const tracks = await getUserTopTracks(token, timeRange);
      console.log("Got top tracks:", tracks.length);
      setTopTracks(tracks);
  
      const artists = await getUserTopArtists(token, timeRange);
      console.log("Got top artists:", artists.length);
      setTopArtists(artists);
  
      // Try to get recommendations using helper
      try {
        console.log("Trying recommendations API...");
        const recs = await getRecommendations(token, tracks, artists);
        console.log("Successfully got recommendations:", recs.length);
        setRecommendations(recs);
        setRecommendationSource("recommendations");
      } catch (recError) {
        console.error("Recommendations failed, trying recently played:", recError);
  
        // Fallback: Recently played
        try {
          const recentTracks = await getRecentlyPlayedTracks(token);
          console.log("Got recently played tracks instead:", recentTracks.length);
          setRecommendations(recentTracks);
          setRecommendationSource("recently_played");
        } catch (recentError) {
          console.error("Recently played failed:", recentError);
  
          // Final fallback: Top tracks
          console.log("Using top tracks as recommendations fallback");
          setRecommendations(tracks || []);
          setRecommendationSource("top_tracks");
          setError("Unable to load recommendations. Showing your top tracks instead.");
        }
      }
    } catch (error) {
      console.error("Data loading error:", error);
      setError(error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };
  

  const createRecommendationPlaylist = async () => {
    try {
      if (!userProfile || recommendations.length === 0) {
        Alert.alert("Error", "User profile or recommendations not available");
        return;
      }
      
      setLoading(true);
      // Create a new playlist
      const playlist = await createPlaylist(
        token,
        userProfile.id,
        "Your Personalized Music Collection",
        `Created by Music Recommender App - ${new Date().toLocaleDateString()}`
      );
      
      // Add recommended tracks to the playlist
      const trackUris = recommendations.map(track => track.uri);
      await addTracksToPlaylist(token, playlist.id, trackUris);
      
      Alert.alert(
        "Success!",
        "A new playlist with your music has been created in your Spotify account!"
      );
    } catch (error) {
      console.error("Playlist creation error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const changeTimeRange = (range) => {
    setTimeRange(range);
  };

  const refreshData = () => {
    if (token) {
      loadUserData();
    }
  };

  // Render song or artist item
  const renderItem = (item, isTrack = true) => {
    let imageUrl;
    
    if (isTrack) {
      imageUrl = item.album?.images?.[1]?.url || null;
    } else {
      imageUrl = item.images?.[1]?.url || null;
    }
    
    const name = item.name || "Unknown";
    const subtitle = isTrack 
      ? (item.artists?.map(artist => artist.name).join(", ") || "Unknown Artist")
      : `Popularity: ${item.popularity || "N/A"}`;
    
    return (
      <View key={item.id || Math.random().toString()} style={styles.itemContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, styles.noImage]}>
            <Text style={styles.noImageText}>{name.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle} numberOfLines={1}>{name}</Text>
          <Text style={styles.itemSubtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>
    );
  };

  // Get recommendation section title based on source
  const getRecommendationTitle = () => {
    switch (recommendationSource) {
      case "recently_played":
        return "Recently Played";
      case "top_tracks":
        return "Your Favorites";
      default:
        return "Recommended For You";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {!token ? (
          <View style={styles.loginContainer}>
            <Text style={styles.title}>Music Recommender</Text>
            <Text style={styles.subtitle}>
              Connect with Spotify to get personalized music recommendations
            </Text>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                Login with Spotify
              </Text>
            </TouchableOpacity>
            {loading && <ActivityIndicator color="#1DB954" style={styles.loader} />}
          </View>
        ) : (
          <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
            {userProfile && (
              <View style={styles.profileContainer}>
                {userProfile.images && userProfile.images[0] ? (
                  <Image 
                    source={{ uri: userProfile.images[0].url }} 
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={[styles.profileImage, styles.noProfileImage]}>
                    <Text style={styles.profileImageText}>
                      {userProfile.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  </View>
                )}
                <Text style={styles.profileName}>{userProfile.display_name}</Text>
              </View>
            )}
            
            <View style={styles.timeRangeSelector}>
              <Text style={styles.sectionTitle}>Time Range:</Text>
              <View style={styles.timeRangeButtons}>
                <TouchableOpacity 
                  style={[
                    styles.timeRangeButton, 
                    timeRange === 'short_term' && styles.selectedTimeRange
                  ]}
                  onPress={() => changeTimeRange('short_term')}
                >
                  <Text style={styles.timeRangeText}>Recent</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.timeRangeButton, 
                    timeRange === 'medium_term' && styles.selectedTimeRange
                  ]}
                  onPress={() => changeTimeRange('medium_term')}
                >
                  <Text style={styles.timeRangeText}>6 Months</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.timeRangeButton, 
                    timeRange === 'long_term' && styles.selectedTimeRange
                  ]}
                  onPress={() => changeTimeRange('long_term')}
                >
                  <Text style={styles.timeRangeText}>All Time</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            {loading ? (
              <ActivityIndicator size="large" color="#1DB954" style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
                  <Text style={styles.refreshButtonText}>Refresh Data</Text>
                </TouchableOpacity>
                
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Top Tracks</Text>
                  {topTracks.length > 0 ? (
                    topTracks.slice(0, 5).map(track => renderItem(track, true))
                  ) : (
                    <Text style={styles.emptyText}>No top tracks found</Text>
                  )}
                </View>
                
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Top Artists</Text>
                  {topArtists.length > 0 ? (
                    topArtists.slice(0, 5).map(artist => renderItem(artist, false))
                  ) : (
                    <Text style={styles.emptyText}>No top artists found</Text>
                  )}
                </View>
                
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{getRecommendationTitle()}</Text>
                  {recommendations.length > 0 ? (
                    recommendations.slice(0, 10).map(track => renderItem(track, true))
                  ) : (
                    <Text style={styles.emptyText}>No music available</Text>
                  )}
                </View>
                
                {recommendations.length > 0 && (
                  <TouchableOpacity 
                    style={styles.createPlaylistButton}
                    onPress={createRecommendationPlaylist}
                    disabled={loading}
                  >
                    <Text style={styles.createPlaylistButtonText}>
                      Create Playlist from {getRecommendationTitle()}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#B3B3B3",
    textAlign: "center",
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 10,
  },
  profileContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  noProfileImage: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#1DB954",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  timeRangeSelector: {
    marginBottom: 20,
  },
  timeRangeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  timeRangeButton: {
    backgroundColor: "#333333",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  selectedTimeRange: {
    backgroundColor: "#1DB954",
  },
  timeRangeText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#282828",
    borderRadius: 8,
    overflow: "hidden",
  },
  itemImage: {
    width: 60,
    height: 60,
  },
  noImage: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1DB954",
  },
  itemDetails: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  itemSubtitle: {
    fontSize: 14,
    color: "#B3B3B3",
    marginTop: 2,
  },
  createPlaylistButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  createPlaylistButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loader: {
    marginVertical: 20,
  },
  errorText: {
    color: "#FF4136",
    textAlign: "center",
    marginVertical: 10,
    padding: 10,
    backgroundColor: "rgba(255, 65, 54, 0.1)",
    borderRadius: 8,
  },
  emptyText: {
    color: "#B3B3B3",
    textAlign: "center",
    marginVertical: 10,
    fontStyle: "italic",
  },
  refreshButton: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: "center",
    marginBottom: 20,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});