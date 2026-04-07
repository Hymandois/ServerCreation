const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const readline = require('readline');

const INVITES_FILE = path.join(__dirname, 'invites.txt');


// Load tokens, names, and icon files
const invites = fs.readFileSync(INVITES_FILE, 'utf8')
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(Boolean);


if (!invites.length) {
  console.error("Invites file is missing.");
  process.exit(1);
}

// Waits for ENTER in console.
function waitForEnter() {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question("Press Enter to continue...", () => {
      rl.close();
      resolve();
    });
  });
}

// Immediately Invoked Async Function (runs directly when file is executed)
(async () => {

	console.log(`Press ENTER if you are logged into the admin token inputted.`);
	await waitForEnter();

  const invites = fs.readFileSync(INVITES_FILE, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim() !== "");

  // Launch Puppeteer browser (visible, not headless)
  const browser = await puppeteer.launch({ headless: false });
  // Open a new browser tab/page
  const page = await browser.newPage();

  // For each invite link:
  for (let i = 0; i < invites.length; i++) {
    const invite = invites[i];
    try {
      // Navigate to the invite link
      await page.goto(invite, { waitUntil: 'networkidle2' });

      console.log(`Invite #${i + 1} opened: ${invite}`);
      await waitForEnter(); // Waits until you press enter until it joins the next one

    } catch (err) {
      console.error(`Failed to open invite #${invite}:`, err);
    }
  }

  console.log("All invites are opened!!");
  await browser.close();
})();



