import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbAdapter } from '@/lib/database-adapter';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    await dbAdapter.initialize();

    const user = await dbAdapter.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account not verified. Please check your email.' },
        { status: 401 }
      );
    }

    const passwordHash = await dbAdapter.getPasswordHashByEmail(email);
    if (passwordHash && password) {
      const valid = await bcrypt.compare(password, passwordHash);
      if (!valid) {
        return NextResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 401 }
        );
      }
    }

    await dbAdapter.updateUser(user.id, { lastLogin: new Date() });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
