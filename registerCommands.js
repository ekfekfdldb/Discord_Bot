const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { TOKEN, CLIENT_ID, GUILD_ID } = require('./config/envConfig');

const commands = [];

// commands 폴더의 모든 파일을 로드
const commandFiles = fs
    .readdirSync('./commands')
    .filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
        });
        console.log('Guild slash commands registered');
    } catch (err) {
        console.error('Command register error:', err);
    }
})();
