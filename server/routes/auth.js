import { Router } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../db/index.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { validateRegistration, validateLogin } from '../middleware/validation.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email.toLowerCase()},username.eq.${username.toLowerCase()}`)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Email or username already taken.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password_hash: passwordHash
      })
      .select('id, email, username')
      .single();

    if (error) {
      console.error('Insert error:', error);
      return res.status(500).json({ error: 'Failed to create account.' });
    }

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Account created successfully.',
      user: { id: newUser.id, email: newUser.email, username: newUser.username },
      token
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Find user by email or username
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${identifier.toLowerCase()},username.eq.${identifier.toLowerCase()}`)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful.',
      user: { id: user.id, email: user.email, username: user.username },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, username, created_at')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({ user });
});

// POST /api/auth/logout (optional - mainly for future session invalidation)
router.post('/logout', authMiddleware, (req, res) => {
  // For JWT, logout is handled client-side by removing the token
  // This endpoint could be used for session tracking/invalidation
  res.json({ message: 'Logged out successfully.' });
});

export default router;
