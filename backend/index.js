import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import jsonwebtoken from 'jsonwebtoken';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
});

const ticketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
});

const User = mongoose.model('User', userSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);

app.use(express.json());
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = new User({ username, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jsonwebtoken.sign({ userId: user._id, username: user.username }, process.env.SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/tickets', authenticateToken, async (req, res) => {
  try {
    console.log('Received POST request at /tickets');

    const { title, description } = req.body;
    const userId = req.user.userId;

    const newTicket = new Ticket({ userId, title, description });
    await newTicket.save();

    const user = await User.findById(userId);
    user.tickets.push(newTicket._id);
    await user.save();

    res.status(201).json({ message: 'Ticket created successfully' });
  } catch (error) {
    console.log('Received POST request at /tickets');

    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/tickets', authenticateToken, async (req, res) => {
  try {
    console.log('Received GET request at /tickets');

    const userId = req.user.userId;

    // Retrieve tickets for the user with the specified userId
    const tickets = await Ticket.find({ userId });

    res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).populate('tickets');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token format' });
  }

  try {
    const decoded = jsonwebtoken.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Forbidden - Invalid token' });
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
