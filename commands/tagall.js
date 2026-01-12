module.exports = {
  name: "tagall",
  execute: async (sock, msg, args) => {
    const from = msg.key.remoteJid;
    const metadata = await sock.groupMetadata(from);

    let text = "📢 *TAG ALL*\n\n";
    const mentions = [];

    metadata.participants.forEach(p => {
      mentions.push(p.id);
      text += `➤ @${p.id.split("@")[0]}\n`;
    });

    await sock.sendMessage(from, {
      text: text + "\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴",
      mentions
    });
  }
};