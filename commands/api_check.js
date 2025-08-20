const { SlashCommandBuilder } = require('discord.js');
const http = require('http');
const { fetchWithTimeout } = require('../utils/request');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('api_check')
        .setDescription('API 엔드포인트 상태/응답시간 확인')
        .addStringOption(option =>
            option
                .setName('method')
                .setDescription('HTTP 메서드 선택')
                .setRequired(true)
                .addChoices(
                    { name: 'GET', value: 'GET' },
                    { name: 'POST', value: 'POST' },
                    { name: 'PUT', value: 'PUT' },
                    { name: 'DELETE', value: 'DELETE' },
                    { name: 'PATCH', value: 'PATCH' },
                ),
        )
        .addStringOption(option =>
            option
                .setName('url')
                .setDescription('http(s):// 로 시작하는 엔드포인트 URL')
                .setRequired(true),
        )
        .addStringOption(option =>
            option
                .setName('body')
                .setDescription('요청 본문 (옵션, JSON 추천)'),
        )
        .addStringOption(option =>
            option
                .setName('content_type')
                .setDescription('본문 Content-Type (기본: application/json)'),
        ),

    async execute(interaction) {
        const pad = (label, width = 22) => label.padEnd(width, ' ');

        const method = interaction.options
            .getString('method', true)
            .toUpperCase();
        const rawUrl = interaction.options.getString('url', true).trim();
        const bodyStr = interaction.options.getString('body') || '';
        const contentType =
            interaction.options.getString('content_type') || 'application/json';

        let target;
        try {
            target = new URL(rawUrl);
            if (!/^https?:$/.test(target.protocol)) {
                await interaction.reply({
                    content: '❌ http(s):// 만 지원합니다.',
                    ephemeral: true,
                });
                return;
            }
        } catch {
            await interaction.reply({
                content: '❌ 올바른 URL을 입력해 주세요.',
                ephemeral: true,
            });
            return;
        }

        const allowsBody = /^(POST|PUT|PATCH)$/i.test(method);
        if (!allowsBody && bodyStr) {
            await interaction.reply({
                content:
                    '❌ 이 메서드는 요청 본문을 사용하지 않습니다. (GET/DELETE 등)',
                ephemeral: true,
            });
            return;
        }

        if (allowsBody && bodyStr && /^application\/json/i.test(contentType)) {
            try {
                JSON.parse(bodyStr);
            } catch {
                await interaction.reply({
                    content: '❌ body가 유효한 JSON이 아닙니다.',
                    ephemeral: true,
                });
                return;
            }
        }

        await interaction.deferReply();

        const headers = { 'User-Agent': 'DiscordBot/1.0 (+api_check)' };
        if (allowsBody && bodyStr) headers['Content-Type'] = contentType;

        const init = { method, redirect: 'follow', headers };
        if (allowsBody && bodyStr) init.body = bodyStr;

        const { res, elapsed, errInfo } = await fetchWithTimeout(
            target.toString(),
            init,
            10000,
        );

        if (!res) {
            await interaction.editReply(
                '```ansi\n' +
                    '\u001b[31m🔴 API Check Failed\u001b[0m\n' +
                    `${pad('\u001b[36m• URL:\u001b[0m')} ${target.href}\n` +
                    `${pad('\u001b[36m• Method:\u001b[0m')} ${method}\n` +
                    `${pad('\u001b[36m• Error:\u001b[0m')} ${errInfo || 'request failed'}\n` +
                    `${pad('\u001b[36m• Elapsed:\u001b[0m')} ${elapsed}ms\n` +
                    '```',
            );
            return;
        }

        const code = res.status;
        const reason = http.STATUS_CODES[code] || '';
        const finalUrl = res.url || target.href;
        const respType = res.headers.get('content-type') || 'N/A';
        const respLen = res.headers.get('content-length') || 'N/A';
        const icon =
            code >= 200 && code < 300
                ? '🟢'
                : code >= 300 && code < 400
                  ? '🟡'
                  : code >= 400 && code < 500
                    ? '🟠'
                    : '🔴';

        let preview = '';
        const isJson = /^application\/json\b/i.test(respType);
        if (isJson) {
            try {
                const text = await res.text();
                preview = text.length > 800 ? text.slice(0, 800) + '…' : text;
            } catch {}
        }

        const reqBodyLine = allowsBody && bodyStr ? bodyStr : '(none)';
        const reqContentTypeLine =
            allowsBody && bodyStr ? headers['Content-Type'] || 'N/A' : '(none)';

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
            lines.push(
                '─────────────────────────────────────────────────────────',
            );
            lines.push('\u001b[36m• Response Preview (JSON)\u001b[0m');
            lines.push(preview || '(empty)');
        }

        lines.push('```');
        await interaction.editReply(lines.join('\n'));
    },
};
