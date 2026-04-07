const { spawn } = require("child_process");
const readline = require("readline");

/**
 * Main.js runs multiple Node.js scripts sequentially, waiting for Enter between each step.
 *
 * Create_Servers.js = creates servers using different tokens from tokens.txt
 * and saves them in created_servers.txt.
 * It also generates an invite link for each server and stores them in invites.txt.
 *
 * created_servers.txt format:
 * <Token>,<GuildID>,<ChannelID>,<PrivateChannelId>
 *
 * invites.txt is a list of invite links used in Admin_Joiner.js.
 *
 * Admin_Joiner.js = opens all links from invites.txt in Puppeteer,
 * assuming you are logged into the admin account in the Discord app.
 *
 * Give_Admin_Role.js = assigns the admin role to admin
 * in all servers listed in created_servers.txt.
 * IMPORTANT: Change message in the code to your desire.
 *
 * Send_Admin_MSG.js = sends messages in all channels
 * for servers listed in created_servers.txt.
 *
 * Run this script using `node Main.js` and follow the instructions in the terminal.
 *
 * Version: 1.0 first publish (Not THE most optimal code.)
 */





const programs = [
  "node Create_Servers.js",
  "node Admin_Joiner.js",
  "node Give_Admin_Role.js",
  "node Send_Admin_MSG.js"
];

// Setup readline to wait for enter
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function waitForEnter() {
  return new Promise(resolve => {
    rl.question("Press Enter to run the next program...", () => resolve());
  });
}

async function runProgramsSequentially() {
  for (let i = 0; i < programs.length; i++) {
    const command = programs[i].split(" ");
    // Makes a child process run the next python script.
    const proc = spawn(command[0], command.slice(1), { stdio: "inherit" });

    await new Promise(resolve => {
      proc.on("close", resolve); // Wait until process is done
    });

    if (i < programs.length - 1) {
      await waitForEnter(); // Wait until enter before next
    }
  }

  rl.close();
  console.log("You are done!");
}

runProgramsSequentially();
