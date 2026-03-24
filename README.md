<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=00D4AA&height=200&section=header&text=FinSight&fontSize=70&fontColor=ffffff&animation=fadeIn&desc=Level %2 Up %3 Your %3 Finances &descAlignY=75" width="100%" />

# 🚀 FinSight 

<p align="center">
  <i>A gamified financial companion that treats saving money like an RPG. <br> Stop tracking, start leveling up.</i>
</p>

<a href="https://finsight-yodo.onrender.com/"><img src="https://img.shields.io/badge/🔴_Live_Demo-00D4AA?style=for-the-badge&logoColor=white" alt="Live Demo"/></a>
<img src="https://img.shields.io/badge/Status-Beta_Live-blue?style=for-the-badge" alt="Status"/>
<img src="https://img.shields.io/badge/Responsive-Mobile_&_Desktop-purple?style=for-the-badge" alt="Responsive"/>

<br>
<br>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&pause=1000&color=00D4AA&center=true&vCenter=true&width=435&lines=Save+Money.;Earn+XP.;Unlock+Tiers.;Become+a+Visionary." alt="Typing SVG" />

</div>

---

## ⚠️ Note on Live Demo (Cold Start)
> **Hosted on Render (Free Tier):** If the app hasn't been used in 15 minutes, the server goes to sleep. **Please allow ~50 seconds for the backend to wake up** on your first visit. Grab a coffee ☕, it will load!

---

## ⚡ Core Features (The B-SAVE Engine)

FinSight breaks the mold of boring spreadsheets. We use **Behavioral Savings (B-SAVE)** to track the money you *didn't* spend.

<table align="center" width="100%">
  <tr>
    <td align="center" width="33%">
      <h3>☕ Skipped Coffee</h3>
      <p>Save ₹50<br><b>+50 XP</b></p>
    </td>
    <td align="center" width="33%">
      <h3>🚇 Took Metro/Walked</h3>
      <p>Save ₹80<br><b>+30 XP</b></p>
    </td>
    <td align="center" width="33%">
      <h3>🍳 Cooked at Home</h3>
      <p>Save ₹150<br><b>+100 XP</b></p>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="3">
      <h3>🛍️ Delayed Impulse Purchase</h3>
      <p>Save ₹200 <br><b>+150 XP</b></p>
    </td>
  </tr>
</table>

<div align="center">
  <p><i>*Daily XP is strictly capped at <b>250 XP</b> to encourage consistent, daily habits rather than spamming!*</i></p>
</div>

---

## 🏆 The Progression System

As you save and log your behaviors, you rank up through the FinSight Tiers. Your multiplier increases if your savings efficiency (Savings ÷ Income) exceeds 20%.

| Tier Icon | Rank Name | Requirement | Perk |
| :---: | :--- | :--- | :--- |
| ⚡ | **The Spark** | 0 XP | The Journey Begins |
| 🛡️ | **The Pathfinder** | 2,000 XP & 15 Days | Unlocks Multipliers |
| ⭐ | **The Strategist** | 10,000 XP & 45 Days | Advanced Analytics |
| 🏆 | **The Architect** | 25,000 XP & 105 Days | Elite Status |
| 👑 | **The Visionary** | 50,000 XP & 225 Days | Financial Mastery |

---

## 🛠️ The Tech Stack

Built with modern web standards, focusing on type safety, relational data integrity, and seamless UI/UX.

<table align="center">
  <tr>
    <td align="center"><b>Frontend</b></td>
    <td align="center"><b>Backend</b></td>
    <td align="center"><b>Database & ORM</b></td>
    <td align="center"><b>DevOps & Tools</b></td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" /><br>
      <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" /><br>
      <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white" />
    </td>
    <td align="center">
      <img src="https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white" /><br>
      <img src="https://img.shields.io/badge/Express.js-404D59?style=flat&logo=express&logoColor=white" /><br>
      <img src="https://img.shields.io/badge/Passport.js-34E27A?style=flat&logo=passport&logoColor=white" />
    </td>
    <td align="center">
      <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white" /><br>
      <img src="https://img.shields.io/badge/Neon_DB-00E599?style=flat&logo=postgresql&logoColor=black" /><br>
      <img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat&logo=drizzle&logoColor=black" /><br>
      <img src="https://img.shields.io/badge/Zod-3068b7?style=flat&logo=zod&logoColor=white" />
    </td>
    <td align="center">
      <img src="https://img.shields.io/badge/Vite-B73BFE?style=flat&logo=vite&logoColor=FFD62E" /><br>
      <img src="https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=white" />
    </td>
  </tr>
</table>

---

## 🧠 Key Technical Implementations

1. **Dual Authentication:** Implemented `Passport.js` with both Local (Email/Password) and Google OAuth 2.0 strategies, backed by `express-session` and `connect-pg-simple` for persistent database sessions.
2. **Type-Safe Data Flow:** Used **Drizzle ORM** for defining the Postgres schema and integrated it with **Zod** to validate all incoming HTTP requests before they hit the database.
3. **Responsive Gamification UI:** Utilized Tailwind CSS Grid and Flexbox to ensure data-heavy financial tables and the "Growth Dashboard" scale perfectly from desktop monitors to mobile phones.

---

## 💻 Local Installation

Want to run FinSight on your own machine? 

```bash
# 1. Clone the repository
git clone [https://github.com/Ansh07017/FinSight.git](https://github.com/Ansh07017/FinSight.git)
cd FinSight

# 2. Install dependencies
npm install

# 3. Set up environment variables (.env)
# Create a .env file and add:
# PG_CONNECTION_STRING=your_neon_db_url
# SESSION_SECRET=your_secret_key
# GOOGLE_CLIENT_ID=your_oauth_id
# GOOGLE_CLIENT_SECRET=your_oauth_secret

# 4. Push database schema using Drizzle
npx drizzle-kit push

# 5. Start the development server
npm run dev
