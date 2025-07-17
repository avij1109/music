import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';

export default function LoginScreen({ onLogin, loading }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.title}>Music Recommender</Text>
      <Text style={styles.subtitle}>Login to Spotify for personalized recommendations</Text>
      <TouchableOpacity style={styles.loginButton} onPress={onLogin} disabled={loading}>
        <Text style={styles.loginButtonText}>Login with Spotify</Text>
      </TouchableOpacity>
      {loading && <ActivityIndicator color="#1DB954" style={{ marginTop: 20 }} size="large" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#121212" },
  title: { fontSize: 32, fontWeight: "bold", color: "#FFF", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#B3B3B3", textAlign: "center", marginBottom: 30 },
  loginButton: { backgroundColor: "#1DB954", paddingVertical: 15, paddingHorizontal: 35, borderRadius: 30 },
  loginButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});
