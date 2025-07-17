// screens/PersonalScreen.jsx (Updated with old logic and new theme support)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image, Linking } from 'react-native';

// Import the useTheme hook
import { useTheme } from '../contexts/ThemeContext';

// Import the necessary functions from your libs
import { getMLRecommendations } from '../lib/ml';
import { getUserTopTracks, getRecentlyPlayedTracks } from '../lib/spotify';

export default function PersonalScreen({ navigation, route }) {
  const { token } = route.params;
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState([]);

  // Function to fetch full track details from a list of IDs
  const fetchTrackDetails = async (trackIds) => {
    if (!trackIds || trackIds.length === 0) return [];
    try {
      // Spotify API allows fetching multiple tracks by ID in one call
      const response = await fetch(`https://api.spotify.com/v1/tracks?ids=${trackIds.join(',')}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      return data.tracks.filter(t => t); // Filter out any null results
    } catch (error) {
      Alert.alert("Error", "Could not fetch track details.");
      return [];
    }
  };

  const fetchPersonalPicks = async () => {
    setLoading(true);
    try {
      // Logic from your old PersonalScreen
      const topTracks = await getUserTopTracks(token);
      const recentlyPlayed = await getRecentlyPlayedTracks(token);
      
      const topTrackIDs = topTracks.map(t => t.id);
      const recentTrackIDs = recentlyPlayed.map(t => t.id);

      const recommendationIds = await getMLRecommendations(topTrackIDs, recentTrackIDs);
      
      if (recommendationIds && recommendationIds.length > 0) {
        const trackDetails = await fetchTrackDetails(recommendationIds);
        setTracks(trackDetails);
      } else {
        setTracks([]);
      }

    } catch (error) {
      Alert.alert("Error", "Could not fetch your personal picks.");
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonalPicks();
  }, []);

  const renderItem = ({ item }) => {
    if (!item || !item.id) return null;
    const imageUrl = item.album?.images?.[1]?.url;
    const name = item.name || "Unknown";
    const artistNames = item.artists?.map(artist => artist.name).join(", ") || "Unknown Artist";

    return (
      <TouchableOpacity onPress={() => item.external_urls?.spotify && Linking.openURL(item.external_urls.spotify)}>
        <View style={styles.itemContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={[styles.itemImage, styles.noImage]}>
              <Text style={styles.noImageText}>{name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.itemDetails}>
            <Text style={styles.itemTitle} numberOfLines={1}>{name}</Text>
            <Text style={styles.itemSubtitle} numberOfLines={1}>{artistNames}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : (
        <FlatList
          data={tracks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<Text style={styles.title}>✨ Your AI Personal Picks</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>No personal picks found.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const getStyles = (isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#ffffff',
      paddingHorizontal: 10,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      color: isDark ? '#fff' : '#000',
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
      marginVertical: 15,
    },
    emptyText: {
      color: isDark ? '#B3B3B3' : '#666',
      textAlign: 'center',
      fontStyle: 'italic',
      marginTop: 50,
    },
    itemContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      paddingHorizontal: 5,
    },
    itemImage: {
      width: 50,
      height: 50,
      borderRadius: 4,
    },
    noImage: {
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDark ? '#333' : '#ccc',
    },
    noImageText: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#1DB954",
    },
    itemDetails: {
      marginLeft: 12,
      flex: 1,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: isDark ? "#FFF" : "#111",
    },
    itemSubtitle: {
      fontSize: 14,
      color: isDark ? "#B3B3B3" : "#555",
    },
  });
