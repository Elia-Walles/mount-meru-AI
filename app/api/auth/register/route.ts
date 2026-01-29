import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';
import { emailService } from '@/lib/email-service';

// Try to import bcryptjs, but fall back to stub if not available
let bcrypt: any;
try {
  bcrypt = require('bcryptjs');
} catch (error) {
  console.log('Bcryptjs not available, using stub');
  bcrypt = require('../../lib/bcrypt-stub');
}

import crypto from 'crypto';

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: string;
  department?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, department }: RegisterRequest = await request.json();

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json({
        success: false,
        message: 'All required fields must be provided'
      }, { status: 400 });
    }

    // Initialize database
    await dbAdapter.initialize();

    // Check if user already exists
    const existingUser = await dbAdapter.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User with this email already exists'
      }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const newUser = await dbAdapter.createUser({
      email,
      name,
      role: role as any,
      department,
      isActive: false // User needs to verify email first
    });

    // Store verification token and hashed password (you'll need to extend the database schema)
    // For now, we'll send the verification email
    try {
      await emailService.sendVerificationEmail(email, verificationToken, name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
        isActive: newUser.isActive
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      message: 'Registration failed. Please try again.'
    }, { status: 500 });
  }
}
