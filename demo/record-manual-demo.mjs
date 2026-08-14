import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const requireFromFrontend = createRequire(path.join(root, "frontend", "package.json"));
const { chromium } = requireFromFrontend("playwright");

const frontendUrl = process.env.DALILI_FRONTEND_URL || "http://127.0.0.1:5173";
const backendHealthUrl = process.env.DALILI_BACKEND_HEALTH || "http://127.0.0.1:8000/api/health";
const outputDir = path.join(root, "demo", "output");
const screenshotsDir = path.join(outputDir, "screenshots");
const videosDir = path.join(outputDir, "videos");

async function assertReachable(url, label) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (error) {
    throw new Error(
      `${label} indisponible: ${url}\n` +
        `Lance d'abord: C:\\Users\\maiss\\Desktop\\Dalili Dentiste\\LANCER_DALILI.bat\n` +
        `Detail: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function main() {
  await mkdir(screenshotsDir, { recursive: true });
  await mkdir(videosDir, { recursive: true });

  await assertReachable(backendHealthUrl, "Backend FastAPI");
  await assertReachable(frontendUrl, "Frontend Lovable/Vite");

  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: false });
  } catch {
    browser = await chromium.launch({ headless: false });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    recordVideo: { dir: videosDir, size: { width: 1440, height: 950 } },
  });
  const page = await context.newPage();
  await page.goto(frontendUrl, { waitUntil: "networkidle" });

  console.log("");
  console.log("Enregistrement manuel demarre.");
  console.log(`Interface ouverte: ${frontendUrl}`);
  console.log("Clique dans le navigateur pour faire ta demo.");
  console.log("Quand tu as termine, reviens ici et appuie sur ENTREE.");
  console.log("");

  const rl = readline.createInterface({ input, output });
  await rl.question("Appuie sur ENTREE pour stopper l'enregistrement...");
  rl.close();

  await page.screenshot({
    path: path.join(screenshotsDir, "manual-demo-last-screen.png"),
    fullPage: true,
  });
  const video = await page.video()?.path();
  await context.close();
  await browser.close();

  console.log("");
  console.log("Enregistrement termine.");
  console.log(`Capture finale: ${path.join(screenshotsDir, "manual-demo-last-screen.png")}`);
  if (video) console.log(`Video: ${video}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
