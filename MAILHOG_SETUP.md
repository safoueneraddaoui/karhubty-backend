# MailHog Setup for KarHubty

## What is MailHog?

MailHog is a mail testing tool for developers:
- Catches all emails sent by your app
- Displays them in a web UI
- No real emails sent
- Perfect for development and testing

## Quick Start

### 1. Start MailHog and PostgreSQL with Docker Compose

```bash
cd /Users/safouene/Desktop/Projects/karhubty/karhubty-backend
docker-compose up -d
```

This starts:
- **MailHog SMTP**: `localhost:1025`
- **MailHog Web UI**: `http://localhost:8025`
- **PostgreSQL**: `localhost:5432`

### 2. Verify Services are Running

```bash
# Check Docker containers
docker ps

# You should see:
# - karhubty-mailhog (port 1025, 8025)
# - karhubty-postgres (port 5432)
```

### 3. Start Backend

```bash
cd /Users/safouene/Desktop/Projects/karhubty/karhubty-backend
npm install
npm start
```

Backend will start on `http://localhost:8080`

### 4. Start Frontend

In another terminal:

```bash
cd /Users/safouene/Desktop/Projects/karhubty/karhubty-frontend
npm start
```

Frontend will start on `http://localhost:3000`

## Testing Email Verification

### 1. Register a User

Go to `http://localhost:3000/register`

Fill in the form:
```
Email: test@example.com
Password: password123
First Name: John
Last Name: Doe
Phone: 1234567890
City: New York
```

Click Register

### 2. Check MailHog Web UI

Open: **http://localhost:8025**

You should see the verification email in the inbox!

### 3. Click Verification Link

The email contains a verification link. Click it or copy it to browser.

Example: `http://localhost:3000/verify-email/abc123def456...`

### 4. You're Done!

After verification, you can login with:
- Email: `test@example.com`
- Password: `password123`

## Stopping Services

### Stop Containers (keep data)

```bash
docker-compose stop
```

### Stop and Remove Containers (delete data)

```bash
docker-compose down
```

### Remove Everything (data + images)

```bash
docker-compose down -v
```

## MailHog Web UI Features

Access at: **http://localhost:8025**

- View all emails received
- Check email headers and body
- Download email as .eml file
- Resend emails
- Delete emails

## Switching Email Providers

When you want to use a real SMTP server (Gmail, SendGrid, etc.):

1. Update `.env` with your SMTP credentials
2. Stop MailHog: `docker-compose down`
3. Restart backend: `npm start`

## .env Configuration

Current MailHog config in `.env`:

```
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@karhubty.com
```

**Note**: MailHog doesn't require username/password

## Troubleshooting

### MailHog not accessible

```bash
# Check if container is running
docker ps | grep mailhog

# View logs
docker logs karhubty-mailhog
```

### Ports already in use

If port 1025 or 8025 is in use:

```bash
# Change ports in docker-compose.yml
# Example: 9025:1025 means use 9025 on your machine
```

### Database connection error

Make sure PostgreSQL is running:

```bash
docker logs karhubty-postgres
```

### Emails not sending

1. Check backend logs for errors
2. Verify `EMAIL_HOST=localhost` and `EMAIL_PORT=1025` in `.env`
3. Restart backend after changing `.env`

## Production vs Development

**Development (Current):**
- MailHog catches all emails
- No real emails sent
- Emails visible in Web UI

**Production:**
- Replace MailHog with real SMTP (Gmail, SendGrid, AWS SES, etc.)
- Update `.env` with production credentials
- Ensure HTTPS is used for security

## Example Production Config (Gmail)

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

See root `.env.email.example` for more details.
