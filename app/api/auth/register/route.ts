import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';
import { emailService } from '@/lib/email-service';

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await dbAdapter.createUser({
      email,
      name,
      role: role as any,
      department,
      isActive: false,
      passwordHash: hashedPassword,
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await dbAdapter.createVerificationToken(email, verificationToken, expiresAt);

    try {
      await emailService.sendVerificationEmail(email, verificationToken, name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
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
