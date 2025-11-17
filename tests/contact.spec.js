import puppeteer from "puppeteer";

const run = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://jorgecamposdocs.vercel.app/contact", { waitUntil: "networkidle0" });

  await page.type('input[name="name"]', "Bot Tester");
  await page.type('input[name="email"]', "bot@example.com");
  await page.type('textarea[name="message"]', "Mensaje de prueba automático");
  await page.click('button[type="submit"]');

  await browser.close();
};

run();
