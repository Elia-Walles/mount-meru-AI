// Email Service for Mount Meru AI Hospital Analytics Platform
// Handles user registration, email verification, password reset, and notifications

// Try to import nodemailer, but fall back to stub if not available
let nodemailer: any;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.log('Nodemailer not available, using stub');
  nodemailer = require('./nodemailer-stub');
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  isActive: boolean;
  emailVerified: boolean;
  passwordResetToken?: string;
  emailVerificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EmailService {
  private transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransport ? nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: true,
      auth: {
        user: process.env.EMAIL_SERVER_USER || 'tieai.service@gmail.com',
        pass: process.env.EMAIL_SERVER_PASSWORD || 'agud bcjt kocl kkhq',
      },
    }) : null;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.log('Email service not available');
        return false;
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@tie-ai.com',
        ...options,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string, userName: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_URL}/auth/verify?token=${verificationToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Welcome to Mount Meru AI!</h1>
          <p style="margin: 10px 0; font-size: 16px;">Hello ${userName},</p>
          <p style="margin: 10px 0; font-size: 14px;">Thank you for registering with Mount Meru AI Hospital Analytics Platform.</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 15px;">Email Verification Required</h2>
          <p style="color: #666; line-height: 1.5;">Please click the button below to verify your email address and complete your registration.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            If the button doesn't work, copy and paste this URL into your browser:<br>
            <code style="background-color: #f1f1f1; padding: 8px; border-radius: 4px; word-break: break-all; display: block;">
              ${verificationUrl}
            </code>
          </p>
        </div>
        
        <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="color: #666; font-size: 12px;">
            <strong>Mount Meru AI Hospital Analytics Platform</strong><br>
            Tanzania Ministry of Health Compliant<br>
            Powered by AI Technology
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Mount Meru AI Registration',
      html: htmlContent
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_URL}/auth/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0; text-align: center;">
          <h1 style="Password Reset Request</h1>
          <p style="margin: 10px 0;">Hello ${userName},</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 15px;">Password Reset</h2>
          <p style="color: #666; line-height: 1.5;">You requested a password reset for your Mount Meru AI account.</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Reset Link:</strong></p>
            <a href="${resetUrl}" 
               style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            If the button doesn't work, copy and paste this URL into your browser:<br>
            <code style="background-color: #f1f1f1; padding: 8px; border-radius: 4px; word-break: break-all; display: block;">
              ${resetUrl}
            </code>
          </p>
        </div>
        
        <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="color: #666; font-size: 12px;">
            This link will expire in 1 hour for security reasons.<br>
            If you didn't request this reset, please contact support.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset - Mount Meru AI',
      html: htmlContent
    });
  }

  async sendWelcomeEmail(user: User): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #d4edda; border-radius: 8px;">
        <div style="background-color: #28a745; color: white; padding: 20px; border-radius: 8px 8px 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Welcome to Mount Meru AI!</h1>
          <p style="margin: 10px 0; font-size: 16px;">Hello ${user.name},</p>
          <p style="margin: 10px 0; font-size: 14px;">Your account has been successfully created with the <strong>${user.role}</strong> role.</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 15px;">Account Details</h2>
          <ul style="color: #666; line-height: 1.6;">
            <li><strong>Role:</strong> ${user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Department:</strong> ${user.department || 'Not assigned'}</li>
            <li><strong>Status:</strong> ${user.isActive ? 'Active' : 'Inactive'}</li>
            <li><strong>Email Verified:</strong> ${user.emailVerified ? 'Yes' : 'No'}</li>
          </ul>
        </div>
        
        <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="color: #666; font-size: 12px;">
            You can now log in to Mount Meru AI and start analyzing hospital data.<br>
            For support, contact: support@mountmeru.ai
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to Mount Meru AI Hospital Analytics Platform',
      html: htmlContent
    });
  }

  async sendLoginNotification(user: User): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #e8f5e8; border-radius: 8px;">
        <div style="background-color: #4caf50; color: white; padding: 20px; border-radius: 8px 8px 0; text-align: center;">
          <h1>Login Detected</h1>
          <p style="margin: 10px 0;">New login detected for ${user.name} (${user.role})</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px;">
          <p style="color: #666; line-height: 1.6;">
            If this wasn't you, please secure your account immediately.<br>
            Contact support if you suspect unauthorized access.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Security Alert - Mount Meru AI',
      html: htmlContent
    });
  }

  async sendAnalyticsReport(user: User, reportData: any): Promise<boolean> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <div style="background-color: #2196f3; color: white; padding: 20px; border-radius: 8px 8px 0; text-align: center;">
          <h1>Analytics Report Generated</h1>
          <p style="margin: 10px 0;">Report generated by ${user.name}</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 15px;">Report Summary</h2>
          <p style="color: #666; line-height: 1.6;">${reportData.summary}</p>
          
          ${reportData.insights ? `
            <h3 style="color: #333; margin: 15px 0 10px 0;">Key Insights:</h3>
            <ul style="color: #666; line-height: 1.6;">
              ${reportData.insights.map((insight: string) => `<li>${insight}</li>`).join('')}
            </ul>
          ` : ''}
          
          ${reportData.recommendations ? `
            <h3 style="color: #333; margin: 15px 0 10px 0;">Recommendations:</h3>
            <ul style="color: #666; line-height: 1.6;">
              ${reportData.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Analytics Report - Mount Meru AI - ${new Date().toLocaleDateString()}`,
      html: htmlContent
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
