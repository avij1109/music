import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { loginWithSpotify } from './lib/auth';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const accessToken = await loginWithSpotify();
      setToken(accessToken);
      Alert.alert('Success', 'Authentication successful');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spotify Authentication</Text>
      
      {token ? (
        <View>
          <Text style={styles.successText}>Logged In Successfully!</Text>
          <Text style={styles.tokenText}>Token: {token.substring(0, 20)}...</Text>
        </View>
      ) : (
        <Button 
          title={loading ? "Loading..." : "Login with Spotify"} 
          onPress={handleLogin}
          disabled={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: 'white',
  },
  successText: {
    fontSize: 18,
    color: '#1DB954',
    marginBottom: 10,
  },
  tokenText: {
    fontSize: 12,
    color: '#B3B3B3',
    textAlign: 'center',
  },
});