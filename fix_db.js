import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { Client } = require('pg');
try { require('dotenv').config(); } catch (e) {}

const run = async () => {
  console.log("Attempting to fix database...");
  
  let dbUrl = process.env.DATABASE_URL;
  let client;
  
  // 1. Try configured Remote URL
  if (dbUrl && !dbUrl.includes("YOUR_ACTUAL_PASSWORD")) {
    console.log(`Trying configured DATABASE_URL...`);
    client = new Client({
        connectionString: dbUrl,
        ssl: dbUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 30000, // 30s timeout
    });
    try {
        await client.connect();
        console.log("Connected to configured database.");
    } catch (e) {
        console.warn(`\n⚠️  Could not connect to configured DATABASE_URL: ${e.message}`);
        if (e.message.includes("ETIMEDOUT")) {
            console.warn("   (This usually means your network/firewall is blocking port 5432)");
        }
        client = null; // Reset client to try fallback
    }
  }

  // 2. If failed, try local defaults
  if (!client) {
    console.log("\n🔄 Attempting fallback to local database (localhost:5432)...");
    const localUrls = [
        "postgresql://postgres:postgres@localhost:5432/finsight",
        "postgresql://postgres:password@localhost:5432/finsight",
        "postgresql://postgres:admin@localhost:5432/finsight"
    ];

    for (const url of localUrls) {
        // Try connecting to 'postgres' db first to check if 'finsight' exists
        const rootUrl = url.replace("/finsight", "/postgres");
        const rootClient = new Client({ connectionString: rootUrl, connectionTimeoutMillis: 3000 });
        
        try {
            await rootClient.connect();
            console.log(`   ✅ Found local Postgres at: ${url}`);
            
            // Check/Create DB
            const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = 'finsight'`);
            if (res.rowCount === 0) {
                console.log("   Creating 'finsight' database...");
                await rootClient.query(`CREATE DATABASE "finsight"`);
            }
            await rootClient.end();

            // Now connect to finsight
            client = new Client({ connectionString: url });
            await client.connect();
            
            console.log("\n❗ IMPORTANT: We switched to a local database because the remote one failed.");
            console.log(`❗ Please update your .env file manually to:\nDATABASE_URL=${url}\n`);
            break;
        } catch (e) {
            // ignore and try next password
        }
    }
  }

  if (!client) {
    console.error("\n❌ Failed to connect to any database (Remote or Local).");
    console.error("   It looks like your network is blocking the remote connection and you don't have a local DB.");
    console.error("\n   👉 SOLUTION: Install PostgreSQL for Windows:");
    console.error("   1. Download: https://www.postgresql.org/download/windows/");
    console.error("   2. Install it (remember the password you set, usually 'postgres' or 'password').");
    console.error("   3. Update your .env file with: DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/finsight");
    process.exit(1);
  }

  try {
    console.log("Creating 'session' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `);
    
    await client.query(`ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;`).catch(() => {});
    await client.query(`CREATE INDEX "IDX_session_expire" ON "session" ("expire");`).catch(() => {});

    console.log("\n✅ Success! Database fixed. You can now run 'npm run dev'.");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
};

run();