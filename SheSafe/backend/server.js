const express = require('express');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const smsService = require('./services/smsService');
const directionsService = require('./services/directionsService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

global.io = io;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('📱 Client connected:', socket.id);

  // Join a chat room
  socket.on('joinChat', (matchId) => {
    socket.join(matchId);
    console.log(`User joined chat room: ${matchId}`);
  });

  // Leave a chat room
  socket.on('leaveChat', (matchId) => {
    socket.leave(matchId);
    console.log(`User left chat room: ${matchId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('📱 Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shesafe';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected (port 27017)'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const sosLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { success: false, message: 'SOS rate limit exceeded, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'SMS rate limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', generalLimiter);
app.use('/send-sos', sosLimiter);
app.use('/sms/', smsLimiter);

// Input Validation Middleware
function validateRequired(fields) {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }
    next();
  };
}

function sanitizeString(value, maxLength = 500) {
  if (typeof value !== 'string') return value;
  return value.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

function validateLocation(req, res, next) {
  const { lat, lng } = req.body;
  if (lat !== undefined && lng !== undefined) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }
  }
  next();
}

function validatePhone(phone) {
  if (!phone) return true;
  return /^[0-9]{10,15}$/.test(phone.replace(/[\s-]/g, ''));
}

function validateUUID(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function validateMongoId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// ==================== TRIP SCHEMA ====================

const tripSchema = new mongoose.Schema({
  tripId: {
    type: String,
    unique: true,
    required: true
  },
  origin: {
    lat: Number,
    lng: Number,
    address: String
  },
  destination: {
    lat: Number,
    lng: Number,
    address: String
  },
  eta: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'alerted'],
    default: 'active'
  },
  route: [{
    lat: Number,
    lng: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  currentLocation: {
    lat: Number,
    lng: Number,
    timestamp: Date
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  markedSafeAt: Date,
  isMarkedSafe: {
    type: Boolean,
    default: false
  },
  alertSent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Trip = mongoose.model('Trip', tripSchema);

// ==================== SOS LOG SCHEMA ====================

const sosLogSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  locationUrl: String,
  timestamp: Date
}, { timestamps: true });

const SOSLog = mongoose.model('SOSLog', sosLogSchema);

// ==================== RIDE SCHEMA ====================

const rideSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    enum: ['Cab', 'Auto', 'Bus', 'Other'],
    required: true
  },
  driverName: {
    type: String,
    default: 'Unknown'
  },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  sharedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Ride = mongoose.model('Ride', rideSchema);

// ==================== ALERT SCHEMA ====================

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Harassment', 'Poor Lighting', 'Unsafe Road', 'Suspicious Activity', 'Other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    lat: Number,
    lng: Number
  },
  upvotes: {
    type: Number,
    default: 1
  },
  reportedBy: {
    type: String,
    default: 'Anonymous'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
  }
}, { timestamps: true });

const Alert = mongoose.model('Alert', alertSchema);

// ==================== BUDDY SCHEMA ====================

const buddyRequestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: 'Anonymous'
  },
  origin: {
    lat: Number,
    lng: Number,
    address: String
  },
  destination: {
    lat: Number,
    lng: Number,
    address: String
  },
  departureTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'accepted', 'expired'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const BuddyRequest = mongoose.model('BuddyRequest', buddyRequestSchema);

// ==================== MATCH SCHEMA ====================

const matchSchema = new mongoose.Schema({
  user1Id: String,
  user2Id: String,
  user1Name: String,
  user2Name: String,
  origin1: { lat: Number, lng: Number, address: String },
  origin2: { lat: Number, lng: Number, address: String },
  destination1: { lat: Number, lng: Number, address: String },
  destination2: { lat: Number, lng: Number, address: String },
  departureTime: Date,
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Match = mongoose.model('Match', matchSchema);

// ==================== CHAT MESSAGE SCHEMA ====================

const chatMessageSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  senderId: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    default: 'User'
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// ==================== USER SCHEMA ====================

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    default: 'User'
  },
  phone: {
    type: String,
    default: ''
  },
  emergencyContacts: [{
    name: String,
    phone: String,
    relation: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// ==================== HELPER FUNCTIONS ====================

// Haversine formula for distance calculation (in km)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}


// Calculate route safety score based on alerts
async function calculateRouteSafety(routePoints) {
  if (!routePoints || routePoints.length < 2) {
    return { score: 100, alerts: [] };
  }

  // Alert weights
  const weights = {
    'Harassment': 10,
    'Suspicious Activity': 7,
    'Poor Lighting': 5,
    'Unsafe Road': 6,
    'Other': 4
  };

  const nearbyAlerts = [];
  const alertRadius = 0.2; // 200 meters in km

  // Get all active alerts
  const now = new Date();
  const activeAlerts = await Alert.find({
    expiresAt: { $gt: now }
  });

  // Check each alert against route points
  for (const alert of activeAlerts) {
    for (const point of routePoints) {
      const distance = calculateDistance(
        point.lat, point.lng,
        alert.location.lat, alert.location.lng
      );

      if (distance <= alertRadius) {
        const weight = weights[alert.type] || 4;
        nearbyAlerts.push({
          alert: alert,
          weight: weight,
          distance: distance
        });
        break; // Only count each alert once
      }
    }
  }

  // Calculate total penalty
  const totalPenalty = nearbyAlerts.reduce((sum, item) => sum + item.weight, 0);
  const safetyScore = Math.max(0, 100 - totalPenalty);

  return {
    score: safetyScore,
    alerts: nearbyAlerts.map(a => ({
      id: a.alert._id,
      type: a.alert.type,
      description: a.alert.description,
      distance: Math.round(a.distance * 1000) + 'm'
    }))
  };
}

// ==================== TRIP APIs ====================

// POST /trip/start - Start a new trip
app.post('/trip/start', async (req, res) => {
  try {
    const { origin, destination, eta, contactPhone } = req.body;

    if (!origin || !destination || !eta) {
      return res.status(400).json({
        success: false,
        message: 'Origin, destination, and ETA are required'
      });
    }

    const tripId = uuidv4();
    const baseUrl = `http://${req.headers.host}`;

    // Create new trip
    const trip = new Trip({
      tripId,
      origin,
      destination,
      eta: new Date(eta),
      currentLocation: origin,
      status: 'active'
    });

    await trip.save();

    console.log('New trip started:', {
      tripId,
      origin: `${origin.lat}, ${origin.lng}`,
      destination: `${destination.lat}, ${destination.lng}`,
      eta: new Date(eta)
    });

    res.json({
      success: true,
      message: 'Trip started successfully',
      tripId,
      trackingLink: `${baseUrl}/track/${tripId}`
    });

  } catch (error) {
    console.error('Error starting trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start trip',
      error: error.message
    });
  }
});

// POST /trip/update-location - Update current location
app.post('/trip/update-location', async (req, res) => {
  try {
    const { tripId, lat, lng } = req.body;

    if (!tripId || lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID, latitude, and longitude are required'
      });
    }

    const trip = await Trip.findOne({ tripId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Trip is not active'
      });
    }

    // Update current location and add to route
    trip.currentLocation = {
      lat,
      lng,
      timestamp: new Date()
    };

    trip.route.push({
      lat,
      lng,
      timestamp: new Date()
    });

    await trip.save();

    console.log(`Location updated for trip ${tripId}: ${lat}, ${lng}`);

    res.json({
      success: true,
      message: 'Location updated'
    });

  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
});

// POST /trip/mark-safe - Mark trip as safe
app.post('/trip/mark-safe', async (req, res) => {
  try {
    const { tripId } = req.body;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required'
      });
    }

    const trip = await Trip.findOne({ tripId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    trip.status = 'completed';
    trip.isMarkedSafe = true;
    trip.markedSafeAt = new Date();
    trip.endedAt = new Date();

    await trip.save();

    console.log(`Trip ${tripId} marked as safe`);

    res.json({
      success: true,
      message: 'Trip marked as safe',
      endedAt: trip.endedAt
    });

  } catch (error) {
    console.error('Error marking trip as safe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark trip as safe',
      error: error.message
    });
  }
});

// POST /trip/end - End trip without marking safe
app.post('/trip/end', async (req, res) => {
  try {
    const { tripId } = req.body;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required'
      });
    }

    const trip = await Trip.findOne({ tripId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    trip.status = 'completed';
    trip.endedAt = new Date();

    await trip.save();

    console.log(`Trip ${tripId} ended`);

    res.json({
      success: true,
      message: 'Trip ended'
    });

  } catch (error) {
    console.error('Error ending trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end trip',
      error: error.message
    });
  }
});

// GET /trip/:tripId - Get trip details
app.get('/trip/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findOne({ tripId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      trip: {
        tripId: trip.tripId,
        origin: trip.origin,
        destination: trip.destination,
        eta: trip.eta,
        status: trip.status,
        currentLocation: trip.currentLocation,
        startedAt: trip.startedAt,
        isMarkedSafe: trip.isMarkedSafe,
        markedSafeAt: trip.markedSafeAt,
        endedAt: trip.endedAt
      }
    });

  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip',
      error: error.message
    });
  }
});

// GET /trip/history - Get all trips
app.get('/trip/history', async (req, res) => {
  try {
    const trips = await Trip.find()
      .sort({ startedAt: -1 })
      .limit(50); // Last 50 trips

    res.json({
      success: true,
      count: trips.length,
      trips: trips.map(trip => ({
        tripId: trip.tripId,
        origin: trip.origin,
        destination: trip.destination,
        eta: trip.eta,
        status: trip.status,
        startedAt: trip.startedAt,
        endedAt: trip.endedAt,
        isMarkedSafe: trip.isMarkedSafe,
        markedSafeAt: trip.markedSafeAt,
        alertSent: trip.alertSent
      }))
    });

  } catch (error) {
    console.error('Error fetching trip history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip history',
      error: error.message
    });
  }
});

// GET /track/:tripId - Public tracking page (NO LOGIN REQUIRED)
app.get('/track/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findOne({ tripId });

    if (!trip) {
      return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    }

    // Send the tracking page HTML
    res.sendFile(path.join(__dirname, 'public', 'tracking.html'));

  } catch (error) {
    console.error('Error loading tracking page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load tracking page',
      error: error.message
    });
  }
});

// GET /api/track/:tripId - API endpoint for tracking data
app.get('/api/track/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findOne({ tripId });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      trip: {
        tripId: trip.tripId,
        origin: trip.origin,
        destination: trip.destination,
        eta: trip.eta,
        status: trip.status,
        currentLocation: trip.currentLocation,
        startedAt: trip.startedAt,
        isMarkedSafe: trip.isMarkedSafe,
        route: trip.route
      }
    });

  } catch (error) {
    console.error('Error fetching tracking data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tracking data',
      error: error.message
    });
  }
});

// ==================== SOS APIs ====================

app.post('/send-sos', validateLocation, async (req, res) => {
  try {
    const { lat, lng, userId } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const sosEntry = new SOSLog({
      lat: latitude,
      lng: longitude,
      locationUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
      timestamp: new Date()
    });
    await sosEntry.save();

    console.log('SOS Alert Received:', { lat: latitude, lng: longitude });

    await smsService.sendEmergencySMS(latitude, longitude, null, userId);

    res.json({
      success: true,
      message: 'SOS alert triggered successfully',
      data: sosEntry
    });

  } catch (error) {
    console.error('SOS Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send SOS alert',
      error: error.message
    });
  }
});

app.get('/sos-logs', async (req, res) => {
  try {
    const logs = await SOSLog.find()
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Error fetching SOS logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SOS logs',
      error: error.message
    });
  }
});

// ==================== RIDE APIs ====================

// POST /ride/add - Add a new ride
app.post('/ride/add', async (req, res) => {
  try {
    const { vehicleNumber, vehicleType, driverName, lat, lng } = req.body;

    // Validate inputs
    if (!vehicleNumber || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle number and type are required'
      });
    }

    const validTypes = ['Cab', 'Auto', 'Bus', 'Other'];
    if (!validTypes.includes(vehicleType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle type'
      });
    }

    const ride = new Ride({
      vehicleNumber: sanitizeString(vehicleNumber, 15).toUpperCase(),
      vehicleType,
      driverName: sanitizeString(driverName, 100) || 'Unknown',
      location: {
        lat: lat ? parseFloat(lat) : 0,
        lng: lng ? parseFloat(lng) : 0,
        address: `https://maps.google.com/?q=${lat || 0},${lng || 0}`
      },
      sharedAt: new Date()
    });

    await ride.save();

    console.log('New ride added:', {
      vehicleNumber: ride.vehicleNumber,
      vehicleType: ride.vehicleType,
      driverName: ride.driverName,
      location: ride.location.address
    });

    // Send SMS to emergency contacts
    const locationUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const message = `🚗 RIDE STARTED\nVehicle: ${ride.vehicleNumber}\nType: ${ride.vehicleType}\nDriver: ${ride.driverName}\nLocation: ${locationUrl}`;
    
    await smsService.sendEmergencySMS(lat || 0, lng || 0, message);

    res.json({
      success: true,
      message: 'Ride details shared with emergency contacts',
      ride: {
        id: ride._id,
        vehicleNumber: ride.vehicleNumber,
        vehicleType: ride.vehicleType,
        driverName: ride.driverName,
        location: ride.location,
        sharedAt: ride.sharedAt
      }
    });

  } catch (error) {
    console.error('Error adding ride:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add ride',
      error: error.message
    });
  }
});

// GET /ride/history - Get all rides
app.get('/ride/history', async (req, res) => {
  try {
    const rides = await Ride.find()
      .sort({ sharedAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: rides.length,
      rides: rides.map(ride => ({
        id: ride._id,
        vehicleNumber: ride.vehicleNumber,
        vehicleType: ride.vehicleType,
        driverName: ride.driverName,
        location: ride.location,
        sharedAt: ride.sharedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching ride history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ride history',
      error: error.message
    });
  }
});

// POST /ride/share - Reshare a specific ride
app.post('/ride/share', async (req, res) => {
  try {
    const { rideId } = req.body;

    if (!rideId) {
      return res.status(400).json({
        success: false,
        message: 'Ride ID is required'
      });
    }

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Resend SMS
    const message = `🚗 RIDE REMINDER\nVehicle: ${ride.vehicleNumber}\nType: ${ride.vehicleType}\nDriver: ${ride.driverName}\nLocation: ${ride.location.address}`;
    
    await smsService.sendEmergencySMS(ride.location.lat || 0, ride.location.lng || 0, message);

    res.json({
      success: true,
      message: 'Ride details resent to emergency contacts'
    });

  } catch (error) {
    console.error('Error sharing ride:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share ride',
      error: error.message
    });
  }
});

// ==================== ALERT APIs ====================

// POST /alert/add - Add a new alert
app.post('/alert/add', async (req, res) => {
  try {
    const { type, description, lat, lng, reportedBy } = req.body;

    if (!type || !description || lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Type, description, latitude, and longitude are required'
      });
    }

    const validTypes = ['Harassment', 'Poor Lighting', 'Unsafe Road', 'Suspicious Activity', 'Other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert type'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const alert = new Alert({
      type,
      description: sanitizeString(description, 500),
      location: {
        lat: latitude,
        lng: longitude
      },
      reportedBy: sanitizeString(reportedBy, 50) || 'Anonymous',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      upvotes: 1
    });

    await alert.save();

    console.log('New alert added:', {
      type: alert.type,
      description: alert.description,
      location: `${alert.location.lat}, ${alert.location.lng}`
    });

    res.json({
      success: true,
      message: 'Alert reported successfully',
      alert: {
        id: alert._id,
        type: alert.type,
        description: alert.description,
        location: alert.location,
        upvotes: alert.upvotes,
        createdAt: alert.createdAt,
        expiresAt: alert.expiresAt
      }
    });

  } catch (error) {
    console.error('Error adding alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add alert',
      error: error.message
    });
  }
});

// GET /alert/all - Get all active alerts (last 48 hours)
app.get('/alert/all', async (req, res) => {
  try {
    const now = new Date();
    
    // Get alerts from last 48 hours
    const alerts = await Alert.find({
      expiresAt: { $gt: now } // Only non-expired alerts
    })
    .sort({ createdAt: -1 })
    .limit(100);

    res.json({
      success: true,
      count: alerts.length,
      alerts: alerts.map(alert => ({
        _id: alert._id,
        id: alert._id,
        type: alert.type,
        description: alert.description,
        location: alert.location,
        upvotes: alert.upvotes,
        reportedBy: alert.reportedBy,
        createdAt: alert.createdAt,
        expiresAt: alert.expiresAt
      }))
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
});

// POST /alert/upvote - Upvote an alert
app.post('/alert/upvote', async (req, res) => {
  try {
    const { alertId } = req.body;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: 'Alert ID is required'
      });
    }

    const alert = await Alert.findById(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Check if expired
    if (new Date() > alert.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'This alert has expired'
      });
    }

    // Increment upvotes
    alert.upvotes += 1;
    // Reset expiry time (refresh 48 hours)
    alert.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await alert.save();

    res.json({
      success: true,
      message: 'Alert upvoted',
      upvotes: alert.upvotes
    });

  } catch (error) {
    console.error('Error upvoting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upvote alert',
      error: error.message
    });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ==================== USER APIs ====================

// POST /user/register - Register user
app.post('/user/register', async (req, res) => {
  try {
    const { userId, name, phone, emergencyContacts } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!validateUUID(userId) && !/^[a-zA-Z0-9_-]{3,50}$/.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    let user = await User.findOne({ userId });

    if (user) {
      user.name = sanitizeString(name, 100) || user.name;
      user.phone = sanitizeString(phone, 20) || user.phone;
      user.emergencyContacts = emergencyContacts || user.emergencyContacts;
      await user.save();
    } else {
      user = new User({
        userId,
        name: sanitizeString(name, 100) || 'User',
        phone: sanitizeString(phone, 20) || '',
        emergencyContacts: emergencyContacts || []
      });
      await user.save();
    }

    res.json({
      success: true,
      message: 'User registered successfully',
      user: {
        userId: user.userId,
        name: user.name,
        phone: user.phone,
        emergencyContacts: user.emergencyContacts
      }
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
});

// GET /user/:userId - Get user details
app.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        userId: user.userId,
        name: user.name,
        phone: user.phone,
        emergencyContacts: user.emergencyContacts
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// PUT /user/:userId - Update user details
app.put('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, emergencyContacts } = req.body;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (emergencyContacts) user.emergencyContacts = emergencyContacts;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        userId: user.userId,
        name: user.name,
        phone: user.phone,
        emergencyContacts: user.emergencyContacts
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// POST /user/:userId/emergency - Add emergency contact
app.post('/user/:userId/emergency', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, relation } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.emergencyContacts.push({
      name: sanitizeString(name, 100),
      phone: sanitizeString(phone, 20),
      relation: sanitizeString(relation, 50) || 'Other'
    });
    await user.save();

    res.json({
      success: true,
      message: 'Emergency contact added',
      emergencyContacts: user.emergencyContacts
    });

  } catch (error) {
    console.error('Error adding emergency contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add emergency contact',
      error: error.message
    });
  }
});

// ==================== BUDDY APIs ====================

// POST /buddy/find - Find buddy matches
app.post('/buddy/find', async (req, res) => {
  try {
    const { userId, userName, origin, destination, departureTime } = req.body;

    if (!origin || !destination || !departureTime) {
      return res.status(400).json({
        success: false,
        message: 'Origin, destination, and departure time are required'
      });
    }

    // Create buddy request
    const buddyRequest = new BuddyRequest({
      userId: userId || 'user_' + Date.now(),
      userName: userName || 'Anonymous',
      origin,
      destination,
      departureTime: new Date(departureTime),
      status: 'pending'
    });

    await buddyRequest.save();

    // Find matches (pending requests within 30 min time diff and 5km radius)
    const timeWindow = 30 * 60 * 1000; // 30 minutes
    const distanceThreshold = 5; // 5 km

    const potentialMatches = await BuddyRequest.find({
      _id: { $ne: buddyRequest._id },
      status: 'pending',
      departureTime: {
        $gte: new Date(new Date(departureTime).getTime() - timeWindow),
        $lte: new Date(new Date(departureTime).getTime() + timeWindow)
      }
    });

    const matches = [];

    for (const match of potentialMatches) {
      // Check origin distance
      const originDist = calculateDistance(
        origin.lat, origin.lng,
        match.origin.lat, match.origin.lng
      );

      // Check destination distance
      const destDist = calculateDistance(
        destination.lat, destination.lng,
        match.destination.lat, match.destination.lng
      );

      if (originDist <= distanceThreshold && destDist <= distanceThreshold) {
        // Calculate route overlap percentage (simplified)
        const totalDist = originDist + destDist;
        const overlapScore = Math.max(0, 100 - (totalDist * 10));

        matches.push({
          requestId: match._id,
          userId: match.userId,
          userName: match.userName,
          origin: match.origin,
          destination: match.destination,
          departureTime: match.departureTime,
          matchPercentage: Math.round(overlapScore),
          originDistance: originDist.toFixed(1),
          destinationDistance: destDist.toFixed(1)
        });
      }
    }

    // Sort by match percentage
    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json({
      success: true,
      requestId: buddyRequest._id,
      matches: matches.slice(0, 10) // Return top 10 matches
    });

  } catch (error) {
    console.error('Error finding buddy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find buddy',
      error: error.message
    });
  }
});

// POST /buddy/accept - Accept a buddy match
app.post('/buddy/accept', async (req, res) => {
  try {
    const { userId, userName, requestId, matchedRequestId } = req.body;

    if (!requestId || !matchedRequestId) {
      return res.status(400).json({
        success: false,
        message: 'Request IDs are required'
      });
    }

    // Get both requests
    const request1 = await BuddyRequest.findById(requestId);
    const request2 = await BuddyRequest.findById(matchedRequestId);

    if (!request1 || !request2) {
      return res.status(404).json({
        success: false,
        message: 'Buddy request not found'
      });
    }

    // Create match
    const match = new Match({
      user1Id: request1.userId,
      user2Id: request2.userId,
      user1Name: request1.userName,
      user2Name: request2.userName,
      origin1: request1.origin,
      origin2: request2.origin,
      destination1: request1.destination,
      destination2: request2.destination,
      departureTime: request1.departureTime,
      status: 'active'
    });

    await match.save();

    // Update request statuses
    request1.status = 'matched';
    request2.status = 'matched';
    await request1.save();
    await request2.save();

    console.log(`✅ New match created: ${match._id}`);

    res.json({
      success: true,
      matchId: match._id,
      match: {
        user1Id: match.user1Id,
        user2Id: match.user2Id,
        user1Name: match.user1Name,
        user2Name: match.user2Name,
        departureTime: match.departureTime
      }
    });

  } catch (error) {
    console.error('Error accepting buddy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept buddy',
      error: error.message
    });
  }
});

// GET /buddy/matches/:userId - Get user's matches
app.get('/buddy/matches/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const matches = await Match.find({
      $or: [{ user1Id: userId }, { user2Id: userId }],
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: matches.length,
      matches: matches.map(m => ({
        matchId: m._id,
        partnerId: m.user1Id === userId ? m.user2Id : m.user1Id,
        partnerName: m.user1Id === userId ? m.user2Name : m.user1Name,
        origin: m.user1Id === userId ? m.origin1 : m.origin2,
        destination: m.user1Id === userId ? m.destination1 : m.destination2,
        departureTime: m.departureTime,
        createdAt: m.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
      error: error.message
    });
  }
});

// ==================== CHAT APIs ====================

// GET /chat/:matchId - Get chat messages
app.get('/chat/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    const messages = await ChatMessage.find({ matchId })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({
      success: true,
      count: messages.length,
      messages: messages.map(m => ({
        id: m._id,
        senderId: m.senderId,
        senderName: m.senderName,
        message: m.message,
        createdAt: m.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat',
      error: error.message
    });
  }
});

// POST /chat/send - Send a chat message
app.post('/chat/send', async (req, res) => {
  try {
    const { matchId, senderId, senderName, message } = req.body;

    if (!matchId || !senderId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Match ID, sender ID, and message are required'
      });
    }

    const chatMessage = new ChatMessage({
      matchId,
      senderId,
      senderName: sanitizeString(senderName, 50) || 'User',
      message: sanitizeString(message, 1000)
    });

    await chatMessage.save();

    if (global.io) {
      global.io.to(matchId).emit('newMessage', {
        id: chatMessage._id,
        senderId: chatMessage.senderId,
        senderName: chatMessage.senderName,
        message: chatMessage.message,
        createdAt: chatMessage.createdAt
      });
    }

    res.json({
      success: true,
      message: 'Message sent',
      data: {
        id: chatMessage._id,
        senderId: chatMessage.senderId,
        senderName: chatMessage.senderName,
        message: chatMessage.message,
        createdAt: chatMessage.createdAt
      }
    });

  } catch (error) {
    console.error('Error sending chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// ==================== ROUTE SUGGESTION APIs ====================

// POST /route/suggest - Get safest and fastest routes
app.post('/route/suggest', async (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }

    const originCoords = {
      lat: parseFloat(origin.lat || origin.latitude),
      lng: parseFloat(origin.lng || origin.longitude)
    };
    const destCoords = {
      lat: parseFloat(destination.lat || destination.latitude),
      lng: parseFloat(destination.lng || destination.longitude)
    };

    if (isNaN(originCoords.lat) || isNaN(originCoords.lng) || 
        isNaN(destCoords.lat) || isNaN(destCoords.lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const [drivingResult, walkingResult] = await Promise.all([
      directionsService.getDirections(originCoords, destCoords, 'driving'),
      directionsService.getDirections(originCoords, destCoords, 'walking')
    ]);

    const routes = [];

    if (drivingResult.success) {
      const safety = await calculateRouteSafety(drivingResult.data.points);
      routes.push({
        ...drivingResult.data,
        name: 'Fastest Route',
        safetyScore: safety.score,
        safetyAlerts: safety.alerts
      });
    }

    if (walkingResult.success) {
      const safety = await calculateRouteSafety(walkingResult.data.points);
      routes.push({
        ...walkingResult.data,
        name: 'Safest Route',
        safetyScore: safety.score,
        safetyAlerts: safety.alerts
      });
    }

    if (routes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No routes found between these locations'
      });
    }

    const fastestRoute = [...routes].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))[0];
    const safestRoute = [...routes].sort((a, b) => b.safetyScore - a.safetyScore)[0];

    res.json({
      success: true,
      fastest: {
        distance: fastestRoute.distance,
        duration: fastestRoute.duration,
        points: fastestRoute.points,
        safetyScore: fastestRoute.safetyScore,
        safetyAlerts: fastestRoute.safetyAlerts || []
      },
      safest: {
        distance: safestRoute.distance,
        duration: safestRoute.duration,
        points: safestRoute.points,
        safetyScore: safestRoute.safetyScore,
        safetyAlerts: safestRoute.safetyAlerts || []
      }
    });

  } catch (error) {
    console.error('Error suggesting routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suggest routes',
      error: error.message
    });
  }
});

// ==================== CHECK-IN API ====================

const checkInSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['done', 'missed'],
    required: true
  },
  missedCount: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const CheckIn = mongoose.model('CheckIn', checkInSchema);

// POST /checkin/status - Record check-in status
app.post('/checkin/status', async (req, res) => {
  try {
    const { tripId, status, missedCount } = req.body;

    if (!tripId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID and status are required'
      });
    }

    const validStatuses = ['done', 'missed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use "done" or "missed"'
      });
    }

    const checkIn = new CheckIn({
      tripId,
      status,
      missedCount: missedCount || 0,
      timestamp: new Date()
    });

    await checkIn.save();

    console.log(`📝 Check-in recorded for trip ${tripId}: ${status} (missed: ${missedCount || 0})`);

    res.json({
      success: true,
      message: 'Check-in status recorded',
      data: {
        id: checkIn._id,
        tripId: checkIn.tripId,
        status: checkIn.status,
        missedCount: checkIn.missedCount,
        timestamp: checkIn.timestamp
      }
    });

  } catch (error) {
    console.error('Error recording check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record check-in status',
      error: error.message
    });
  }
});

// GET /checkin/history/:tripId - Get check-in history for a trip
app.get('/checkin/history/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;

    const checkIns = await CheckIn.find({ tripId })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      count: checkIns.length,
      checkIns: checkIns.map(c => ({
        id: c._id,
        tripId: c.tripId,
        status: c.status,
        missedCount: c.missedCount,
        timestamp: c.timestamp
      }))
    });

  } catch (error) {
    console.error('Error fetching check-in history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch check-in history',
      error: error.message
    });
  }
});

// ==================== AUTO ALERT SYSTEM ====================

// Check for overdue trips every minute
setInterval(async () => {
  try {
    const now = new Date();
    
    // Find active trips that are overdue (ETA + 10 minutes)
    const overdueTrips = await Trip.find({
      status: 'active',
      isMarkedSafe: false,
      eta: {
        $lte: new Date(now.getTime() - 10 * 60 * 1000) // ETA + 10 minutes
      }
    });

    for (const trip of overdueTrips) {
      if (!trip.alertSent) {
        console.log(`⚠️ ALERT: Trip ${trip.tripId} is overdue!`);
        
        // Send alert SMS
        const lastLocation = trip.currentLocation || trip.origin;
        const locationUrl = lastLocation
          ? `https://maps.google.com/?q=${lastLocation.lat},${lastLocation.lng}`
          : 'No location data';

        const message = `URGENT! User has not checked in. Last known location: ${locationUrl}`;
        
        await smsService.sendEmergencySMS(lastLocation.lat || 0, lastLocation.lng || 0, message);

        // Update trip status
        trip.status = 'alerted';
        trip.alertSent = true;
        await trip.save();

        console.log(`✅ Alert sent for trip ${trip.tripId}`);
      }
    }
  } catch (error) {
    console.error('Error in auto alert system:', error);
  }
}, 60000); // Check every minute

// Check for buddy safety - notify if buddy doesn't mark safe
setInterval(async () => {
  try {
    const now = new Date();
    
    // Find active matches where ETA + 15 minutes has passed
    const activeMatches = await Match.find({
      status: 'active'
    });

    for (const match of activeMatches) {
      const departureTime = new Date(match.departureTime);
      const safeDeadline = new Date(departureTime.getTime() + 15 * 60 * 1000); // ETA + 15 min

      // If departure time + 15 min has passed, check if both marked safe
      // For now, we just send notification to all connected sockets
      if (now > safeDeadline && global.io) {
        global.io.to(match._id.toString()).emit('safetyCheck', {
          matchId: match._id,
          message: 'Please mark yourself as safe! Tap to confirm.',
          deadline: safeDeadline
        });
      }
    }
  } catch (error) {
    console.error('Error in buddy safety check:', error);
  }
}, 60000); // Check every minute

// ==================== SERVER START ====================

server.listen(PORT, () => {
  console.log(`\n🚀 SheSafe Backend Server running on http://localhost:${PORT}`);
  console.log('\n📱 Available Endpoints:');
  console.log('\n🆘 SOS:');
  console.log('    POST /send-sos           - Trigger SOS alert');
  console.log('    GET  /sos-logs           - Get SOS logs');
  console.log('\n🚗 Trip Management:');
  console.log('    POST /trip/start          - Start a new trip');
  console.log('    POST /trip/update-location - Update current location');
  console.log('    POST /trip/mark-safe     - Mark trip as safe');
  console.log('    POST /trip/end           - End trip');
  console.log('    GET  /trip/:tripId       - Get trip details');
  console.log('    GET  /trip/history       - Get all trips');
  console.log('\n🚕 Ride Verification:');
  console.log('    POST /ride/add            - Add a new ride');
  console.log('    GET  /ride/history       - Get ride history');
  console.log('    POST /ride/share         - Reshare ride details');
  console.log('\n⚠️  Community Alerts:');
  console.log('    POST /alert/add           - Report an incident');
  console.log('    GET  /alert/all          - Get active alerts (48h)');
  console.log('    POST /alert/upvote       - Upvote an alert');
  console.log('\n👥 Buddy System:');
  console.log('    POST /buddy/find          - Find buddy matches');
  console.log('    POST /buddy/accept        - Accept a buddy match');
  console.log('    GET  /buddy/matches/:userId - Get user matches');
  console.log('\n💬 Chat:');
  console.log('    GET  /chat/:matchId      - Get chat messages');
  console.log('    POST /chat/send          - Send a message');
  console.log('\n🗺️  Route Suggestion:');
  console.log('    POST /route/suggest      - Get safest/fastest routes');
  console.log('\n🗺️  Tracking (Public):');
  console.log('    GET  /track/:tripId      - Open tracking page');
  console.log('    GET  /api/track/:tripId   - Get tracking data (API)');
  console.log('\n❤️  Health:');
  console.log('    GET  /health             - Server health check');
  console.log('\n⏰ Auto Alert: Checking for overdue trips every minute...');
  console.log('\n🔌 Socket.io: Enabled for real-time chat');
});
