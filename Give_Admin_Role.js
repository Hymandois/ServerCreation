const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Client } = require('discord.js-selfbot-v13');
const { HttpsProxyAgent } = require('https-proxy-agent');

// HTTPS proxy \/\/\/
const PROXY_URL = '';

// Following is user ID (Received by discord -> profile -> copy user ID)
const TARGET_USER_ID = "";

const INPUTFILE = path.join(__dirname, 'created_servers.txt');



// Read file (only guildID will be used here...)
const lines = fs.readFileSync(INPUTFILE, 'utf8')
	.split(/\r?\n/)
	.filter(Boolean);      // Remove empty lines

// for each line in file:
lines.forEach(line => {

	// format is token, guildId, channelId:
	const [token, guildId, channelId, PrivateChannel] = line.split(',');

	console.log(`Token: ${token}, Guild: ${guildId}, Channel: ${channelId}, PC: ${PrivateChannel}`);

	// Create proxy agent (used for both HTTP and WebSocket)
	const proxyAgent = new HttpsProxyAgent(PROXY_URL);

	// Create a new Discord client using the proxy
	const client = new Client({
		http: { agent: proxyAgent },
		ws: { agent: proxyAgent },
	});

	// Runs once when the client is ready (logged in)
	client.once('ready', async () => {

		console.log(`[${client.user.tag}] connected.`);

		// Try to fetch public IP (to verify proxy works)
		try {
			const res = await fetch('https://api.ipify.org?format=json', {
				agent: proxyAgent,   // Use proxy
				timeout: 5000,       // 5 second timeout
			});

			const { ip } = await res.json();
			console.log(`${client.user.tag} IP: ${ip}`);

		} catch (e) {
			console.error(`Failed to fetch IP: ${e.message}`);
		}

		try {
			// Fetch the guild (server)
			const guild = await client.guilds.fetch(guildId);

			// Create an admin role in the guild
			const adminRole = await guild.roles.create({
				name: "Admin",
				permissions: ["ADMINISTRATOR"],
				reason: "Automatically created admin role",
			});

			console.log(`Role created: ${adminRole.name}`);

			try {
				// Fetch the target user
				const member = await guild.members.fetch(TARGET_USER_ID);

				// Give the admin role to the user
				await member.roles.add(adminRole);

				console.log(`Gave ${member.user.tag} the role ${adminRole.name}`);

			} catch (err) {
				// Error if user not found or role assignment fails
				console.error(`Failed to assign role: ${err.message}`);
			}

		} catch (err) {
			// Error if guild fetch or role creation fails
			console.error(`Failed to fetch guild or create role: ${err.message}`);
		}

		// Disconnect client after finishing, go to next!
		client.destroy();
	});




  client.on('error', err => {
    console.error(`Client error for ${token.slice(-6)}:`, err.message);
  });

  client.login(token).catch(err => {
    console.error(`Login failed for token …${token.slice(-6)}:`, err.message);

  });
});

