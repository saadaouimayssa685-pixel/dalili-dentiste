import { mkdir, copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const requireFromFrontend = createRequire(path.join(root, "frontend", "package.json"));
const { chromium } = requireFromFrontend("playwright");

const frontendUrl = process.env.DALILI_FRONTEND_URL || "http://127.0.0.1:5173";
const backendHealthUrl = process.env.DALILI_BACKEND_HEALTH || "http://127.0.0.1:8000/api/health";
const cardImage =
  process.env.DALILI_CARD_IMAGE ||
  "C:\\Users\\maiss\\Pictures\\Screenshots\\Capture d'écran 2026-08-13 232122.png";
const addToDatabase = process.env.DALILI_DEMO_ADD_TO_DATABASE === "true";

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

async function shot(page, name, options = {}) {
  await page.screenshot({
    path: path.join(screenshotsDir, `${name}.png`),
    fullPage: options.fullPage ?? false,
  });
}

async function clickIfVisible(page, locator, timeout = 2500) {
  try {
    await locator.first().click({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(screenshotsDir, { recursive: true });
  await mkdir(videosDir, { recursive: true });

  await assertReachable(backendHealthUrl, "Backend FastAPI");
  await assertReachable(frontendUrl, "Frontend Lovable/Vite");
  await copyFile(cardImage, path.join(outputDir, "carte-test-ocr.png")).catch(() => undefined);

  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: false, slowMo: 280 });
  } catch {
    browser = await chromium.launch({ headless: false, slowMo: 280 });
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    recordVideo: { dir: videosDir, size: { width: 1440, height: 950 } },
  });
  const page = await context.newPage();

  page.setDefaultTimeout(15000);

  await page.goto(frontendUrl, { waitUntil: "networkidle" });
  await shot(page, "01-accueil");

  await page.goto(`${frontendUrl}/public`, { waitUntil: "networkidle" });
  await page.waitForLoadState("networkidle");
  await shot(page, "02-recherche");

  const searchBox = page
    .locator(
      'input[placeholder*="Nom du dentiste"], input[placeholder*="specialite"], input[placeholder*="spécialité"], input[placeholder*="localite"], input[placeholder*="localité"], input[placeholder*="ville"]',
    )
    .first();
  await searchBox.fill("Ariana");
  await page.getByRole("button", { name: /^Rechercher$/i }).first().click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  await shot(page, "03-resultats-ariana");

  await clickIfVisible(page, page.getByRole("button", { name: /Voir le profil/i }).first(), 4000);
  await page.waitForTimeout(1000);
  await shot(page, "04-detail-profil");
  await page.keyboard.press("Escape").catch(() => undefined);

  await page.getByRole("button", { name: /Assistant/i }).first().click();
  await page.waitForTimeout(700);
  const assistantInput = page.getByLabel(/Message pour l'assistant/i);
  await assistantInput.fill("nheb dentiste fi Ariana");
  await page.getByRole("button", { name: /Envoyer/i }).last().click();
  await page.waitForTimeout(2500);
  await shot(page, "05-assistant-tounsi");

  await page.goto(`${frontendUrl}/professional#scan`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, "06-espace-pro-scan");

  const fileInput = page.locator('input[type="file"][aria-label="Importer une carte de visite"]').first();
  await fileInput.setInputFiles(cardImage);
  await page.waitForTimeout(7000);
  await shot(page, "07-resultat-ocr-carte", { fullPage: true });

  if (addToDatabase) {
    await clickIfVisible(page, page.getByRole("button", { name: /Ajouter a la base/i }).first(), 4000);
    await page.waitForTimeout(1800);
    await shot(page, "08-ajout-base");
  }

  await page.goto(`${frontendUrl}/professional`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "09-dashboard-professionnel", { fullPage: true });

  const video = await page.video()?.path();
  await context.close();
  await browser.close();

  console.log("Demo terminee.");
  console.log(`Captures: ${screenshotsDir}`);
  if (video) console.log(`Video: ${video}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
