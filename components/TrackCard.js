// components/TrackCard.js
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';

export default function TrackCard({ trackId, token }) {
  const [track, setTrack] = useState(null);

  useEffect(() => {
    const fetchTrackDetails = async () => {
      try {
        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setTrack(data);
      } catch (err) {
        console.error('Failed to fetch track:', err);
      }
    };

    fetchTrackDetails();
  }, [trackId, token]);

  if (!track) {
    return <ActivityIndicator style={{ marginVertical: 10 }} color="#1DB954" />;
  }

  const openInSpotify = () => {
    const url = track.external_urls?.spotify;
    if (url) {
      Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={openInSpotify}>
      <Image source={{ uri: track.album.images[0].url }} style={styles.albumArt} />
      <View style={styles.info}>
        <Text style={styles.trackName}>{track.name}</Text>
        <Text style={styles.artist}>{track.artists.map(a => a.name).join(', ')}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    marginBottom: 10,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  albumArt: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  info: {
    marginLeft: 12,
    flexShrink: 1,
  },
  trackName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  artist: {
    color: '#B3B3B3',
    fontSize: 14,
  },
});
