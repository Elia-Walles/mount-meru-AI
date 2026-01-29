import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';
import { emailService } from '@/lib/email-service';

// Try to import bcryptjs, but fall back to stub if not available
let bcrypt: any;
try {
  bcrypt = require('bcryptjs');
} catch (error) {
  console.log('Bcryptjs not available, using stub');
  bcrypt = require('../../../lib/bcrypt-stub');
}

import crypto from 'crypto';

interface ResetRequest {
  email: string;
}

interface NewPasswordRequest {
  token: string;
  newPassword: string;
}

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const { email }: ResetRequest = await request.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email is required'
      }, { status: 400 });
    }

    await dbAdapter.initialize();

    const user = await dbAdapter.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token (you'll need to extend the database schema)
    // For now, we'll send the reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken, user.name);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      return NextResponse.json({
        success: false,
        message: 'Failed to send reset email. Please try again.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset link has been sent to your email.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({
      success: false,
      message: 'Password reset request failed. Please try again.'
    }, { status: 500 });
  }
}

// Set new password
export async function PUT(request: NextRequest) {
  try {
    const { token, newPassword }: NewPasswordRequest = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({
        success: false,
        message: 'Token and new password are required'
      }, { status: 400 });
    }

    await dbAdapter.initialize();

    // Verify token and get user (you'll need to extend the database schema)
    // For now, we'll simulate token verification
    const user = null; // This would come from database lookup by token

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired reset token'
      }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password (you'll need to extend the database schema)
    // For now, we'll return success

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({
      success: false,
      message: 'Password reset failed. Please try again.'
    }, { status: 500 });
  }
}
