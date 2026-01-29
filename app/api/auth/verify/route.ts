import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';
import { emailService } from '@/lib/email-service';

interface VerifyRequest {
  token: string;
}

export async function POST(request: NextRequest) {
  try {
    const { token }: VerifyRequest = await request.json();

    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Verification token is required'
      }, { status: 400 });
    }

    await dbAdapter.initialize();

    // Verify token and get user (you'll need to extend the database schema)
    // For now, we'll simulate token verification
    const user = await dbAdapter.getUserByEmail('demo@example.com'); // This would come from database lookup by verification token

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired verification token'
      }, { status: 400 });
    }

    // Activate user account
    await dbAdapter.updateUser(user.id, { isActive: true });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Your account is now active.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({
      success: false,
      message: 'Email verification failed. Please try again.'
    }, { status: 500 });
  }
}
