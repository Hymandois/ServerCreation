const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Client } = require('discord.js-selfbot-v13');
const { HttpsProxyAgent } = require('https-proxy-agent');

const TOKENS_FILE = path.join(__dirname, 'tokens.txt');

// Output files, first is where server id will be sent, used for bump-automation
//               Second one is to output invite links for the created servers.
const OUTPUT_FILE = path.join(__dirname, 'created_servers.txt');
const INVITES_FILE = path.join(__dirname, 'invites.txt');

// Input Icon directory & name text file.
const ICONS_DIR = path.join(__dirname, 'icons');
const NAMES_FILE = path.join(__dirname, 'names.txt');

// Discord template URL \/
const TEMPLATE_URL = '';

// HTTPS proxy \/\/\/
const PROXY_URL = '';




// Load tokens, names, and icon files
const tokens = fs.readFileSync(TOKENS_FILE, 'utf8')
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(Boolean);

const names = fs.readFileSync(NAMES_FILE, 'utf8')
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(Boolean);

const iconFiles = fs.readdirSync(ICONS_DIR)
  .filter(f => /\.(png|jpe?g)$/i.test(f));

console.log('Names:', names);
console.log('Icons:', iconFiles);


if (!names.length || !iconFiles.length) {
  console.error("Names or icon files are missing.");
  process.exit(1);
}


fs.writeFileSync(OUTPUT_FILE, '', 'utf8');


// Loop through each token
tokens.forEach((token, index) => {

    // Create proxy agent (used for both HTTP and WebSocket connections)
    const proxyAgent = new HttpsProxyAgent(PROXY_URL);

    // Create Discord client using proxy
    const client = new Client({
        http: { agent: proxyAgent },
        ws: { agent: proxyAgent },
    });

    // Pick a server name and icon (rotates if fewer than tokens)
    const serverName = names[index % names.length];
    const iconPath = path.join(ICONS_DIR, iconFiles[index % iconFiles.length]);

    // Read icon file as buffer
    const iconBuffer = fs.readFileSync(iconPath);

    // Runs when client is logged in and ready
    client.once('ready', async () => {

        console.log(`[${client.user.tag}] connected.`);

        // Fetch public IP (to verify proxy works)
        try {
            const res = await fetch('https://api.ipify.org?format=json', {
                agent: proxyAgent,
                timeout: 5000,
            });

            const { ip } = await res.json();
            console.log(`${client.user.tag} IP: ${ip}`);

        } catch (e) {
            console.error(`Failed to fetch IP: ${e.message}`);
        }

        try {
            // Fetch server template and create a new guild
            const template = await client.fetchGuildTemplate(TEMPLATE_URL);
            const guild = await template.createGuild(serverName, iconBuffer);

            console.log(`Created "${guild.name}" (ID: ${guild.id})`);

            // Ensure all channels are cached
            await guild.channels.fetch();

            // Find specific channels by name
            const privateChannel = guild.channels.cache.find(c => c.name === 'private');
            const gatewayChannel = guild.channels.cache.find(c => c.name === 'gateway');


            // =========================
            // CREATE INVITE LINK
            // =========================
            // Create permanent invite for gateway channel
            let inviteUrl = 'N/A';

            if (gatewayChannel && gatewayChannel.isText()) {
                try {
                    const invite = await gatewayChannel.createInvite({
                        maxAge: 0,     // never expires
                        maxUses: 0,    // unlimited uses
                        unique: true,
                        reason: 'Permanent invite for the created guild'
                    });

                    inviteUrl = `https://discord.gg/${invite.code}`;
                    console.log(`Permanent invite created: ${inviteUrl}`);

                    // Read existing invites
                    let currentInvites = [];

                    if (fs.existsSync(INVITES_FILE)) {
                        currentInvites = fs.readFileSync(INVITES_FILE, 'utf8').split(/\r?\n/);
                    }

                    // Add new invite
                    currentInvites.push(inviteUrl);

                    // Save updated invites list
                    fs.writeFileSync(INVITES_FILE, currentInvites.join('\n'), 'utf8');

                } catch (err) {
                    console.error(`Failed to create invite: ${err.message}`);
                }
            }

            // =========================
            // WRITE OUTPUT FILES
            // =========================

            // OUTPUT_FILE → store everything in ONE file using new format
            const lines = fs.readFileSync(OUTPUT_FILE, 'utf-8').split('\n');

            // Save: token, guildId, gatewayChannelId (or change to private if you want)
            lines[index] = `${token},${guild.id},${gatewayChannel?.id || 'N/A'}, ${privateChannel?.id || 'N/A'}`;

            // Write back to file
            fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf8');

        } catch (err) {

            // If guild creation fails
            console.error(`Failed to create guild for ${client.user.tag}: ${err.message}`);

            // Clear corresponding lines in output file
            const lines = fs.readFileSync(OUTPUT_FILE, 'utf-8').split('\n');
            lines[index] = '';
            fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf8');
        }

        // Disconnect client after finishing
        client.destroy();
    });

    // Handle runtime client errors
    client.on('error', err => {
        console.error(`Client error for ${token.slice(-6)}:`, err.message);
    });

    // Login using current token
    client.login(token).catch(err => {

        console.error(`Login failed for token …${token.slice(-6)}:`, err.message);

        // Clear corresponding lines if login fails

        const lines_three = fs.readFileSync(OUTPUT_FILE, 'utf-8').split('\n');
        lines_three[index] = '';
        fs.writeFileSync(OUTPUT_FILE, lines_three.join('\n'), 'utf8');
    });
});

