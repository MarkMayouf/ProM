# Email Setup Guide for ProMayouf

The email verification system requires proper email configuration. Here are your options:

## 🚀 Quick Start (Development Mode)

**No setup required!** The system will automatically use mock email mode if no configuration is provided. Verification codes will be logged to the console.

## 📧 Option 1: Gmail Setup (Recommended for Development)

### Steps:
1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Create `.env` file** in the `backend` directory:
```bash
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/promayouf
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:3000

# Gmail Configuration
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=ProMayouf
```

## 📨 Option 2: SendGrid (Production Recommended)

### Steps:
1. **Sign up** at [SendGrid](https://sendgrid.com)
2. **Create API Key** in SendGrid dashboard
3. **Add to `.env`**:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_EMAIL=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=ProMayouf
```

## 📮 Option 3: Other Email Services

### Mailgun:
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_EMAIL=your-mailgun-email
SMTP_PASSWORD=your-mailgun-password
```

### Amazon SES:
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_EMAIL=your-aws-access-key
SMTP_PASSWORD=your-aws-secret-key
```

## 🔧 Environment Variables Explained

| Variable | Description | Required |
|----------|-------------|----------|
| `GMAIL_EMAIL` | Your Gmail address | For Gmail only |
| `GMAIL_APP_PASSWORD` | Gmail App Password (16 chars) | For Gmail only |
| `SMTP_HOST` | SMTP server hostname | For custom SMTP |
| `SMTP_PORT` | SMTP server port (usually 587) | For custom SMTP |
| `SMTP_EMAIL` | SMTP username/email | For custom SMTP |
| `SMTP_PASSWORD` | SMTP password/API key | For custom SMTP |
| `FROM_EMAIL` | Sender email address | Optional |
| `FROM_NAME` | Sender name | Optional |

## 🛠️ Testing Email Setup

After configuration, restart your server and try registering. You should see console logs indicating which email service is being used:

```bash
📧 Email Service: Using Gmail SMTP
✅ Email sent successfully: { to: 'user@example.com', subject: '...', messageId: '...' }
```

## 🐛 Troubleshooting

### Gmail Issues:
- ✅ **Use App Password, not regular password**
- ✅ **Enable 2FA first**
- ✅ **Check for typos in email/password**

### SMTP Issues:
- ✅ **Verify SMTP settings with your provider**
- ✅ **Check firewall/network restrictions**
- ✅ **Confirm API key permissions**

### Development Mode:
If you see "using mock mode", no real emails are sent - codes are logged to console.

## 🚀 Quick Fix for Current Error

To immediately fix the connection error, simply restart your server. The improved email system will now:
1. Detect missing configuration
2. Use mock email mode for development
3. Log verification codes to console
4. Allow registration to proceed normally

No additional setup required for development testing! 