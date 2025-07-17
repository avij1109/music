// screens/MoodsScreen.jsx (Updated with old UI and new theme support)
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

// Import the useTheme hook to keep theme support
import { useTheme } from '../contexts/ThemeContext';

// Using the moods from your old code
const moods = [
  { name: 'Happy', emoji: '😄', color: '#FFD700', key: 'happy' },
  { name: 'Sad', emoji: '😢', color: '#4682B4', key: 'sad' },
  { name: 'Energetic', emoji: '⚡️', color: '#FF4500', key: 'energetic' },
  { name: 'Chill', emoji: '🧘', color: '#87CEEB', key: 'chill' },
  { name: 'Party', emoji: '🎉', color: '#FF69B4', key: 'party' },
  { name: 'Workout', emoji: '💪', color: '#B22222', key: 'workout' },
  { name: 'Focus', emoji: '🧠', color: '#DDA0DD', key: 'focus' },
  { name: 'Romance', emoji: '❤️', color: '#FFB6C1', key: 'romance' },
];

export default function MoodsScreen({ navigation }) {
  // Get theme state from context
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  
  // Add a loading state for better UX
  const [loading, setLoading] = useState(false);

  const handleMoodSelect = (moodData) => {
    // Set loading to true to show indicator, even though navigation is fast
    setLoading(true);
    
    // Navigate to HomeScreen, which will handle fetching the recommendations
    navigation.navigate('HomeScreen', { 
      type: 'mood',
      mood: moodData.key,
      title: `${moodData.emoji} ${moodData.name} Vibes`,
    });

    // Reset loading state after a short delay
    setTimeout(() => setLoading(false), 500);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Finding your vibe...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.grid}>
        {moods.map((mood) => (
          <TouchableOpacity
            key={mood.name}
            style={[styles.moodCard, { backgroundColor: mood.color }]}
            onPress={() => handleMoodSelect(mood)}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={styles.moodName}>{mood.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// Merged styles from your old code with new theme-aware styles
const getStyles = (isDark) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: isDark ? '#121212' : '#ffffff' 
  },
  loadingContainer: { 
    flex: 1, 
    backgroundColor: isDark ? '#121212' : '#ffffff', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    color: isDark ? '#fff' : '#000', 
    marginTop: 10, 
    fontSize: 16 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-around', 
    padding: 10 
  },
  moodCard: { 
    width: '45%', 
    aspectRatio: 1, 
    margin: '2.5%', 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 3.84 
  },
  moodEmoji: { 
    fontSize: 40 
  },
  moodName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#000', // Black text on colored cards usually has better contrast
    marginTop: 5, 
    textShadowColor: 'rgba(255, 255, 255, 0.4)', 
    textShadowOffset: {width: -1, height: 1}, 
    textShadowRadius: 2 
  },
});
