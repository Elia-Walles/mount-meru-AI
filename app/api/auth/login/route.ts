import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    // Initialize database if not already done
    await dbAdapter.initialize();
    
    const user = await dbAdapter.getUserByEmail(email);
    
    if (user && user.isActive) {
      // Update last login
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
          lastLogin: user.lastLogin
        }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email or user not found' 
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    }, { status: 500 });
  }
}
