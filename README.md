# KisanSaathi (किसान साथी)

KisanSaathi is a comprehensive web platform for Indian farmers, designed to promote income stability and informed decision-making. The app empowers farmers with live mandi prices, AWS AI-powered crop and insurance advisory, and a complete input cost tracking system.

## Features List
- **Mandi Price Lookup**: Get live data from data.gov.in and compare with MSP 2024-25. Includes an SMS alert preview.
- **AI Crop Advisory**: Multi-turn chat using AWS Bedrock (Amazon Nova/Claude), with web speech support for voice input in multiple Indian languages.
- **Crop Insurance Guide**: Receive tailored PMFBY (Pradhan Mantri Fasal Bima Yojana) scheme advice from AWS AI.
- **Cost Tracker**: Log expenses for various categories, view dynamic charts, and calculate estimated profit against projected yields.
- **Multilingual Support**: Supports English, Hindi, Marathi, Punjabi, Tamil, Telugu, Kannada, and Bengali.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (via Supabase)
- **APIs**: 
  - AWS Bedrock (Amazon Nova / Anthropic Claude)
  - Data.gov.in Open Government Data API

## How to get API keys
- **Supabase (PostgreSQL)**: Go to supabase.com → New Project → Settings → Database → Copy connection string.
- **AWS Bedrock**: Go to AWS Console → IAM → Create User → Generate Access Keys.
- **data.gov.in**: Go to data.gov.in → Register → My Account → API Keys → Generate Key.

## Local setup instructions
```bash
git clone <your-repo-url>
cd kisansaathi

# Setup Backend
cp server/.env.example server/.env   # fill in your keys
cd server
npm install
npm run dev

# Setup Frontend
cd ../client
cp .env.example .env
npm install
npm run dev
```

## How to deploy for free
- **Frontend**: Connect your GitHub repo to a static hosting provider (e.g. Netlify, Render), set the `VITE_API_BASE_URL` environment variable to your backend URL, and deploy.
- **Backend**: Connect your repo to Render, set the root directory to `server`, add all server environment variables, build command `npm install`, and start command `npm start`.

## API Keys Table
| Service | Free Limit | Where to get |
|---|---|---|
| Supabase PostgreSQL | 500MB, 2 projects | [supabase.com](https://supabase.com) |
| AWS Bedrock | Pay-As-You-Go | [aws.amazon.com/bedrock/](https://aws.amazon.com/bedrock/) |
| data.gov.in | Unlimited (govt open data) | [data.gov.in](https://data.gov.in) |
| Render backend | 750 hours/month | [render.com](https://render.com) |
