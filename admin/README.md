# Thamel Admin

Admin app for Thamel Bar & Karaoke: scan member QR to add reward points and apply offers, view karaoke bookings, and list users.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_API_URL` – backend API URL (default `http://localhost:3001`)
   - `NEXT_PUBLIC_ADMIN_SECRET` – optional; if set, backend must receive this in `X-Admin-Secret` header for admin routes
3. Ensure the backend is running and has `ADMIN_SECRET` set in `.env` if you use admin auth.

## Run

- Dev: `npm run dev` (runs on http://localhost:3002)
- Build: `npm run build`
- Start: `npm run start`

## Features

- **Dashboard** – Links to Scan, Karaoke bookings, Users
- **Scan QR** – Use device camera or upload an image to scan member QR (from the mobile app wallet). Enter points to add and/or select an offer to apply.
- **Karaoke** – List all karaoke room bookings with room, date, time, contact, and member.
- **Users** – List all members with name, email, points, and verified status.
