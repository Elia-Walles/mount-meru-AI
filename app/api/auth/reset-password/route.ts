import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';
import { emailService } from '@/lib/email-service';

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

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

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await dbAdapter.createResetToken(email, resetToken, resetTokenExpiry);

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
      return NextResponse.json(
        { success: false, message: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    await dbAdapter.initialize();

    const email = await dbAdapter.getEmailByResetToken(token);
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await dbAdapter.updateUserPassword(email, hashedPassword);
    await dbAdapter.deleteResetToken(token);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({
      success: false,
      message: 'Password reset failed. Please try again.'
    }, { status: 500 });
  }
}
