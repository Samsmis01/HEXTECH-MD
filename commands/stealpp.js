module.exports = {
  name: "stealpp",
  description: "Récupère la photo de profil d’un utilisateur",
  execute: async (sock, msg) => {
    const from = msg.key.remoteJid;

    // Vérifier mention
    const mentioned =
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (!mentioned || mentioned.length === 0) {
      return await sock.sendMessage(from, {
        text: "❌ Mentionne un utilisateur\n\nExemple : `.stealpp @user`"
      });
    }

    const target = mentioned[0];

    try {
      // Récupérer la photo de profil
      const ppUrl = await sock.profilePictureUrl(target, "image");

      if (!ppUrl) {
        return await sock.sendMessage(from, {
          text: "❌ Cet utilisateur n’a pas de photo de profil"
        });
      }

      await sock.sendMessage(from, {
        image: { url: ppUrl },
        caption: "> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝚇𝙷"
      });

    } catch (err) {
      console.error("STEALPP ERROR:", err);
      await sock.sendMessage(from, {
        text: "❌ Impossible de récupérer la photo (privée ou bloquée)"
      });
    }
  }
};
