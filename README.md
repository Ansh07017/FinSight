## Finsight 🚀

An intelligent financial companion for smarter spending and behavioral savings.

🌐 **Live App:** https://finsight-yodo.onrender.com/

✨ **Interactive Animated Documentation**
👉 [Open Beautiful HTML README](./README.html)

---

## Features
- Behavioral Savings (B-SAVE)
- Modular Analytics
- Dual Authentication
- Onboarding Flow
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Finsight 🚀</title>

<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">

<style>

:root{
--bg:#050505;
--aqua:#00ffd5;
--gold:#d4af37;
--text:#eaeaea;
--card:#0d0d0d;
}

*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:'Inter',sans-serif;
}

body{
background:var(--bg);
color:var(--text);
line-height:1.6;
overflow-x:hidden;
}

h1,h2,h3{
font-family:'Orbitron',sans-serif;
letter-spacing:1px;
}

.container{
width:90%;
max-width:1100px;
margin:auto;
padding:60px 0;
}

header{
text-align:center;
padding:120px 0;
position:relative;
}

header h1{
font-size:4rem;
color:var(--aqua);
text-shadow:0 0 20px var(--aqua);
animation: glow 3s infinite alternate;
}

header p{
margin-top:20px;
font-size:1.2rem;
opacity:.8;
}

button{
background:transparent;
border:2px solid var(--aqua);
color:var(--aqua);
padding:12px 28px;
margin-top:30px;
cursor:pointer;
font-weight:500;
transition:.3s;
}

button:hover{
background:var(--aqua);
color:black;
box-shadow:0 0 15px var(--aqua);
}

.gold-line{
height:2px;
background:linear-gradient(90deg,transparent,var(--gold),transparent);
margin:60px 0;
}

.grid{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
gap:30px;
}

.card{
background:var(--card);
border:1px solid rgba(212,175,55,.2);
padding:30px;
border-radius:10px;
transition:.4s;
position:relative;
overflow:hidden;
}

.card:hover{
transform:translateY(-6px);
box-shadow:0 0 20px rgba(0,255,213,.3);
}

.card h3{
color:var(--aqua);
margin-bottom:10px;
}

.code{
background:#0a0a0a;
border-left:3px solid var(--aqua);
padding:15px;
margin-top:15px;
font-family:monospace;
overflow:auto;
}

.tech{
display:flex;
flex-wrap:wrap;
gap:10px;
margin-top:15px;
}

.tech span{
border:1px solid var(--aqua);
padding:6px 12px;
border-radius:20px;
font-size:.85rem;
}

footer{
text-align:center;
padding:40px 0;
opacity:.7;
}

@keyframes glow{
from{ text-shadow:0 0 10px var(--aqua);}
to{ text-shadow:0 0 30px var(--aqua);}
}

.fade{
opacity:0;
transform:translateY(30px);
transition:1s;
}

.fade.show{
opacity:1;
transform:translateY(0);
}

</style>
</head>

<body>

<header>
<h1>Finsight 🚀</h1>
<p>Intelligent Financial Companion with Behavioral Analytics & Smart Saving</p>

<a href="https://finsight-yodo.onrender.com/" target="_blank">
<button>Open Live App</button>
</a>
</header>

<div class="container fade">

<div class="gold-line"></div>

<h2>✨ Features</h2>

<div class="grid">

<div class="card">
<h3>B-SAVE Behavioral Savings</h3>
<p>Track smart financial decisions like cooking at home instead of ordering food and earn XP while improving saving habits.</p>
</div>

<div class="card">
<h3>Dual Authentication</h3>
<p>Secure login using traditional Email/Password or quick Google OAuth 2.0 authentication.</p>
</div>

<div class="card">
<h3>Modular Analytics</h3>
<p>Real-time breakdown of expenses, income streams, and weekly spending behaviour.</p>
</div>

<div class="card">
<h3>Onboarding Flow</h3>
<p>Custom setup flow to define your financial profile such as student, salaried professional, etc.</p>
</div>

<div class="card">
<h3>Persistent Sessions</h3>
<p>Secure session storage using PostgreSQL with connect-pg-simple for reliability.</p>
</div>

</div>

<div class="gold-line"></div>

<h2>🛠 Tech Stack</h2>

<div class="grid">

<div class="card">
<h3>Frontend</h3>
<div class="tech">
<span>React</span>
<span>TypeScript</span>
<span>Vite</span>
<span>Tailwind CSS</span>
<span>Wouter</span>
</div>
</div>

<div class="card">
<h3>Backend</h3>
<div class="tech">
<span>Node.js</span>
<span>Express</span>
<span>Passport.js</span>
</div>
</div>

<div class="card">
<h3>Database</h3>
<div class="tech">
<span>PostgreSQL</span>
<span>SupaBase</span>
<span>Drizzle ORM</span>
</div>
</div>

</div>

<div class="gold-line"></div>

<h2>🚀 Getting Started</h2>

<div class="card">
<h3>1. Prerequisites</h3>

<div class="code">
Node.js v18+  
PostgreSQL database  
Google Cloud Console account
</div>

</div>

<br>

<div class="card">
<h3>2. Environment Variables</h3>

<div class="code">
PG_CONNECTION_STRING=your_postgresql_url
SESSION_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
NODE_ENV=development
</div>

</div>

<br>

<div class="card">
<h3>3. Installation</h3>

<div class="code">
npm install
npx drizzle-kit push
</div>

</div>

<br>

<div class="card">
<h3>4. Run the App</h3>

<div class="code">
npm run dev
npm run build
</div>

</div>

<div class="gold-line"></div>

<h2>📂 Project Structure</h2>

<div class="card">

<div class="code">

api/                 # Serverless functions  
client/              # React frontend  

   src/  
   ├─ components/    # UI components  
   ├─ pages/         # Dashboard & Auth pages  
   └─ lib/           # Utilities  

server/              # Express backend  
shared/              # Shared types  
drizzle.config.ts    # Database configuration

</div>

</div>

<div class="gold-line"></div>

<h2>🛡 Database Schema</h2>

<div class="grid">

<div class="card">
<h3>Users</h3>
<p>Authentication details and Google OAuth IDs.</p>
</div>

<div class="card">
<h3>UserProfiles</h3>
<p>Financial metadata and B-SAVE reward tiers.</p>
</div>

<div class="card">
<h3>Transactions</h3>
<p>Income and expense tracking records.</p>
</div>

<div class="card">
<h3>BehavioralSavings</h3>
<p>XP logs used for the gamified saving engine.</p>
</div>

</div>

<div class="gold-line"></div>

<h2>📝 License</h2>

<p>This project is licensed under the MIT License.</p>

</div>

<footer>
<p>Built with 💡 for smarter financial decisions</p>
</footer>

<script>

const faders=document.querySelectorAll(".fade");

const appearOptions={
threshold:0.3
};

const appearOnScroll=new IntersectionObserver(function(entries,appearOnScroll){
entries.forEach(entry=>{
if(!entry.isIntersecting)return;
entry.target.classList.add("show");
appearOnScroll.unobserve(entry.target);
});
},appearOptions);

faders.forEach(fader=>{
appearOnScroll.observe(fader);
});

</script>

</body>
</html>
