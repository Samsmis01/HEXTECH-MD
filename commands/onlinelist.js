const { getGroupMetadata } = require("../utils/group");

module.exports = {
  name: "onlinelist",
  description: "Tague tous les membres en ligne dans le groupe",
  execute: async (sock, msg, args) => {
    const from = msg.key.remoteJid;

    // Vérifier si message dans un groupe
    if (!from.endsWith("@g.us")) {
      return await sock.sendMessage(from, {
        text: "❌ Cette commande ne fonctionne que dans un groupe.\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }

    try {
      // Récupérer la liste des membres du groupe
      const metadata = await getGroupMetadata(sock, from);
      const participants = metadata.participants;

      // Filtrer uniquement les membres en ligne
      const onlineMembers = participants
        .filter(p => p.presence === "available")
        .map(p => p.id);

      if (onlineMembers.length === 0) {
        return await sock.sendMessage(from, {
          text: "ℹ️ Aucun membre en ligne actuellement.\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
        });
      }

      // Message avec mentions
      const messageText = `👥 Membres en ligne :\n${onlineMembers
        .map((jid, i) => `${i + 1}. @${jid.split("@")[0]}`)
        .join("\n")}\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`;

      await sock.sendMessage(from, {
        text: messageText,
        mentions: onlineMembers
      });

      console.log(
        `📝 ${msg.key.participant || from} a tagué ${onlineMembers.length} membres en ligne > 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`
      );
    } catch (err) {
      console.error("❌ Erreur listonline:", err);
      await sock.sendMessage(from, {
        text: "❌ Une erreur est survenue lors du tag des membres en ligne.\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }
  }
};