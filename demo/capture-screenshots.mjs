import { copyFile, mkdir } from "node:fs/promises";
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

const outputDir = path.join(root, "demo", "output");
const runId = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const screenshotsDir = path.join(outputDir, "screenshots", `run-${runId}`);

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

async function shot(page, name, fullPage = false) {
  const file = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage });
  console.log(file);
}

async function waitReady(page) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(900);
}

async function main() {
  await mkdir(screenshotsDir, { recursive: true });
  await assertReachable(backendHealthUrl, "Backend FastAPI");
  await assertReachable(frontendUrl, "Frontend Lovable/Vite");
  await copyFile(cardImage, path.join(outputDir, "carte-test-ocr.png")).catch(() => undefined);

  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: false, slowMo: 120 });
  } catch {
    browser = await chromium.launch({ headless: false, slowMo: 120 });
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  page.setDefaultTimeout(12000);

  await page.goto(frontendUrl, { waitUntil: "networkidle" });
  await waitReady(page);
  await shot(page, "github-01-accueil", true);

  await page.goto(`${frontendUrl}/public`, { waitUntil: "networkidle" });
  await waitReady(page);
  await shot(page, "github-02-espace-public", true);

  const input = page
    .locator('input[placeholder*="Nom du dentiste"], input[placeholder*="localit"], input[placeholder*="sp"]')
    .first();
  if (await input.count()) {
    await input.fill("Ariana");
    await page.getByRole("button", { name: /^Rechercher$/i }).first().click();
    await waitReady(page);
  }
  await page.getByRole("button", { name: /Voir le profil/i }).first().click().catch(() => undefined);
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: /Assistant/i }).first().click().catch(() => undefined);
  await page.waitForTimeout(700);
  await shot(page, "github-03-fiche-dentiste-chatbot", false);
  await page.keyboard.press("Escape").catch(() => undefined);

  await page.goto(`${frontendUrl}/professional`, { waitUntil: "networkidle" });
  await waitReady(page);
  await shot(page, "github-04-espace-pro-vue-ensemble", true);

  await page.getByRole("button", { name: /Dentistes/i }).first().click();
  await waitReady(page);
  await shot(page, "github-05-espace-pro-dentistes", true);

  await page.getByRole("button", { name: /Sources de donnees|Sources de données/i }).first().click().catch(async () => {
    await page.getByText(/Sources de donnees|Sources de données/i).first().click();
  });
  await waitReady(page);
  await shot(page, "github-06-espace-pro-sources", true);

  await page.getByRole("button", { name: /Qualite des donnees|Qualité des données/i }).first().click().catch(async () => {
    await page.getByText(/Qualite des donnees|Qualité des données/i).first().click();
  });
  await waitReady(page);
  await shot(page, "github-07-espace-pro-qualite", true);

  await page.getByRole("button", { name: /Doublons/i }).first().click();
  await waitReady(page);
  await shot(page, "github-08-espace-pro-doublons", true);

  await page.getByRole("button", { name: /Localites|Localités/i }).first().click().catch(async () => {
    await page.getByText(/Localites|Localités/i).first().click();
  });
  await waitReady(page);
  await shot(page, "github-09-espace-pro-localites", true);

  await page.getByRole("button", { name: /Logs/i }).first().click();
  await waitReady(page);
  await shot(page, "github-10-espace-pro-logs", true);

  await page.getByRole("button", { name: /Scan carte|Scanner une carte/i }).first().click().catch(async () => {
    await page.getByText(/Scan carte|Scanner une carte/i).first().click();
  });
  await waitReady(page);
  await shot(page, "github-11-scan-carte", true);

  await page.goto(`${frontendUrl}/professional/ajouter-cabinet`, { waitUntil: "networkidle" });
  await waitReady(page);
  await shot(page, "github-12-formulaire-ajout-cabinet", true);

  await page.goto(`${frontendUrl}/contact`, { waitUntil: "networkidle" });
  await waitReady(page);
  await shot(page, "github-13-laisser-avis-contact", true);

  await browser.close();
  console.log(`Captures terminees: ${screenshotsDir}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

