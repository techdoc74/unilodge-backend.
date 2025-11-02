import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, useAuth } from './context/AuthContext';
import WelcomeScreen from './WelcomeScreen';
import StudentHomeScreen from './screens/StudentHomeScreen';
import LandlordHomeScreen from './LandlordHomeScreen';
import AuthScreen from './screens/AuthScreen';
import PropertyDetailScreen from './screens/PropertyDetailScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { authenticated, login } = useAuth();
  const [loading, setLoading] = useState(true);

  // Check if a token is stored on the device when the app starts
  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      if (token && userId) {
        login(token, userId); // Set the user as logged in
      }
      setLoading(false);
    };
    loadToken();
  }, []);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {authenticated ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="StudentHome" component={StudentHomeScreen} options={{ title: 'Find a Room' }} />
            <Stack.Screen name="LandlordHome" component={LandlordHomeScreen} options={{ title: 'My Properties' }} />
            <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: 'Property Details' }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}