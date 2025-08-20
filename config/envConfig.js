require('dotenv').config();

const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('❌ .env의 TOKEN/CLIENT_ID/GUILD_ID가 필요합니다.');
  process.exit(1);
}

module.exports = { TOKEN, CLIENT_ID, GUILD_ID };
