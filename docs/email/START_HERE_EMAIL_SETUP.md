# 🚀 START HERE - Email Setup for AiCapital

## ✅ What I've Done

I've set up a professional email system for your AiCapital application that can use `user-service@ai-capital.com` or any professional email address you want!

---

## 🎯 Quick Setup (5 Minutes)

### Step 1: Get Your Gmail App Password

Since you already have `avi648elastic@gmail.com`, let's use it:

1. **Go to**: https://myaccount.google.com/security
2. **Enable** 2-Step Verification
3. **Go to**: https://myaccount.google.com/apppasswords
4. **Create** an App Password for "Mail"
5. **Copy** the 16-character password (like: `abcd efgh ijkl mnop`)

### Step 2: Update Your `.env` File

Add these lines to your `.env` file:

```env
EMAIL_PROVIDER=gmail
EMAIL_FROM=avi648elastic@gmail.com
EMAIL_FROM_NAME=AiCapital
EMAIL_USER=avi648elastic@gmail.com
EMAIL_PASSWORD=your-16-char-app-password-here
```

### Step 3: Restart Your Backend

```bash
cd backend
npm run dev
```

### Step 4: Test It!

**Option A: Register a new user**
- Go to your app
- Sign up with a test email
- Check your inbox for a beautiful welcome email!

**Option B: Use test script**
```bash
cd backend
npm run build
npm run test:email
```

---

## 📧 What Emails Will Be Sent?

✅ **Welcome Email** - When users register
✅ **Notification Emails** - For portfolio alerts (SELL signals)
✅ **Password Reset** - Ready to use when needed
✅ **Email Verification** - Ready to use when needed

---

## 🎨 Email Features

✅ Beautiful modern design with gradients
✅ Mobile-responsive
✅ Professional branding
✅ Clear call-to-action buttons
✅ Direct links to dashboard
✅ Automatic HTML + plain text

---

## 🌟 To Make It Professional

Want to use `user-service@ai-capital.com` instead?

### Option 1: Google Workspace ($6/month)
1. Sign up at: https://workspace.google.com/
2. Create: `user-service@ai-capital.com`
3. Get App Password (same as above)
4. Update `.env`:
   ```env
   EMAIL_PROVIDER=gmail
   EMAIL_FROM=user-service@ai-capital.com
   EMAIL_FROM_NAME=AiCapital
   EMAIL_USER=user-service@ai-capital.com
   EMAIL_PASSWORD=your-app-password
   ```

### Option 2: SendGrid (Free 100 emails/day)
1. Sign up at: https://sendgrid.com/
2. Verify domain: `ai-capital.com`
3. Get API key
4. Update `.env`:
   ```env
   EMAIL_PROVIDER=sendgrid
   EMAIL_FROM=user-service@ai-capital.com
   EMAIL_FROM_NAME=AiCapital
   SENDGRID_API_KEY=SG.your-api-key
   ```

---

## 📚 Need More Help?

- **Quick Start**: `QUICK_EMAIL_SETUP.md` (5-minute guide)
- **Detailed Guide**: `EMAIL_SETUP_GUIDE.md` (Everything you need)
- **Implementation Details**: `EMAIL_IMPLEMENTATION_SUMMARY.md`

---

## 🧪 Testing Endpoints

You can test emails using these API endpoints:

```bash
# Test welcome email
curl -X POST http://localhost:5000/api/test/email/send-welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test@gmail.com", "name": "Test User"}'

# Test notification
curl -X POST http://localhost:5000/api/test/email/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test@gmail.com",
    "title": "SELL Signal: AAPL",
    "message": "AI recommends selling AAPL",
    "type": "action",
    "actionData": {
      "ticker": "AAPL",
      "action": "SELL",
      "reason": "Price target reached"
    }
  }'
```

---

## ✅ Checklist

- [ ] Enable 2FA on Gmail
- [ ] Get App Password
- [ ] Add credentials to `.env`
- [ ] Restart backend server
- [ ] Test email by registering new user
- [ ] Check inbox for welcome email
- [ ] Verify email looks professional
- [ ] Test notification emails

---

## 🎉 You're Done!

Once you set up the App Password and add it to `.env`, your professional email system is ready to go!

**Questions?** Check the detailed guides in the documentation files.

**Ready to go pro?** Follow the "To Make It Professional" section above.

---

**Need Support?**

All your email service code is in:
- `backend/src/services/emailService.ts` - Main email service
- `backend/src/services/notificationService.ts` - Notification emails
- `backend/src/routes/auth.ts` - Welcome emails
- `backend/src/routes/emailTest.ts` - Testing endpoints

Everything is working and ready to use! Just add your email credentials! 🚀

