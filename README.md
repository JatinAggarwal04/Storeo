
# RunBase - WhatsApp Bot Platform

Platform for creating AI-powered WhatsApp bots for businesses.

## Features
- **Frontend**: React, Vite, TailwindCSS (Styled).
- **Backend**: Flask, Supabase (Auth, DB, Storage).
- **Languages**: English, Hindi, Punjabi, Kannada.
- **Bot**: Twilio-integrated WhatsApp bot.

## Project Setup

### Prerequisites
- Node.js & npm
- Python 3.11+
- Supabase Project
- Twilio Account
- Ngrok

### 1. Environment Variables
Create a `.env` file in the root directory (copied from `.env.example` if available):
```bash
# Backend
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
OPENAI_API_KEY=your_openai_key # or ANTHROPIC_API_KEY if used

# Frontend (Vite)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```
Server runs at `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

### 4. Database & Storage Setup
1. Run `supabase_schema.sql` in Supabase SQL Editor to create tables.
2. Run `supabase_storage_policy.sql` to enable image uploads.
3. Disable **Confirm Email** in Supabase Auth settings for smoother demo experience.

### 5. Seeding Demo Data
To populate the database with demo products and images:
```bash
# Ensure venv is active and you are in root
python seeds/seed_demo_data.py
```
Credentials: `demo@runbase.com` / `DemoPassword123!`

## WhatsApp Bot Setup

### 1. Ngrok Tunnel
Expose your local backend to the internet:
```bash
ngrok http 5000
```
Copy the forwarding URL (e.g., `https://xxxx.ngrok-free.dev`).

### 2. Configure Twilio
1. Go to Twilio Console > Messaging > Senders > WhatsApp Senders.
2. Edit your sender (Sandbox or Business Profile).
3. Set **Endpoint URL** to: `https://xxxx.ngrok-free.dev/api/whatsapp/webhook`
4. Save.

## Testing the Bot

1. Send a WhatsApp message to your Twilio number (e.g., `join <sandbox-code>` if using sandbox).
2. Send "**Hi**" to start the conversation.
3. The bot should reply based on the demo business context.

## Troubleshooting

- **Images not showing?** Run `supabase_storage_policy.sql` and re-run seed script.
- **Login fails?** Disable Email Confirmation in Supabase.
- **Bot not replying?** Check if `ngrok` is running and the URL in Twilio matches. Verify backend logs.

