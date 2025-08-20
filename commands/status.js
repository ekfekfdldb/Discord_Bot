const { SlashCommandBuilder } = require('discord.js');
const os = require('os');
const { fmtUptime, fmtMemory } = require('../utils/format');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('봇의 연결 상태를 출력합니다'),

  async execute(interaction, client) {
    const pad = (label, width = 30) => label.padEnd(width, ' ');

    let pingValue, pingIcon;
    if (client.ws.ping === -1) { pingValue = 'Connecting...'; pingIcon = '⚪'; }
    else if (client.ws.ping <= 100) { pingValue = `${client.ws.ping}ms`; pingIcon = '🟢'; }
    else if (client.ws.ping <= 200) { pingValue = `${client.ws.ping}ms`; pingIcon = '🟡'; }
    else { pingValue = `${client.ws.ping}ms`; pingIcon = '🔴'; }

    const botUpMs = Date.now() - (client.startTime || Date.now());
    const uptimeBot = fmtUptime(botUpMs);
    const uptimeSys = fmtUptime(os.uptime() * 1000);
    const guilds = client.guilds.cache.size;
    const memory = fmtMemory(process.memoryUsage().rss);
    const nodeVer = `v${process.versions.node}`;
    const osLabel = `${os.type()} ${os.release()} (${os.platform()} ${os.arch()})`;

    const content =
      '```ansi\n' +
      '\u001b[32m🟢 Bot Status (online)\u001b[0m\n' +
      '─────────────────────────────────────────────────────────\n' +
      `${pad('\u001b[36m• API Ping:\u001b[0m')} ${pingIcon} ${pingValue}\n` +
      `${pad('\u001b[36m• Uptime (Bot):\u001b[0m')} ${uptimeBot}\n` +
      `${pad('\u001b[36m• Uptime (System):\u001b[0m')} ${uptimeSys}\n` +
      `${pad('\u001b[36m• Servers Connected:\u001b[0m')} ${guilds}\n` +
      `${pad('\u001b[36m• Memory Usage:\u001b[0m')} ${memory}\n` +
      `${pad('\u001b[36m• Node.js:\u001b[0m')} ${nodeVer}\n` +
      `${pad('\u001b[36m• OS:\u001b[0m')} ${osLabel}\n` +
      '─────────────────────────────────────────────────────────\n' +
      '```';

    await interaction.reply(content);
  }
};
