import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

 // Connect to the live backend on Render
const API_URL = 'https://unilodge-backend-wvw6.onrender.com/api/properties';

export default function StudentHomeScreen({ navigation }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProperties = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      // You might want to show an error message to the user
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProperties();
    setRefreshing(false);
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={properties}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('PropertyDetail', { propertyId: item._id })}>
            <View style={styles.propertyItem}>
              {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.propertyImage} />}
              <Text style={styles.propertyAddress}>{item.address}</Text>
              <Text>Rent: £{item.rent}/month</Text>
              <Text>Bedrooms: {item.bedrooms}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  propertyItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  propertyAddress: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  propertyImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginBottom: 10,
    borderRadius: 5,
  },
});