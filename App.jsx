// App.jsx (Updated with ThemeContext)
import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Import the new provider and hook
import { ThemeProvider, useTheme } from './contexts/ThemeContext'; 

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import MoodsScreen from './screens/MoodsScreen';
import PersonalScreen from './screens/PersonalScreen';

import { loginWithSpotify, getUserProfile } from './lib/auth';
import { testApiCall } from './lib/spotify';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerContent({ navigation, token, onLogout }) {
  // Get theme state and toggle function from the context
  const { isDarkMode, toggleTheme } = useTheme(); 
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [validAvatar, setValidAvatar] = useState(true);
  const styles = getStyles(isDarkMode);

  useEffect(() => {
    getUserProfile(token)
      .then(setProfile)
      .catch((err) => console.error("Profile Error:", err))
      .finally(() => setLoadingProfile(false));
  }, [token]);

  const avatarUrl = Array.isArray(profile?.images) && profile.images.length > 0
    ? profile.images[0].url
    : null;

  return (
    <View style={styles.drawerContainer}>
      {/* Theme toggle now uses the function from the context */}
      <View style={styles.themeToggleContainer}>
        <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={isDarkMode ? '#fff' : '#000'} />
        <Text style={styles.themeToggleText}>{isDarkMode ? 'Dark' : 'Light'} Mode</Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme} // Use the toggle function from context
          thumbColor={isDarkMode ? '#1DB954' : '#f4f3f4'}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
        />
      </View>

      <View style={styles.profileContainer}>
        {loadingProfile ? (
          <ActivityIndicator color="#1DB954" />
        ) : (
          <>
            <Image
              source={{
                uri: validAvatar && avatarUrl
                  ? avatarUrl
                  : 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
              }}
              onError={() => setValidAvatar(false)}
              style={styles.avatar}
            />
            <Text style={styles.profileName}>
              {profile ? profile.display_name : 'User'}
            </Text>
            <Text style={styles.profileEmail}>
              {profile ? profile.email : ''}
            </Text>
          </>
        )}
      </View>

      <View style={styles.navContainer}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("HomeScreen")}> 
          <Ionicons name="home-outline" size={22} color={isDarkMode ? 'white' : 'black'} />
          <Text style={styles.navItemText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("MoodsScreen")}> 
          <Ionicons name="musical-notes-outline" size={22} color={isDarkMode ? 'white' : 'black'} />
          <Text style={styles.navItemText}>Find by Mood</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("PersonalScreen")}> 
          <Ionicons name="sparkles-outline" size={22} color={isDarkMode ? 'white' : 'black'} />
          <Text style={styles.navItemText}>Personal Picks</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.navItem} onPress={onLogout}> 
          <Ionicons name="log-out-outline" size={22} color="#ff4545" />
          <Text style={[styles.navItemText, { color: '#ff4545' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DrawerNavigator({ token, onLogout }) {
  // Get theme state from context to style the navigator itself
  const { isDarkMode } = useTheme();
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: isDarkMode ? '#121212' : '#fff' },
        headerTintColor: isDarkMode ? '#fff' : '#000',
        drawerStyle: { backgroundColor: isDarkMode ? '#121212' : '#fff', width: 250 },
      }}
      drawerContent={(props) => (
        // We no longer pass theme props here
        <DrawerContent {...props} token={token} onLogout={onLogout} />
      )}
    >
      {/* Screens no longer need theme passed in initialParams */}
      <Drawer.Screen name="HomeScreen" component={HomeScreen} initialParams={{ token }} options={{ title: 'Recommendations' }} />
      <Drawer.Screen name="MoodsScreen" component={MoodsScreen} initialParams={{ token }} options={{ title: 'Select a Mood' }} />
      <Drawer.Screen name="PersonalScreen" component={PersonalScreen} initialParams={{ token }} options={{ title: 'Personal Picks' }} />
    </Drawer.Navigator>
  );
}

// A new component to hold the main app logic, so it can be wrapped by the provider
function AppContent() {
  const { isDarkMode } = useTheme(); // Get theme for the NavigationContainer
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const accessToken = await loginWithSpotify();
      if (accessToken) {
        await testApiCall(accessToken);
        setToken(accessToken);
      }
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => setToken(null);

  return (
    <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
      {!token ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={handleLogin} loading={loading} />}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        <DrawerNavigator token={token} onLogout={handleLogout} />
      )}
    </NavigationContainer>
  );
}

// The root component now simply provides the theme context to the rest of the app
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const getStyles = (isDark) => StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: isDark ? '#121212' : '#ffffff',
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 10,
  },
  themeToggleText: {
    color: isDark ? 'white' : 'black',
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
  },
  profileContainer: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#282828' : '#ccc',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profileName: {
    color: isDark ? 'white' : '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: isDark ? '#B3B3B3' : '#555',
    fontSize: 14,
  },
  navContainer: {
    flex: 1,
    marginTop: 20,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  navItemText: {
    color: isDark ? 'white' : '#222',
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
  footerContainer: {
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#282828' : '#ccc',
  },
});
