const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('사용 가능한 명령어 목록을 보여줍니다'),

    async execute(interaction) {
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

        await interaction.reply({ content: helpText, ephemeral: true });
    },
};
