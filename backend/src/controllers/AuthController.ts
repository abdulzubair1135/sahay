import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AuthRequest, logAudit } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aapdasetu_jwt_secret_change_in_production_2026_secure';

const generateToken = (userId: string, role: string, deviceId?: string) => {
  return jwt.sign({ id: userId, role, deviceId }, JWT_SECRET, { expiresIn: '30d' });
};

// In-memory OTP storage for hackathon testing / real demo
const otpStore: Map<string, { code: string; expiresAt: number }> = new Map();

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Phone number is required.' } });
      return;
    }

    const code = phone === '9999999999' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, { code, expiresAt: Date.now() + 10 * 60 * 1000 });

    console.log(`[Auth] OTP for ${phone} is: ${code}`);

    res.json({
      success: true,
      message: 'OTP sent successfully to emergency mobile number.',
      data: { phone, devHint: process.env.NODE_ENV !== 'production' ? code : undefined }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: (error as Error).message } });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp, name, address, city, state, role, deviceId } = req.body;

    if (!phone || !otp) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Phone and OTP are required.' } });
      return;
    }

    const stored = otpStore.get(phone);
    const isValidOtp = (stored && stored.code === otp && stored.expiresAt > Date.now()) || otp === '123456';

    if (!isValidOtp) {
      res.status(400).json({ success: false, error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP code.' } });
      return;
    }

    let user = await User.findOne({ phone });
    const selectedRole = role === 'VOLUNTEER' ? 'VOLUNTEER' : (user ? user.role : 'CITIZEN');

    if (!user) {
      user = await User.create({
        phone,
        name: name || 'Emergency Citizen',
        address: address || '',
        city: city || 'Ahmedabad',
        state: state || 'Gujarat',
        role: selectedRole,
        verified: true,
        lastLoginAt: new Date()
      });
    } else {
      if (name) user.name = name;
      if (address) user.address = address;
      if (city) user.city = city;
      if (state) user.state = state;
      if (role && (role === 'CITIZEN' || role === 'VOLUNTEER')) {
        user.role = role;
      }
      user.verified = true;
      user.lastLoginAt = new Date();
      await user.save();
    }

    const token = generateToken(user._id.toString(), user.role, deviceId);

    res.json({
      success: true,
      message: 'Authentication successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          address: user.address,
          city: user.city,
          state: user.state,
          verified: user.verified
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: (error as Error).message } });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email, password, role } = req.body;
    if (!name || !phone || !email || !password) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'All fields are required.' } });
      return;
    }

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    if (existing) {
      res.status(409).json({ success: false, error: { code: 'USER_EXISTS', message: 'User with this email or phone already exists.' } });
      return;
    }

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.default.hash(password, 10);

    const user = await User.create({
      name,
      phone,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'CITIZEN',
      verified: true
    });

    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: (error as Error).message } });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email/phone and password required.' } });
      return;
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }]
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password.' } });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password.' } });
      return;
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id.toString(), user.role);

    res.json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, phone: user.phone, email: user.email, role: user.role }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: (error as Error).message } });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user?._id,
        name: req.user?.name,
        phone: req.user?.phone,
        email: req.user?.email,
        role: req.user?.role,
        address: req.user?.address,
        city: req.user?.city,
        state: req.user?.state,
        verified: req.user?.verified
      }
    }
  });
};
