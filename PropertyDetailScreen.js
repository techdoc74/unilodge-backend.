import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://unilodge-backend-wvw6.onrender.com/api/properties';

export default function PropertyDetailScreen({ route, navigation }) {
  const { propertyId } = route.params;
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/${propertyId}`);
        const data = await response.json();
        setProperty(data);
      } catch (error) {
        console.error('Failed to fetch property details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [propertyId]);

  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  if (!property) {
    return <Text style={styles.centered}>Property not found.</Text>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView>
        {property.imageUrl && <Image source={{ uri: property.imageUrl }} style={styles.image} />}
        <View style={styles.detailsContainer}>
          <Text style={styles.address}>{property.address}</Text>
          <Text style={styles.detailText}>Monthly Rent: £{property.rent}</Text>
          <Text style={styles.detailText}>Bedrooms: {property.bedrooms}</Text>
          {/* You can add more details here later, like a description */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 20,
  },
  address: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 18,
    marginBottom: 5,
  },
});