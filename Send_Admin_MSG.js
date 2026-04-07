const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Client } = require('discord.js-selfbot-v13');
const { HttpsProxyAgent } = require('https-proxy-agent');

// HTTPS proxy \/\/\/
const PROXY_URL = 'xxxxxxxxxxxxxxxxxxxxxxxx';

// Input the discord token you wish to be admin on the server.
const ADMIN_TOKEN = "xxxxxxxxxxxxxxxxxxxx";

// Message that will be sent by the admin in all servers
const MESSAGE = "xxxxxxxxxxxxxxxxxx";

// The file that has the format "{TOKEN},{GUILDID},{CHANNELID},{PRIVATE_CHANNEL_ID}" on each line (created_servers.txt in this case)
const INPUTFILE = path.join(__dirname, 'created_servers.txt');


const lines = fs.readFileSync(INPUTFILE, 'utf8')
				.split(/\r?\n/)
				.filter(Boolean); // Remove empty rows



// Create a proxy agent using the given proxy URL
const proxyAgent = new HttpsProxyAgent(PROXY_URL);

// Initialize a Discord client and route both HTTP and WebSocket traffic through the proxy
const client = new Client({
	http: { agent: proxyAgent },
	ws: { agent: proxyAgent },
});



// This runs once when the bot is fully logged in and ready \/\/\/\/
client.once('ready', async () => {

	// Try to fetch and display the public IP (to verify proxy is working)
	// We use proxy for the request at a timeout for 5 secs.
	try {
		const res = await fetch('https://api.ipify.org?format=json', {
			agent: proxyAgent,
			timeout: 5000,
		});

		// Extract ip for print
		const { ip } = await res.json();
		console.log(`${client.user.tag} IP: ${ip}`);
		} 
	catch (e) {
		console.error(`Failed to fetch IP: ${e.message}`);
	}

	// Loop through each line (expected format: Token,guildId,channelId)
	for (const line of lines) {

		const [token, guildId, channelId, privateChannel] = line.split(',');

		console.log(`Token: ${token}, Guild: ${guildId}, Channel: ${channelId}, PC: ${privateChannel}`);

		try {
			const guild = await client.guilds.fetch(guildId);
			console.log(`Fetched guild: ${guild.name}`);

			const channel = await guild.channels.fetch(channelId);

			if (channel && channel.isText()) {
				await channel.send(MESSAGE);
				console.log(`Sent message to ${channel.name}`);
			} else {
				console.log(`Could not send in ${channelId}, not a text channel`);
			}

		} catch (err) {
			console.error(`Failed to fetch guild or channel for ${guildId}: ${err.message}`);
		}
	}

	// were done with this client, go to next if there is one.
	client.destroy();

});

client.on('error', err => {
	console.error(`Client error for ${ADMIN_TOKEN.slice(-6)}:`, err.message);
});

client.login(ADMIN_TOKEN).catch(err => {
	console.error(`Login failed for token …${ADMIN_TOKEN.slice(-6)}:`, err.message);
});