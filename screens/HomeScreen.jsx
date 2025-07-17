// screens/HomeScreen.jsx (Updated with useTheme hook)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image, Linking } from 'react-native';

// Import the useTheme hook
import { useTheme } from '../contexts/ThemeContext';

import { getMLRecommendations, getMoodRecommendations } from '../lib/ml';
import { getUserTopTracks, getRecentlyPlayedTracks } from '../lib/spotify';

export default function HomeScreen({ navigation, route }) {
  // Get the token from navigation params
  const { token } = route.params; 
  // Get the theme state directly from the context
  const { isDarkMode } = useTheme(); 

  const [loading, setLoading] = useState(false);
  const [currentList, setCurrentList] = useState({
    tracks: [],
    title: 'Loading...',
    type: 'personal',
    mood: null,
  });

  // The styles will now automatically update whenever isDarkMode changes
  const styles = getStyles(isDarkMode);

  const fetchTrackDetails = async (trackIds) => {
    if (!trackIds || trackIds.length === 0) return [];
    try {
      const tracks = await Promise.all(
        trackIds.map(id =>
          fetch(`https://api.spotify.com/v1/tracks/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res => res.json())
        )
      );
      return tracks.filter(t => t && t.id);
    } catch (error) {
      Alert.alert("Error", "Could not fetch track details.");
      return [];
    }
  };

  const fetchAndSetData = async (fetchType, mood = null, title = 'AI-Powered Picks For You 🎧') => {
    setLoading(true);
    try {
      let trackIds;
      if (fetchType === 'personal') {
        const topTracks = await getUserTopTracks(token);
        const recentTracks = await getRecentlyPlayedTracks(token);
        trackIds = await getMLRecommendations(
          topTracks.map(t => t.id),
          recentTracks.map(t => t.id)
        );
      } else {
        trackIds = await getMoodRecommendations(mood);
      }

      const tracks = await fetchTrackDetails(trackIds);
      setCurrentList({ tracks, title, type: fetchType, mood });
    } catch (error) {
      Alert.alert("Error", `Could not fetch recommendations.`);
      setCurrentList({ ...currentList, tracks: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndSetData('personal');
  }, []);

  useEffect(() => {
    if (route.params?.type === 'mood' && route.params?.mood) {
      fetchAndSetData('mood', route.params.mood, route.params.title);
      navigation.setParams({ type: undefined, mood: undefined, title: undefined });
    }
  }, [route.params?.mood]);

  const handleRefresh = () => {
    fetchAndSetData(currentList.type, currentList.mood, currentList.title);
  };

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
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleRefresh} disabled={loading}>
          <Text style={styles.buttonText}>Refresh List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MoodsScreen')} disabled={loading}>
          <Text style={styles.buttonText}>Find by Mood</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{currentList.title}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#1DB954" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={currentList.tracks}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id + index.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>No recommendations found.</Text>}
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
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: 10,
    },
    button: {
      backgroundColor: isDark ? '#282828' : '#eeeeee',
      paddingVertical: 12,
      borderRadius: 25,
      width: '48%',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#bbb',
    },
    buttonText: {
      color: isDark ? '#fff' : '#000',
      fontWeight: 'bold',
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
