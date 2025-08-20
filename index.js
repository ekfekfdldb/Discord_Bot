const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { TOKEN } = require('./config/envConfig');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

// 명령어 로딩
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`🌐 Connected to ${client.guilds.cache.size} server(s):`);
  client.guilds.cache.forEach(guild => {
    console.log(`   • ${guild.name} (ID: ${guild.id})`);
  });

  const now = new Date().toLocaleString();
  console.log(`🕒 Start Time: ${now}`);
  console.log(`📦 Loaded Commands: ${client.commands.map(cmd => cmd.data.name).join(', ')}`);
  console.log(`🔧 Node.js: ${process.version}`);
  console.log(`🖥️ Platform: ${process.platform} (${process.arch})`);
  console.log(`📁 Project Root: ${process.cwd()}`);

  client.startTime = Date.now();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: '❌ 명령어 실행 중 오류가 발생했습니다.', ephemeral: true });
  }
});

client.login(TOKEN);