const { SlashCommandBuilder } = require('discord.js');
const http = require('http');
const dns = require('dns').promises;
const { fetchWithTimeout } = require('../utils/request');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('site')
    .setDescription('입력한 URL의 상태와 응답 시간을 확인합니다')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('http(s):// 로 시작하는 주소')
        .setRequired(true)
    ),

  async execute(interaction) {
    const raw = interaction.options.getString('url', true).trim();

    let target;
    try {
      target = new URL(raw);
      if (!/^https?:$/.test(target.protocol)) {
        await interaction.reply({ content: '❌ http(s):// 만 지원합니다.', ephemeral: true });
        return;
      }
    } catch {
      await interaction.reply({ content: '❌ 올바른 URL을 입력해 주세요.', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    let ip = 'N/A';
    try {
      ip = (await dns.lookup(target.hostname)).address;
    } catch {}

    const options = {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'DiscordBot/1.0 (+site-check)', 'Accept': '*/*' }
    };

    const { res, elapsed, errInfo } = await fetchWithTimeout(target.toString(), options, 8000);

    if (!res) {
      await interaction.editReply(
        '```ansi\n' +
        '\u001b[31m🔴 Site Check Failed\u001b[0m\n' +
        `URL: ${target.href}\n` +
        `Host: ${target.hostname} (${ip})\n` +
        `Error: ${errInfo || 'request failed'}\n` +
        `Elapsed: ${elapsed}ms\n` +
        '```'
      );
      return;
    }

    const code = res.status;
    const reason = http.STATUS_CODES[code] || '';
    const finalUrl = res.url || target.href;
    const ct = res.headers.get('content-type') || 'N/A';
    const cl = res.headers.get('content-length') || 'N/A';
    const server = res.headers.get('server') || 'N/A';
    const icon = code >= 200 && code < 400 ? '🟢' : (code < 500 ? '🟡' : '🔴');
    const pad = (label, width = 30) => label.padEnd(width, ' ');

    await interaction.editReply(
      '```ansi\n' +
      `\u001b[32m${icon} Site Status\u001b[0m\n` +
      '─────────────────────────────────────────────────────────\n' +
      `${pad('\u001b[36m• URL:\u001b[0m')} ${finalUrl}\n` +
      `${pad('\u001b[36m• Host:\u001b[0m')} ${target.hostname} (${ip})\n` +
      `${pad('\u001b[36m• Status:\u001b[0m')} ${code} ${reason}\n` +
      `${pad('\u001b[36m• Elapsed:\u001b[0m')} ${elapsed}ms\n` +
      `${pad('\u001b[36m• Content-Type:\u001b[0m')} ${ct}\n` +
      `${pad('\u001b[36m• Content-Length:\u001b[0m')} ${cl}\n` +
      `${pad('\u001b[36m• Server:\u001b[0m')} ${server}\n` +
      '─────────────────────────────────────────────────────────\n' +
      '```'
    );
  }
};
