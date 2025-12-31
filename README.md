Finsight 🚀
Finsight is an intelligent financial companion designed to break the mold of monolithic expense tracking. It offers parallel analytics, real-time behavioral insights, and a reward-based system (B-SAVE) to encourage smarter saving habits.

✨ Features
Behavioral Savings (B-SAVE): Log smart financial choices (e.g., choosing home-cooked meals over takeout) to earn XP and level up your financial tier.

Dual Authentication: Secure access via traditional Email/Password or one-click Google OAuth 2.0.

Modular Analytics: Real-time breakdown of income, expenses, and weekly spending trends.

Onboarding Flow: Specialized setup for new users to define their financial profile (Salaried, Student, etc.).

Persistent Sessions: Secure session management using connect-pg-simple and PostgreSQL.

🛠️ Tech Stack
Frontend: React, TypeScript, Vite, Tailwind CSS v4, Wouter.

Backend: Node.js, Express, Passport.js (Local & Google Strategy).

Database: PostgreSQL (Neon), Drizzle ORM.

Authentication: Passport.js, Bcrypt.js, Express Session.

🚀 Getting Started
1. Prerequisites
Node.js (v18+)

PostgreSQL database (Neon.tech recommended)

Google Cloud Console account (for OAuth)

2. Environment Variables
Create a .env file in the root directory and add the following:

Code snippet

PG_CONNECTION_STRING=your_postgresql_url
SESSION_SECRET=your_random_secret
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
NODE_ENV=development
3. Installation
Bash

# Install dependencies
npm install

# Push database schema
npx drizzle-kit push
4. Running the App
Bash

# Run development server
npm run dev

# Build for production
npm run build
📂 Project Structure
Plaintext

├── api/                # Vercel Serverless Function entry
├── client/             # Frontend React application
│   ├── src/
│   │   ├── components/ # Shadcn UI components
│   │   ├── pages/      # Auth, Dashboard, Onboarding
│   │   └── lib/        # API client and utils
├── server/             # Express backend
│   ├── index.ts        # Server entry point
│   ├── routes.ts       # API routes and Auth logic
│   └── storage.ts      # Drizzle database operations
├── shared/             # Shared types and Zod schemas
└── drizzle.config.ts   # Database migration config
🛡️ Database Schema
The project uses a relational schema optimized for financial tracking:

Users: Auth data and Google IDs.

UserProfiles: Financial metadata and reward tiers.

Transactions: Record of all financial movements.

BehavioralSavings: XP logs for the B-SAVE engine.

📝 License
This project is licensed under the MIT License.
