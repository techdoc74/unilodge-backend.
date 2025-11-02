// backend/server.js
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb'); // Import MongoClient and ObjectId
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware');

const app = express();
// Render provides the PORT environment variable
const port = process.env.PORT || 4000;


// Use environment variables for sensitive data
const uri = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;


const client = new MongoClient(uri);
let propertiesCollection;
let usersCollection;

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable parsing of JSON bodies

// Define an API endpoint to get all properties
app.get('/api/properties', async (req, res) => {
  const properties = await propertiesCollection.find({}).toArray();
  res.json(properties);
});

// Get a single property by its ID
app.get('/api/properties/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const property = await propertiesCollection.findOne({ _id: new ObjectId(id) });
    res.json(property);
  } catch (error) {
    res.status(404).json({ message: 'Property not found' });
  }
});

// Get properties for a specific owner
app.get('/api/properties/owner/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  // Security check: ensure the requesting user is the one they claim to be
  if (req.userData.userId !== userId) {
    return res.status(403).json({ message: 'Authorization denied.' });
  }
  const properties = await propertiesCollection.find({ ownerId: new ObjectId(userId) }).toArray();
  res.json(properties);
});

// Define an API endpoint to create a new property
app.post('/api/properties', authMiddleware, async (req, res) => {
  const { address, rent, bedrooms, imageUrl } = req.body;
  const newProperty = {
    address,
    rent: parseInt(rent, 10), // Ensure rent is a number
    bedrooms: parseInt(bedrooms, 10), // Ensure bedrooms is a number
    imageUrl, // Add the image URL to the document
    ownerId: new ObjectId(req.userData.userId), // Get owner's ID from the authenticated token
  };
  const result = await propertiesCollection.insertOne(newProperty);
  res.status(201).json({ ...newProperty, _id: result.insertedId });
});

// Define an API endpoint to delete a property
app.delete('/api/properties/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const property = await propertiesCollection.findOne({ _id: new ObjectId(id) });
  if (property.ownerId.toString() !== req.userData.userId) {
    return res.status(403).json({ message: 'Authorization denied.' });
  }
  const result = await propertiesCollection.deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 1) {
    res.status(204).send(); // 204 No Content is a standard success response for delete
  } else {
    res.status(404).json({ message: 'Property not found' });
  }
});

// Define an API endpoint to update a property
app.put('/api/properties/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { address, rent, bedrooms, imageUrl } = req.body;
  const property = await propertiesCollection.findOne({ _id: new ObjectId(id) });
  if (property.ownerId.toString() !== req.userData.userId) {
    return res.status(403).json({ message: 'Authorization denied.' });
  }
  const result = await propertiesCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { address, rent: parseInt(rent, 10), bedrooms: parseInt(bedrooms, 10), imageUrl } }
  );

  if (result.modifiedCount === 1) {
    const updatedProperty = await propertiesCollection.findOne({ _id: new ObjectId(id) });
    res.json(updatedProperty);
  } else {
    res.status(404).json({ message: 'Property not found' });
  }
});

// --- AUTHENTICATION ENDPOINTS ---

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const existingUser = await usersCollection.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User with this email already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const result = await usersCollection.insertOne({ email, password: hashedPassword });

  res.status(201).json({ message: 'User registered successfully!', userId: result.insertedId });
});

// Login a user
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await usersCollection.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  // Create a token
  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' } // Token expires in 1 hour
  );

  res.json({ token, userId: user._id.toString() });
});

async function startServer() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas!");
    
    // Set the properties collection
    propertiesCollection = client.db("unilodge").collection("properties");
    usersCollection = client.db("unilodge").collection("users");

    app.listen(port, () => {
      console.log(`Backend server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

startServer();
