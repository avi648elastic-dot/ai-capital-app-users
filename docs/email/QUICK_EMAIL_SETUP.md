# 🚀 Quick Email Setup Guide

## For Immediate Testing (5 minutes)

### Step 1: Use Gmail with App Password

1. **Enable 2-Factor Authentication on Gmail**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Update Your `.env` File**
   ```env
   EMAIL_PROVIDER=gmail
   EMAIL_FROM=your-email@gmail.com
   EMAIL_FROM_NAME=AiCapital
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop
   ```

4. **Restart Your Backend**
   ```bash
   cd backend
   npm run dev
   ```

5. **Test the Email**
   ```bash
   # Register a new user or use the test endpoint
   curl -X POST http://localhost:5000/api/test/email/send-welcome \
     -H "Content-Type: application/json" \
     -d '{"email": "your-test-email@gmail.com", "name": "Test User"}'
   ```

---

## For Production Setup (Recommended)

### Option 1: SendGrid (Best for most applications)

1. **Sign up**: https://sendgrid.com/
2. **Verify domain** `ai-capital.com`
3. **Create API key**
4. **Update `.env`**:
   ```env
   EMAIL_PROVIDER=sendgrid
   EMAIL_FROM=user-service@ai-capital.com
   EMAIL_FROM_NAME=AiCapital
   SENDGRID_API_KEY=SG.your-api-key-here
   ```

### Option 2: Google Workspace (Professional Email)

1. **Purchase** Google Workspace ($6-12/month)
2. **Create** `user-service@ai-capital.com`
3. **Enable 2FA** and get App Password
4. **Update `.env`**:
   ```env
   EMAIL_PROVIDER=gmail
   EMAIL_FROM=user-service@ai-capital.com
   EMAIL_FROM_NAME=AiCapital
   EMAIL_USER=user-service@ai-capital.com
   EMAIL_PASSWORD=your-app-password
   ```

---

## Testing Your Setup

### Method 1: Test Script
```bash
cd backend
npm run build
node scripts/test-email.js
```

### Method 2: API Test
```bash
# Test welcome email
curl -X POST http://localhost:5000/api/test/email/send-welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com", "name": "Test User"}'

# Test notification
curl -X POST http://localhost:5000/api/test/email/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "title": "Portfolio Alert",
    "message": "Test notification message",
    "type": "action",
    "actionData": {
      "ticker": "AAPL",
      "action": "SELL",
      "reason": "Testing email notifications"
    }
  }'
```

### Method 3: Register New User
1. Start your application
2. Register a new user
3. Check email inbox for welcome email

---

## Troubleshooting

### ❌ "Authentication Failed"
- Gmail: Use App Password, not your regular password
- Enable 2-Factor Authentication first
- Remove any spaces from the App Password

### ❌ "Email Not Sending"
- Check server logs: Look for `[EMAIL]` logs
- Verify environment variables are loaded
- Test SMTP connection manually

### ❌ "Sender Not Verified" (SendGrid/SES)
- Complete domain verification
- Add all DNS records
- Wait up to 48 hours for verification

---

## Your Current Setup

Based on your `.env` file, you currently have:
```env
EMAIL_USER=avi648elastic@gmail.com
```

### To Continue Using This Email:

1. **Enable 2FA** on this Gmail account
2. **Get App Password** from https://myaccount.google.com/apppasswords
3. **Update `.env`**:
   ```env
   EMAIL_PROVIDER=gmail
   EMAIL_FROM=avi648elastic@gmail.com
   EMAIL_FROM_NAME=AiCapital
   EMAIL_USER=avi648elastic@gmail.com
   EMAIL_PASSWORD=your-app-password-here
   ```

### To Switch to Professional Email:

1. **Buy domain** (if not already): ai-capital.com
2. **Choose**: Google Workspace or SendGrid
3. **Create**: user-service@ai-capital.com
4. **Update `.env`** with new credentials

---

## What Emails Are Sent?

✅ **Welcome Email** - Sent when user registers
✅ **Notification Emails** - Portfolio alerts (SELL signals)
✅ **Password Reset** - (Ready to use when implemented)
✅ **Email Verification** - (Ready to use when implemented)

---

## Need More Help?

See the detailed guide: `EMAIL_SETUP_GUIDE.md`

---

**Quick Start:** Use your existing Gmail with App Password for immediate testing! 🚀

