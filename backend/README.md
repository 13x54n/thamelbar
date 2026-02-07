# Thamel Toronto Backend

Node.js API with MongoDB and email verification via Nodemailer.

## Setup

1. **Install dependencies**

   ```bash
   cd backend && npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and fill in:

   ```bash
   cp .env.example .env
   ```

   - `MONGODB_URI` – MongoDB connection string (e.g. `mongodb://localhost:27017/thameltoronto` or MongoDB Atlas URI)
   - `JWT_SECRET` – Secret for signing JWT tokens
   - `SMTP_*` – SMTP settings for Nodemailer (e.g. Gmail with an App Password)

3. **Run**

   ```bash
   npm run dev   # dev with auto-reload
   # or
   npm start     # production
   ```

## API

Base URL: `http://localhost:3001`

### Auth

| Method | Endpoint            | Description                          |
|--------|---------------------|--------------------------------------|
| POST   | `/api/auth/request-code` | Send verification code to email |
| POST   | `/api/auth/verify`       | Verify code, sign up or log in |
| POST   | `/api/auth/login`        | Login with email + password          |
| GET    | `/api/auth/me`           | Current user (requires `Authorization: Bearer <token>`) |

#### Request verification code

```json
POST /api/auth/request-code
{ "email": "user@example.com" }
```

#### Verify code (new user: include name + password)

```json
POST /api/auth/verify
{
  "email": "user@example.com",
  "code": "123456",
  "name": "John",
  "password": "secret"
}
```

#### Verify code (existing user: only email + code)

```json
POST /api/auth/verify
{ "email": "user@example.com", "code": "123456" }
```

#### Login

```json
POST /api/auth/login
{ "email": "user@example.com", "password": "secret" }
```

## Gmail SMTP

1. Enable 2FA on your Google account.
2. Create an App Password: Google Account → Security → App passwords.
3. In `.env`:

   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   MAIL_FROM="Thamel Toronto <your-email@gmail.com>"
   ```

If SMTP is not configured, codes are printed to the console instead of being emailed.
