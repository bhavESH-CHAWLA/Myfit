import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || 'myfit-secret-key';

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    recoveryGoal: { type: String, required: true },
    sessionType: { type: String, required: true },
    progress: { type: Number, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true }
);

const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema);
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
let patientStore = [];
const userStore = [];

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<password>') || uri.includes('cluster0....')) {
    console.log('MongoDB URI not configured. Using in-memory data store.');
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Falling back to in-memory data store.');
    return false;
  }
}

async function getPatients() {
  const dbReady = mongoose.connection.readyState === 1;

  if (dbReady) {
    const patients = await Patient.find({}).sort({ createdAt: -1 }).lean();
    return patients.map((patient) => ({
      id: patient._id.toString(),
      name: patient.name,
      email: patient.email,
      recoveryGoal: patient.recoveryGoal,
      sessionType: patient.sessionType,
      progress: patient.progress,
      status: patient.status,
    }));
  }

  return patientStore;
}

async function savePatient(payload) {
  const safePayload = {
    name: payload.name || 'New patient',
    email: payload.email || 'patient@example.com',
    recoveryGoal: payload.recoveryGoal || 'Mobility',
    sessionType: payload.sessionType || 'Session',
    progress: Number(payload.progress || 0),
    status: payload.status || 'On track',
  };

  if (mongoose.connection.readyState === 1) {
    const patient = await Patient.create(safePayload);
    return {
      id: patient._id.toString(),
      ...safePayload,
    };
  }

  const newPatient = {
    id: Date.now(),
    ...safePayload,
  };

  patientStore = [newPatient, ...patientStore];
  return newPatient;
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'mongodb' : 'memory' });
});

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return res.status(400).json({ message: 'Enter your name, a valid email, and a password of at least 8 characters.' });
  }

  try {
    const existingUser = mongoose.connection.readyState === 1
      ? await User.findOne({ email })
      : userStore.find((user) => user.email === email);

    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists. Sign in instead.' });
    }

    const account = {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    };

    let user;
    if (mongoose.connection.readyState === 1) {
      const savedUser = await User.create(account);
      user = { id: savedUser._id.toString(), name: savedUser.name, email: savedUser.email };
    } else {
      const savedUser = { id: `user-${Date.now()}`, ...account };
      userStore.push(savedUser);
      user = { id: savedUser.id, name: savedUser.name, email: savedUser.email };
    }

    return res.status(201).json({ token: generateToken(user), user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists. Sign in instead.' });
    }
    return res.status(500).json({ message: 'Unable to create your account right now.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  let user;
  if (mongoose.connection.readyState === 1) {
    const record = await User.findOne({ email }).lean();
    if (record) {
      user = { id: record._id.toString(), name: record.name, email: record.email, passwordHash: record.passwordHash };
    }
  } else {
    user = userStore.find((entry) => entry.email === email);
  }

  const passwordMatches = user && await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = generateToken(user);

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/patients', authenticateToken, async (req, res) => {
  try {
    const patients = await getPatients();
    res.json({ patients });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const patients = await getPatients();
    const averageProgress = patients.length
      ? Math.round(patients.reduce((sum, patient) => sum + Number(patient.progress || 0), 0) / patients.length)
      : 0;

    res.json({
      overview: {
        totalPatients: patients.length,
        recoveryRate: averageProgress,
        activeSessions: Math.max(3, Math.round(averageProgress / 25)),
        nextReview: '4:30 PM',
      },
      patients,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    const created = await savePatient(req.body);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'MyFit API is running.' });
});

connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`MyFit backend running on http://localhost:${PORT}`);
  });
});
