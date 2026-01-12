const fs = require("fs");

module.exports = {
  name: "help",
  description: "Afficher le menu avec boutons reply",
  execute: async (sock, msg, args) => {
    const from = msg.key.remoteJid;

    // 📋 Les boutons
    const buttons = [
      { buttonId: ".fakerecording on", buttonText: { displayText: "🎙️ Fake ON" }, type: 1 },
      { buttonId: ".fakerecording off", buttonText: { displayText: "🎙️ Fake OFF" }, type: 1 },
      { buttonId: ".viewonce", buttonText: { displayText: "👁️ Voir view-once" }, type: 1 },
      { buttonId: ".music", buttonText: { displayText: "🎵 Musique" }, type: 1 },
      { buttonId: ".sticker", buttonText: { displayText: "🖼️ Sticker" }, type: 1 }
    ];

    // 📝 Message avec boutons
    const buttonMessage = {
      text: "💫 *HexTech WhatsApp Bot - Menu* 💫\n\nChoisis une commande ci-dessous :",
      footer: "> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴",
      buttons: buttons,
      headerType: 1
    };

    try {
      await sock.sendMessage(from, buttonMessage);
    } catch (error) {
      console.log("⚠️ Erreur lors de l'envoi du menu help:", error.message);
    }
  }
};