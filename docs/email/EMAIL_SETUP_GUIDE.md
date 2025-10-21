# 📧 Professional Email Setup Guide for AiCapital

This guide will help you set up professional email service (`user-service@ai-capital.com`) for your AiCapital application. You have multiple options depending on your needs and budget.

## 🎯 Overview

The email service is used for:
- ✅ **Welcome emails** for new user registrations
- 📨 **Notification emails** for portfolio alerts (SELL signals, market changes)
- 🔒 **Password reset emails**
- ✉️ **Email verification**

---

## 📋 Option 1: Gmail with Custom Domain (Google Workspace)

### Best for: Small teams, professional appearance
### Cost: $6-12/user/month

### Setup Steps:

1. **Purchase Google Workspace**
   - Go to [Google Workspace](https://workspace.google.com/)
   - Sign up with your domain `ai-capital.com`
   - Create email account: `user-service@ai-capital.com`

2. **Enable 2-Factor Authentication**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

3. **Generate App Password**
   - Visit [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Copy the generated 16-character password

4. **Update `.env` File**
   ```env
   EMAIL_PROVIDER=gmail
   EMAIL_FROM=user-service@ai-capital.com
   EMAIL_FROM_NAME=AiCapital
   EMAIL_USER=user-service@ai-capital.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

### ✅ Pros:
- Professional email address
- Reliable delivery
- Easy setup
- Works with existing Gmail infrastructure

### ❌ Cons:
- Monthly cost per user
- Daily sending limits (500 emails/day for free Gmail, 2000 for Workspace)

---

## 📋 Option 2: SendGrid (Recommended for Production)

### Best for: Production applications, scalability
### Cost: Free tier (100 emails/day), then $15/month for 50k emails

### Setup Steps:

1. **Sign Up for SendGrid**
   - Go to [SendGrid](https://sendgrid.com/)
   - Create a free account

2. **Verify Domain**
   - Go to Settings > Sender Authentication
   - Authenticate your domain `ai-capital.com`
   - Add DNS records to your domain registrar

3. **Create API Key**
   - Go to Settings > API Keys
   - Create new API key with "Full Access"
   - Copy the API key (starts with `SG.`)

4. **Set Up Sender Identity**
   - Go to Settings > Sender Authentication
   - Create verified sender: `user-service@ai-capital.com`

5. **Update `.env` File**
   ```env
   EMAIL_PROVIDER=sendgrid
   EMAIL_FROM=user-service@ai-capital.com
   EMAIL_FROM_NAME=AiCapital
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### ✅ Pros:
- Free tier available
- Excellent deliverability
- Advanced analytics
- Scalable
- No daily limits on paid plans

### ❌ Cons:
- Requires domain verification
- More complex setup

---

## 📋 Option 3: AWS SES (Enterprise)

### Best for: Large scale, AWS users
### Cost: $0.10 per 1,000 emails

### Setup Steps:

1. **Create AWS Account**
   - Go to [AWS Console](https://console.aws.amazon.com/)
   - Sign up or log in

2. **Set Up SES**
   - Navigate to Amazon Simple Email Service (SES)
   - Verify your domain `ai-capital.com`
   - Add DNS records for domain verification

3. **Create SMTP Credentials**
   - Go to SMTP Settings
   - Create SMTP credentials
   - Note the SMTP endpoint (e.g., `email-smtp.us-east-1.amazonaws.com`)

4. **Request Production Access**
   - By default, SES is in sandbox mode
   - Request production access to send to any email

5. **Update `.env` File**
   ```env
   EMAIL_PROVIDER=ses
   EMAIL_FROM=user-service@ai-capital.com
   EMAIL_FROM_NAME=AiCapital
   AWS_SES_HOST=email-smtp.us-east-1.amazonaws.com
   AWS_SES_ACCESS_KEY=your-aws-access-key
   AWS_SES_SECRET_KEY=your-aws-secret-key
   ```

### ✅ Pros:
- Very affordable at scale
- High deliverability
- Integrates with AWS ecosystem
- Detailed analytics

### ❌ Cons:
- Complex setup
- Requires AWS knowledge
- Sandbox mode initially (need to request production)

---

## 📋 Option 4: Custom SMTP (Mailgun, Postmark, etc.)

### Best for: Specific provider preferences
### Cost: Varies by provider

### Setup with Mailgun:

1. **Sign Up for Mailgun**
   - Go to [Mailgun](https://www.mailgun.com/)
   - Create account

2. **Verify Domain**
   - Add and verify your domain
   - Add DNS records

3. **Get SMTP Credentials**
   - Go to Sending > Domain Settings
   - Copy SMTP hostname and credentials

4. **Update `.env` File**
   ```env
   EMAIL_PROVIDER=smtp
   EMAIL_FROM=user-service@ai-capital.com
   EMAIL_FROM_NAME=AiCapital
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-mailgun-smtp-username
   SMTP_PASSWORD=your-mailgun-smtp-password
   ```

### Setup with Postmark:

1. **Sign Up for Postmark**
   - Go to [Postmark](https://postmarkapp.com/)
   - Create account

2. **Verify Sender Signature**
   - Add sender signature for `user-service@ai-capital.com`
   - Verify via email

3. **Get SMTP Credentials**
   - Go to Servers > Your Server > Credentials
   - Copy SMTP hostname and credentials

4. **Update `.env` File**
   ```env
   EMAIL_PROVIDER=smtp
   EMAIL_FROM=user-service@ai-capital.com
   EMAIL_FROM_NAME=AiCapital
   SMTP_HOST=smtp.postmarkapp.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-postmark-server-token
   SMTP_PASSWORD=your-postmark-server-token
   ```

---

## 🧪 Testing Your Email Setup

### Option 1: Use the Test Script

```bash
# Run the email test script
cd backend
npm run test:email
```

### Option 2: Test via API

```bash
# Test welcome email
curl -X POST http://localhost:5000/api/test/send-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@gmail.com", "name": "Test User"}'

# Test notification email
curl -X POST http://localhost:5000/api/test/send-notification \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@gmail.com", "title": "Test Notification", "message": "This is a test", "type": "info"}'
```

### Option 3: Register a Test User

1. Start your application
2. Register a new user
3. Check if welcome email arrives
4. Check server logs for email status

---

## 🔍 Troubleshooting

### Email Not Sending?

1. **Check Logs**
   ```bash
   # Look for email service initialization logs
   ✅ [EMAIL] Email service initialized successfully
   
   # Or error logs
   ❌ [EMAIL] Failed to initialize email service
   ```

2. **Verify Environment Variables**
   ```bash
   # Check if variables are loaded
   echo $EMAIL_PROVIDER
   echo $EMAIL_FROM
   echo $EMAIL_USER
   ```

3. **Test SMTP Connection**
   - Use an SMTP testing tool like [SMTP Tester](https://www.smtper.net/)
   - Verify credentials and hostname

### Common Issues:

#### "Authentication Failed"
- ✅ Check username/password are correct
- ✅ For Gmail: Ensure you're using App Password, not regular password
- ✅ Enable "Less secure app access" (if not using 2FA)

#### "Connection Timeout"
- ✅ Check SMTP port (usually 587 for TLS)
- ✅ Check firewall settings
- ✅ Verify SMTP host is correct

#### "Sender Not Verified"
- ✅ For SendGrid/SES: Complete domain verification
- ✅ Add all required DNS records
- ✅ Wait for verification (can take up to 48 hours)

#### "Daily Limit Exceeded"
- ✅ Gmail free: 500 emails/day
- ✅ Google Workspace: 2000 emails/day
- ✅ Consider upgrading to SendGrid or SES

---

## 📊 Email Service Comparison

| Provider | Free Tier | Cost | Delivery Rate | Setup Difficulty |
|----------|-----------|------|---------------|------------------|
| Gmail (Personal) | 500/day | Free | Good | ⭐ Easy |
| Google Workspace | 2000/day | $6-12/mo | Good | ⭐ Easy |
| SendGrid | 100/day | $15+/mo | Excellent | ⭐⭐ Medium |
| AWS SES | 62k/mo | $0.10/1k | Excellent | ⭐⭐⭐ Hard |
| Mailgun | 5k/mo | $15+/mo | Excellent | ⭐⭐ Medium |
| Postmark | 100/mo | $15+/mo | Excellent | ⭐⭐ Medium |

---

## 🎯 Recommendation

### For Development/Testing:
✅ **Gmail** (use your existing account, enable 2FA + App Password)

### For Small Production (< 1000 users):
✅ **SendGrid** (free tier + excellent deliverability)

### For Large Production (> 10k users):
✅ **AWS SES** (cost-effective at scale)

### For Professional Appearance:
✅ **Google Workspace** + `user-service@ai-capital.com`

---

## 🔐 Security Best Practices

1. **Never commit credentials to git**
   - Always use `.env` file
   - Add `.env` to `.gitignore`

2. **Use App Passwords (Gmail)**
   - Never use your main password
   - Enable 2-Factor Authentication

3. **Rotate API Keys**
   - Change API keys periodically
   - Use different keys for dev/staging/production

4. **Monitor Email Logs**
   - Track delivery failures
   - Watch for suspicious activity
   - Set up alerts for high failure rates

5. **Implement Rate Limiting**
   - Prevent email spam
   - Protect against abuse

---

## 📝 Quick Start (Development)

For quick testing during development:

1. **Use Gmail Account**
   ```env
   EMAIL_PROVIDER=gmail
   EMAIL_FROM=avi648elastic@gmail.com
   EMAIL_FROM_NAME=AiCapital Dev
   EMAIL_USER=avi648elastic@gmail.com
   EMAIL_PASSWORD=your-gmail-app-password
   ```

2. **Enable 2FA**: https://myaccount.google.com/security
3. **Get App Password**: https://myaccount.google.com/apppasswords
4. **Test**: Register a new user and check email

---

## 🚀 Production Setup (Recommended)

1. **Get Custom Domain** (ai-capital.com)
2. **Choose Provider** (SendGrid recommended)
3. **Set Up Email** (user-service@ai-capital.com)
4. **Verify Domain** (Add DNS records)
5. **Update Environment Variables**
6. **Test Thoroughly**
7. **Monitor Delivery Rates**

---

## 📞 Need Help?

- **SendGrid Support**: https://support.sendgrid.com/
- **AWS SES Documentation**: https://docs.aws.amazon.com/ses/
- **Google Workspace Support**: https://support.google.com/a/
- **Mailgun Support**: https://www.mailgun.com/support/

---

## ✅ Post-Setup Checklist

- [ ] Environment variables configured
- [ ] Email service initialized successfully
- [ ] Welcome email sent to test user
- [ ] Notification email sent successfully
- [ ] Domain verified (if using SendGrid/SES)
- [ ] DNS records added
- [ ] Email logs monitored
- [ ] Delivery rates acceptable
- [ ] Professional "From" address working

---

**Good luck with your professional email setup! 🎉**

