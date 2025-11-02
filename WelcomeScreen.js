import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './context/AuthContext';

export default function WelcomeScreen({ navigation }) {
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>UniLodge Direct</Text>
        <Text style={styles.subtitle}>Find your student home, no agent fees.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="I'M A STUDENT (Find a Room)"
          onPress={() => navigation.navigate('StudentHome')}
          color="#007AFF"
        />
        <View style={styles.spacer} />
        <Button
          title="I'M A LANDLORD (List a Property)"
          onPress={() => navigation.navigate('LandlordHome')}
          color="#34C759"
        />
        <View style={styles.spacer} />
        <Button title="Logout" onPress={logout} color="#FF3B30" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8', // A light grey-blue background
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
  },
  header: {
    alignItems: 'center',
    marginBottom: 60, // Add space below the header
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C2A3A', // Dark blue color for the title
  },
  subtitle: {
    fontSize: 16,
    color: '#5A6A7A', // A softer grey for the subtitle
    marginTop: 8,
  },
  buttonContainer: {
    width: '80%', // Make the button container take up 80% of the screen width
  },
  spacer: {
    height: 20, // Adds a 20-pixel space between the buttons
  },
});