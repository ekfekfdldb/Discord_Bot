/* eslint-disable no-useless-escape */
require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const os = require('os');
const http = require('http');
const dns = require('dns').promises;

/* ===== .env 개별 변수 ===== */
const TOKEN = process.env.TOKEN;         // Bot 토큰
const CLIENT_ID = process.env.CLIENT_ID; // Application ID
const GUILD_ID = process.env.GUILD_ID;   // 서버 ID

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ .env의 TOKEN/CLIENT_ID/GUILD_ID가 필요합니다.');
  process.exit(1);
}

/* ===== 1) 슬래시 명령 정의: /help, /status ===== */
const cmds = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('사용 가능한 명령어 목록을 보여줍니다'),
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('봇의 연결 상태를 출력합니다'),
  new SlashCommandBuilder()
    .setName('site')
    .setDescription('입력한 URL의 상태와 응답 시간을 확인합니다')
    .addStringOption(o =>
      o.setName('url')
        .setDescription('http(s):// 로 시작하는 주소')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('api_check')
    .setDescription('API 엔드포인트 상태/응답시간 확인')
    .addStringOption(o =>
      o.setName('method')
        .setDescription('HTTP 메서드 선택')
        .setRequired(true)
        .addChoices(
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
          { name: 'PATCH', value: 'PATCH' },
        )
    )
    .addStringOption(o =>
      o.setName('url')
        .setDescription('http(s):// 로 시작하는 엔드포인트 URL')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('body')
        .setDescription('요청 본문 (옵션, JSON 추천)')
    )
    .addStringOption(o =>
      o.setName('content_type')
        .setDescription('본문 Content-Type (기본: application/json)')
    )
].map(c => c.toJSON());

/* ===== 2) 길드 전용 등록(즉시 반영) ===== */
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: cmds });
    console.log('✅ Guild slash commands registered');
  } catch (err) {
    console.error('❌ Command register error:', err);
  }
})();

/* ===== 3) 클라이언트 ===== */
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`🌐 Connected to ${client.guilds.cache.size} server(s):`);
  client.guilds.cache.forEach(guild => {
    console.log(`   • ${guild.name} (ID: ${guild.id})`);
  });
  client.startTime = Date.now();
});

client.login(TOKEN);

/* ===== 4) 핸들러 ===== */
client.on('interactionCreate', async (i) => {
  if (!i.isChatInputCommand()) return;

  if (i.commandName === 'help') {
    const pad = (label, width = 15) => label.padEnd(width, ' ');

    const helpText =
      '```ansi\n' +
      '\u001b[36m명령어 목록\u001b[0m\n' +
      '──────────────────────────────────────────\n' +
      `${pad('• /help')} 이 도움말을 보여줍니다\n` +
      `${pad('• /status')} 봇의 연결 상태를 출력합니다\n` +
      `${pad('• /site')} URL의 상태와 응답 시간을 확인합니다\n` +
      `${pad('• /api_check')} API 엔드포인트 상태를 확인합니다\n` + 
      '──────────────────────────────────────────\n' +
      '```';

    await i.reply({ content: helpText, ephemeral: true });
    return;
  }
  if (i.commandName === 'status') {
    // 정렬용 함수 (라벨 고정 폭)
    const pad = (label, width = 30) => label.padEnd(width, ' ');

    // 핑 상태
    let pingValue, pingIcon;
    if (client.ws.ping === -1) { pingValue = 'Connecting...'; pingIcon = '⚪'; }
    else if (client.ws.ping <= 100) { pingValue = `${client.ws.ping}ms`; pingIcon = '🟢'; }
    else if (client.ws.ping <= 200) { pingValue = `${client.ws.ping}ms`; pingIcon = '🟡'; }
    else { pingValue = `${client.ws.ping}ms`; pingIcon = '🔴'; }

    // 정보 수집
    const botUpMs = Date.now() - (client.startTime || Date.now());
    const uptimeBot = fmtUptime(botUpMs);
    const uptimeSys = fmtUptime(os.uptime() * 1000);
    const guilds = client.guilds.cache.size;
    const memory = fmtMemory(process.memoryUsage().rss);
    const nodeVer = `v${process.versions.node}`;
    const osLabel = `${os.type()} ${os.release()} (${os.platform()} ${os.arch()})`;

    // 출력 문자열
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

    await i.reply(content);
  }
  if (i.commandName === 'site') {
    const raw = i.options.getString('url', true).trim();

    let target;
    try {
      target = new URL(raw);
      if (!/^https?:$/.test(target.protocol)) {
        await i.reply({ content: '❌ http(s):// 만 지원합니다.', ephemeral: true });
        return;
      }
    } catch {
      await i.reply({ content: '❌ 올바른 URL을 입력해 주세요.', ephemeral: true });
      return;
    }

    await i.deferReply();

    // 호스트 IP
    let ip = 'N/A';
    try { ip = (await dns.lookup(target.hostname)).address; } catch { }

    // GET (Range 제거), 타임아웃 + UA 지정
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let res, elapsed, errInfo = '';
    const start = Date.now();
    try {
      res = await fetch(target.toString(), {
        method: 'GET',
        redirect: 'follow',
        headers: { 'User-Agent': 'DiscordBot/1.0 (+site-check)', 'Accept': '*/*' },
        signal: controller.signal
      });
      elapsed = Date.now() - start;
    } catch (e) {
      elapsed = Date.now() - start;
      // 에러 원인 좀 더 자세히
      const cause = e.cause || {};
      errInfo = [e.name, e.message, cause.code, cause.errno].filter(Boolean).join(' | ');
    } finally {
      clearTimeout(timeout);
    }

    if (!res) {
      await i.editReply(
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

    await i.editReply(
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
  if (i.commandName === 'api_check') {
    const pad = (label, width = 22) => label.padEnd(width, ' ');

    const method = i.options.getString('method', true).toUpperCase();
    const rawUrl = i.options.getString('url', true).trim();
    const bodyStr = i.options.getString('body') || '';
    const ContentType = i.options.getString('content_type') || 'application/json';

    // URL 검증
    let target;
    try {
      target = new URL(rawUrl);
      if (!/^https?:$/.test(target.protocol)) {
        await i.reply({ content: '❌ http(s):// 만 지원합니다.', ephemeral: true });
        return;
      }
    } catch {
      await i.reply({ content: '❌ 올바른 URL을 입력해 주세요.', ephemeral: true });
      return;
    }

    // 메서드별 body 허용
    const allowsBody = /^(POST|PUT|PATCH)$/i.test(method);
    if (!allowsBody && bodyStr) {
      await i.reply({ content: '❌ 이 메서드는 요청 본문을 사용하지 않습니다. (GET/DELETE 등)', ephemeral: true });
      return;
    }

    // JSON 본문 검증(선택)
    if (allowsBody && bodyStr && /^application\/json/i.test(ContentType)) {
      try { JSON.parse(bodyStr); } catch {
        await i.reply({ content: '❌ body가 유효한 JSON이 아닙니다.', ephemeral: true });
        return;
      }
    }

    await i.deferReply();

    // 요청 준비
    const headers = { 'User-Agent': 'DiscordBot/1.0 (+api_check)' };
    if (allowsBody && bodyStr) headers['Content-Type'] = ContentType;

    const init = { method, redirect: 'follow', headers };
    if (allowsBody && bodyStr) init.body = bodyStr;

    // 타임아웃
    const controller = new AbortController();
    const TIMEOUT_MS = 10000;
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    init.signal = controller.signal;

    let res, elapsed, errInfo = '';
    const start = Date.now();
    try {
      res = await fetch(target.toString(), init);
      elapsed = Date.now() - start;
    } catch (e) {
      elapsed = Date.now() - start;
      const cause = e.cause || {};
      errInfo = [e.name, e.message, cause.code, cause.errno].filter(Boolean).join(' | ');
    } finally {
      clearTimeout(timer);
    }

    if (!res) {
      await i.editReply(
        '```ansi\n' +
        '\u001b[31m🔴 API Check Failed\u001b[0m\n' +
        `${pad('\u001b[36m• URL:\u001b[0m')} ${target.href}\n` +
        `${pad('\u001b[36m• Method:\u001b[0m')} ${method}\n` +
        `${pad('\u001b[36m• Error:\u001b[0m')} ${errInfo || 'request failed'}\n` +
        `${pad('\u001b[36m• Elapsed:\u001b[0m')} ${elapsed}ms\n` +
        '```'
      );
      return;
    }

    // 응답 정보
    const code = res.status;
    const reason = http.STATUS_CODES[code] || '';
    const finalUrl = res.url || target.href;
    const respType = res.headers.get('content-type') || 'N/A';
    const respLen = res.headers.get('content-length') || 'N/A';
    const icon =
      code >= 200 && code < 300 ? '🟢' :
        code >= 300 && code < 400 ? '🟡' :
          code >= 400 && code < 500 ? '🟠' : '🔴';

    // JSON 미리보기(최대 800자)
    let preview = '';
    const isJson = /^application\/json\b/i.test(respType);
    if (isJson) {
      try {
        const text = await res.text();
        preview = text.length > 800 ? text.slice(0, 800) + '…' : text;
      } catch { /* ignore */ }
    }

    // 요청 요약
    const reqBodyLine = allowsBody && bodyStr ? bodyStr : '(none)';
    const reqContentTypeLine = allowsBody && bodyStr ? (headers['Content-Type'] || 'N/A') : '(none)';

    const lines = [
      '```ansi',
      `\u001b[32m${icon} API Endpoint Status\u001b[0m`,
      '─────────────────────────────────────────────────────────',
      `${pad('\u001b[36m• URL:\u001b[0m')} ${finalUrl}`,
      `${pad('\u001b[36m• Method:\u001b[0m')} ${method}`,
      `${pad('\u001b[36m• Status:\u001b[0m')} ${code} ${reason}`,
      `${pad('\u001b[36m• Elapsed:\u001b[0m')} ${elapsed}ms`,
      `${pad('\u001b[36m• Content-Type:\u001b[0m')} ${respType}`,
      `${pad('\u001b[36m• Content-Length:\u001b[0m')} ${respLen !== 'N/A' ? respLen + ' bytes' : 'N/A'}`,
      '─────────────────────────────────────────────────────────',
      '\u001b[36m• Request Summary\u001b[0m',
      `${pad('  - Content-Type:')} ${reqContentTypeLine}`,
      `${pad('  - Body:')} ${reqBodyLine}`,
    ];

    if (isJson) {
      lines.push('─────────────────────────────────────────────────────────');
      lines.push('\u001b[36m• Response Preview (JSON)\u001b[0m');
      lines.push(preview || '(empty)');
    }

    lines.push('```');
    await i.editReply(lines.join('\n'));
    return;
  }
});

// 유틸 함수
function fmtUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

function fmtMemory(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}