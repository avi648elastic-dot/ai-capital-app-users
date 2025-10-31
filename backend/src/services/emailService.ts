import nodemailer from 'nodemailer';
import { loggerService } from './loggerService';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface WelcomeEmailData {
  name: string;
  email: string;
}

interface NotificationEmailData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'action';
  actionData?: {
    ticker?: string;
    action?: 'BUY' | 'SELL' | 'HOLD';
    reason?: string;
  };
}

interface TrialExpirationEmailData {
  name: string;
  daysRemaining: number;
  trialEndDate: Date;
}

/**
 * Professional Email Service
 * Supports multiple email providers (Gmail, SendGrid, AWS SES, Custom SMTP)
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;
  private fromAddress: string;
  private fromName: string;

  constructor() {
    this.fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'user-service@ai-capital.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'AiCapital';
    this.initialize();
  }

  /**
   * Initialize email service with configured provider
   */
  private async initialize() {
    try {
      const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';
      
      loggerService.info('🔧 [EMAIL] Initializing email service', { provider: emailProvider });

      switch (emailProvider.toLowerCase()) {
        case 'sendgrid':
          this.initializeSendGrid();
          break;
        case 'ses':
        case 'aws-ses':
          this.initializeAWSSES();
          break;
        case 'smtp':
        case 'custom':
          this.initializeCustomSMTP();
          break;
        case 'gmail':
        default:
          this.initializeGmail();
          break;
      }

      // Test the connection
      if (this.transporter) {
        await this.transporter.verify();
        this.initialized = true;
        loggerService.info('✅ [EMAIL] Email service initialized successfully', { 
          provider: emailProvider,
          from: this.fromAddress 
        });
      }
    } catch (error) {
      loggerService.error('❌ [EMAIL] Failed to initialize email service', error);
      this.initialized = false;
    }
  }

  /**
   * Initialize Gmail (for development/testing)
   */
  private initializeGmail() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
      }
    });
  }

  /**
   * Initialize SendGrid
   */
  private initializeSendGrid() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  /**
   * Initialize AWS SES
   */
  private initializeAWSSES() {
    this.transporter = nodemailer.createTransport({
      host: process.env.AWS_SES_HOST || 'email-smtp.us-east-1.amazonaws.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.AWS_SES_ACCESS_KEY,
        pass: process.env.AWS_SES_SECRET_KEY
      }
    });
  }

  /**
   * Initialize Custom SMTP (for custom domain email)
   */
  private initializeCustomSMTP() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      loggerService.warn('⚠️ [EMAIL] Email service not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: options.from || `"${this.fromName}" <${this.fromAddress}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      loggerService.info('✅ [EMAIL] Email sent successfully', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        messageId: info.messageId
      });

      return true;
    } catch (error) {
      loggerService.error('❌ [EMAIL] Failed to send email', error);
      return false;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const html = this.generateWelcomeEmailTemplate(data);
    
    return this.sendEmail({
      to: data.email,
      subject: 'Welcome to AiCapital - Your AI-Powered Portfolio Management',
      html
    });
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(to: string, data: NotificationEmailData): Promise<boolean> {
    const html = this.generateNotificationEmailTemplate(data);
    
    return this.sendEmail({
      to,
      subject: `AiCapital: ${data.title}`,
      html
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetToken: string, userName: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = this.generatePasswordResetTemplate(userName, resetUrl);
    
    return this.sendEmail({
      to,
      subject: 'AiCapital - Password Reset Request',
      html
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(to: string, verificationToken: string, userName: string): Promise<boolean> {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const html = this.generateVerificationTemplate(userName, verifyUrl);
    
    return this.sendEmail({
      to,
      subject: 'AiCapital - Verify Your Email Address',
      html
    });
  }

  /**
   * Generate welcome email template
   */
  private generateWelcomeEmailTemplate(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to AiCapital</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">AiCapital</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">AI-Powered Portfolio Management</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: white; padding: 40px 30px;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Welcome, ${data.name}! 🎉</h2>
            
            <p style="color: #475569; font-size: 16px; margin: 0 0 20px 0;">
              Thank you for joining AiCapital! We're excited to help you manage your investment portfolio with the power of artificial intelligence.
            </p>
            
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">🚀 Get Started:</h3>
              <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Import Your Portfolio:</strong> Add your existing stocks and let our AI analyze them</li>
                <li><strong>AI-Generated Portfolios:</strong> Create balanced portfolios based on your risk tolerance</li>
                <li><strong>Real-Time Insights:</strong> Get instant AI-powered buy/sell recommendations</li>
                <li><strong>Smart Notifications:</strong> Receive alerts for important portfolio actions</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 16px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        font-size: 16px; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                Go to Dashboard →
              </a>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px;">
              <h4 style="color: #1e293b; margin: 0 0 10px 0; font-size: 16px;">💡 Quick Tips:</h4>
              <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.6;">
                • Start with a small portfolio to understand how the AI works<br>
                • Review AI recommendations before taking action<br>
                • Set up notifications to stay informed about your portfolio<br>
                • Check your dashboard regularly for market insights
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #1e293b; padding: 30px; text-align: center; color: #94a3b8;">
            <p style="margin: 0 0 15px 0; font-size: 14px;">
              Need help? Contact us at 
              <a href="mailto:support@ai-capital.com" style="color: #667eea; text-decoration: none;">support@ai-capital.com</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">
              © ${new Date().getFullYear()} AiCapital. All rights reserved.<br>
              You're receiving this email because you signed up for AiCapital.
            </p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #334155;">
              <a href="${process.env.FRONTEND_URL}" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Visit Website</a>
              <span style="color: #475569;">•</span>
              <a href="${process.env.FRONTEND_URL}/settings" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Email Preferences</a>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate notification email template
   */
  private generateNotificationEmailTemplate(data: NotificationEmailData): string {
    const actionColors = {
      info: '#3B82F6',
      warning: '#F59E0B',
      success: '#10B981',
      error: '#EF4444',
      action: '#8B5CF6'
    };

    const color = actionColors[data.type];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">AiCapital</h1>
            <p style="color: #94a3b8; margin: 5px 0 0 0;">Professional Portfolio Management</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <div style="width: 40px; height: 40px; background: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                <span style="color: white; font-weight: bold; font-size: 18px;">
                  ${data.type === 'action' ? '📈' : 
                    data.type === 'warning' ? '⚠️' :
                    data.type === 'success' ? '✅' :
                    data.type === 'error' ? '❌' : 'ℹ️'}
                </span>
              </div>
              <h2 style="margin: 0; color: #1e293b; font-size: 20px;">${data.title}</h2>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${color}; margin-bottom: 20px;">
              <p style="margin: 0; color: #475569; font-size: 16px;">${data.message}</p>
            </div>
            
            ${data.actionData ? `
              <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 16px;">Action Details</h3>
                ${data.actionData.ticker ? `<p style="margin: 5px 0; color: #475569;"><strong>Ticker:</strong> ${data.actionData.ticker}</p>` : ''}
                ${data.actionData.action ? `<p style="margin: 5px 0; color: #475569;"><strong>Action:</strong> <span style="color: ${color}; font-weight: bold;">${data.actionData.action}</span></p>` : ''}
                ${data.actionData.reason ? `<p style="margin: 5px 0; color: #475569;"><strong>Reason:</strong> ${data.actionData.reason}</p>` : ''}
              </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Dashboard</a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
            <p>This is an automated message from AiCapital.</p>
            <p>If you no longer wish to receive these notifications, please update your preferences in your dashboard.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate password reset template
   */
  private generatePasswordResetTemplate(userName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
          </div>
          
          <div style="background: white; padding: 30px; margin-top: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
            <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate email verification template
   */
  private generateVerificationTemplate(userName: string, verifyUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">Verify Your Email</h1>
          </div>
          
          <div style="background: white; padding: 30px; margin-top: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p>Hi ${userName},</p>
            <p>Thank you for signing up with AiCapital! Please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background: #10B981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Verify Email
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">This link will expire in 24 hours.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate trial expiration email template
   */
  private generateTrialExpirationTemplate(data: TrialExpirationEmailData): string {
    const endDate = new Date(data.trialEndDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const urgencyColor = data.daysRemaining === 1 
      ? '#EF4444' // Red for urgent
      : data.daysRemaining <= 3
      ? '#F59E0B' // Orange for warning
      : '#8B5CF6'; // Purple for info
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Trial Expiration Reminder</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">AiCapital</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">AI-Powered Portfolio Management</p>
          </div>
          
          <!-- Main Content -->
          <div style="background: white; padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; background: ${urgencyColor}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 40px;">⏰</span>
              </div>
              <h2 style="color: #1e293b; margin: 0 0 10px 0; font-size: 24px;">${data.daysRemaining === 1 ? 'Your Trial Ends Tomorrow!' : `Your Trial Expires in ${data.daysRemaining} Days`}</h2>
            </div>
            
            <p style="color: #475569; font-size: 16px; margin: 0 0 20px 0;">
              Hi ${data.name},
            </p>
            
            <p style="color: #475569; font-size: 16px; margin: 0 0 20px 0;">
              ${data.daysRemaining === 1 
                ? 'Your Premium+ trial period ends tomorrow! To continue enjoying all premium features, upgrade now.'
                : data.daysRemaining <= 3
                ? `Your Premium+ trial expires in ${data.daysRemaining} days (${endDate}). Don't lose access to premium features - upgrade now!`
                : `Your Premium+ trial expires on ${endDate} (${data.daysRemaining} days remaining). Upgrade now to keep all premium features!`}
            </p>
            
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid ${urgencyColor};">
              <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">🎁 What You'll Keep with Premium+:</h3>
              <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>5 Portfolios:</strong> Manage multiple investment strategies</li>
                <li><strong>15 Stocks per Portfolio:</strong> Build comprehensive portfolios</li>
                <li><strong>Advanced Analytics:</strong> Portfolio analysis & risk management</li>
                <li><strong>Priority Support:</strong> Get help when you need it</li>
                <li><strong>All Premium Features:</strong> Unlock the full power of AI-Capital</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0 30px 0;">
              <a href="${process.env.FRONTEND_URL}/subscription/upgrade" 
                 style="background: linear-gradient(135deg, ${urgencyColor} 0%, ${data.daysRemaining === 1 ? '#DC2626' : data.daysRemaining <= 3 ? '#D97706' : '#764ba2'} 100%); 
                        color: white; 
                        padding: 16px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        font-size: 16px; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                ${data.daysRemaining === 1 ? '⚡ Upgrade Now - Last Day!' : 'Upgrade to Premium+ →'}
              </a>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center;">
              <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
                <strong>Questions?</strong> Contact us at 
                <a href="mailto:support@ai-capital.com" style="color: #667eea; text-decoration: none;">support@ai-capital.com</a>
              </p>
              <p style="color: #64748b; margin: 0; font-size: 12px;">
                Trial ends: ${endDate}
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #1e293b; padding: 30px; text-align: center; color: #94a3b8;">
            <p style="margin: 0 0 15px 0; font-size: 14px;">
              © ${new Date().getFullYear()} AiCapital. All rights reserved.
            </p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #334155;">
              <a href="${process.env.FRONTEND_URL}" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Visit Website</a>
              <span style="color: #475569;">•</span>
              <a href="${process.env.FRONTEND_URL}/settings" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;">Email Preferences</a>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*<\/style>/gm, '')
      .replace(/<[^>]+>/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if email service is ready
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      provider: process.env.EMAIL_PROVIDER || 'gmail',
      fromAddress: this.fromAddress,
      fromName: this.fromName
    };
  }
}

export default new EmailService();

