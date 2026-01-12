module.exports = {
  name: "left",
  execute: async (sock, msg) => {
    const from = msg.key.remoteJid;

    await sock.sendMessage(from, {
      text: "👋 Le bot quitte le groupe\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
    });

    await sock.groupLeave(from);
  }
};