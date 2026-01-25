module.exports = {
  name: "promoteall",
  execute: async (sock, msg) => {
    const from = msg.key.remoteJid;
    const metadata = await sock.groupMetadata(from);

    const users = metadata.participants
      .filter(p => !p.admin)
      .map(p => p.id);

    if (users.length === 0)
      return sock.sendMessage(from, { text: "Tous sont déjà admins" });

    await sock.groupParticipantsUpdate(from, users, "promote");

    await sock.sendMessage(from, {
      text: "✅ Tous les membres ont été promus\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
    });
  }
};