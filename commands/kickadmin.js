module.exports = {
  name: "kickadmins",
  execute: async (sock, msg) => {
    const from = msg.key.remoteJid;
    const metadata = await sock.groupMetadata(from);

    const admins = metadata.participants
      .filter(p => p.admin && !p.id.includes(sock.user.id))
      .map(p => p.id);

    if (admins.length === 0) {
      return sock.sendMessage(from, {
        text: "❌ Aucun admin à exclure\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }

    await sock.groupParticipantsUpdate(from, admins, "remove");

    await sock.sendMessage(from, {
      text: "🚫 Tous les admins ont été retirés\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
    });
  }
};