import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper function to generate JWT
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper function to build safe user object without password
const formatSafeUser = (user) => {
  return {
    _id: user._id,
    name: user.name,
    registerNumber: user.registerNumber,
    department: user.department,
    year: user.year,
    className: user.className,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * @desc    Register a new student account
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const {
      name,
      registerNumber,
      department,
      year,
      className,
      email,
      password,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !registerNumber ||
      !department ||
      year === undefined ||
      year === null ||
      !className ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, registerNumber, department, year, className, email, and password',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanRegNo = registerNumber.trim();

    // Check duplicate email
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({
        message: 'User with this email already exists',
      });
    }

    // Check duplicate register number
    const existingRegNo = await User.findOne({ registerNumber: cleanRegNo });
    if (existingRegNo) {
      return res.status(400).json({
        message: 'User with this register number already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Public registration always creates a student role
    const user = await User.create({
      name: name.trim(),
      registerNumber: cleanRegNo,
      department: department.trim(),
      year: Number(year),
      className: className.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'student', // Force student role for public registration
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      message: 'Student registered successfully',
      token,
      user: formatSafeUser(user),
    });
  } catch (error) {
    console.error('Error in registration:', error);
    return res.status(500).json({
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide both email and password',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: formatSafeUser(user),
    });
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({
      message: 'Server error during login',
      error: error.message,
    });
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected by authMiddleware)
 */
export const getCurrentUser = async (req, res) => {
  try {
    // req.user is attached by the protect middleware
    if (!req.user) {
      return res.status(401).json({
        message: 'Not authorized',
      });
    }

    return res.status(200).json({
      user: formatSafeUser(req.user),
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      message: 'Server error fetching user profile',
      error: error.message,
    });
  }
};
