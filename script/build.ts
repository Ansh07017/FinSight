import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

const allowlist = [
  "connect-pg-simple",
  "cors",
  "express",
  "express-session",
  "passport",
  "passport-local",
  "pg",
  "zod",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];

  // UPDATED: Added specific Vercel-compatible native binaries to externals
  const externals = [
    ...allDeps.filter((dep) => !allowlist.includes(dep)),
    "lightningcss",                     // Fixes "Could not resolve '../pkg'"
    "@tailwindcss/oxide",               // Fixes ".node" loader error
    "@tailwindcss/oxide-linux-x64-gnu", // Prevents bundling Linux-specific binaries
    "tailwindcss",                      // Avoids bundling massive v4 engine
    "bcryptjs"                          // Standard practice for native modules
  ];

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    minify: true,
    external: externals,                // Keeps these in node_modules at runtime
    logLevel: "info",
    define: {
      "process.env.NODE_ENV": '"production"', // Ensures production optimization
    },
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});