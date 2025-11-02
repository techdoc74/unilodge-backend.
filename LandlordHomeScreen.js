import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, FlatList, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './context/AuthContext';

const API_BASE_URL = 'https://unilodge-backend-wvw6.onrender.com';

// --- PASTE YOUR CLOUDINARY CREDENTIALS HERE ---
const CLOUDINARY_CLOUD_NAME = 'dmoc99k6r';
const CLOUDINARY_UPLOAD_PRESET = 'unilodge_preset';

export default function LandlordHomeScreen() {
  const { userId, token } = useAuth(); // Get userId and token from our context

  // State for the form
  const [address, setAddress] = useState('');
  const [rent, setRent] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [editingId, setEditingId] = useState(null); // To track which property is being edited
  const [image, setImage] = useState(null); // To hold the selected image URI
  const [isUploading, setIsUploading] = useState(false);

  // State for the list of properties
  const [properties, setProperties] = useState([]);

  const fetchProperties = async () => {
    try {
      // Fetch properties specifically for the logged-in user
      const response = await fetch(`${API_BASE_URL}/api/properties/owner/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    }
  };

  const pickImage = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    const formData = new FormData();
    // The file needs to be in a specific format for Cloudinary
    const file = {
      uri,
      type: `image/${uri.split('.').pop()}`,
      name: `upload.${uri.split('.').pop()}`,
    };
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data.secure_url; // The public URL of the uploaded image
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error; // Re-throw the error to be caught by the caller
    }
  };

  useEffect(() => {
    if (userId) { // Only fetch if we have a userId
      fetchProperties();
    }
  }, [userId]); // Re-run if userId changes

  const handleSubmit = async () => {
    if (editingId) {
      // This is an update
      await handleUpdate();
    } else {
      // This is a new submission
      await handleCreate();
    }
  };

  const handleCreate = async () => {
    if (!address || !rent || !bedrooms) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setIsUploading(true);
    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      const response = await fetch(`${API_BASE_URL}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Add the token to the request
        },
        body: JSON.stringify({
          address,
          rent,
          bedrooms: bedrooms,
          imageUrl: imageUrl,
        }),
      });

      if (response.ok) {
        await fetchProperties(); // Refresh the list after adding
        Alert.alert('Success', 'Property listed successfully!');
        resetForm(); // Use resetForm to clear everything
      } else {
        throw new Error('Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to list property. Please try again.');
      console.error('Failed to submit property:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async () => {
    setIsUploading(true);
    try {
      let imageUrl = image; // Assume the image URL hasn't changed
      // If the `image` state is a local file URI, it means a new image was picked
      if (image && image.startsWith('file://')) {
        imageUrl = await uploadImage(image);
      }

      const response = await fetch(`${API_BASE_URL}/api/properties/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ address, rent, bedrooms, imageUrl }), // This was correct, but the create was not.
      });

      if (response.ok) {
        await fetchProperties(); // Refresh the list
        Alert.alert('Success', 'Property updated successfully!');
        resetForm();
      } else {
        throw new Error('Something went wrong during update');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update property.');
      console.error('Failed to update property:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // When a user presses "Edit", populate the form with that property's data
  const handleEdit = (property) => {
    setEditingId(property._id);
    setAddress(property.address);
    setRent(String(property.rent));
    setBedrooms(String(property.bedrooms));
    setImage(property.imageUrl); // Set the image for editing
  };

  const resetForm = () => {
    setEditingId(null);
    setAddress('');
    setRent('');
    setBedrooms('');
    setImage(null);
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/properties/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });

              if (response.ok) {
                await fetchProperties(); // Refresh the list from the server
                Alert.alert('Success', 'Property deleted.');
              } else if (response.status === 404) {
                Alert.alert('Error', 'This property was not found on the server. It may have already been deleted.');
                await fetchProperties();
              } else {
                throw new Error('Failed to delete on server');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete property.');
              console.error('Failed to delete property:', error);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>{editingId ? 'Edit Property' : 'List a New Property'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Property Address"
          value={address}
          onChangeText={setAddress}
        />
        <TextInput
          style={styles.input}
          placeholder="Monthly Rent (£)"
          value={rent}
          onChangeText={setRent}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Number of Bedrooms"
          value={bedrooms}
          onChangeText={setBedrooms}
          keyboardType="numeric"
        />
        <View style={styles.imagePicker}>
          <Button title="Pick an Image" onPress={pickImage} />
          {image && <Image source={{ uri: image }} style={styles.imagePreview} />}
        </View>

        <Button
          title={isUploading ? 'Submitting...' : (editingId ? 'Update Property' : 'List Property')}
          onPress={handleSubmit}
          disabled={isUploading}
        />
        {editingId && (
          <View style={{ marginTop: 10 }}>
            <Button title="Cancel Edit" onPress={resetForm} color="gray" />
          </View>
        )}
      </View>

      <Text style={styles.title}>My Listed Properties</Text>
      <FlatList
        data={properties}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.propertyItem}>
            <View style={styles.propertyDetails}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />}
                <Text style={styles.propertyAddress}>{item.address}</Text>
              </View>
              <Text>Rent: £{item.rent} | Beds: {item.bedrooms}</Text>
            </View>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  propertyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  propertyDetails: {
    flex: 1,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePreview: {
    width: 200,
    height: 150,
    marginTop: 10,
    resizeMode: 'cover',
    borderColor: '#ccc',
    borderWidth: 1,
  },
  thumbnail: {
    width: 50,
    height: 50,
    marginRight: 15,
    borderRadius: 5,
  },
  editButton: {
    backgroundColor: '#007AFF', // A blue color for edit
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF3B30', // A red color for delete
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});