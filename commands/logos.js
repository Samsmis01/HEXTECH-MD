const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  name: "logos",
  description: "Créer un logo avec le texte fourni",
  execute: async (sock, msg, args) => {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      return await sock.sendMessage(from, {
        text: "⚠️ Utilisation : `.logo <texte>`\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }

    const text = args.join(" ").toUpperCase();
    const width = 800;
    const height = 400;

    try {
      // Créer un canvas
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Fond blanc ou tu peux mettre une image de fond
      ctx.fillStyle = "#ffffff"; 
      ctx.fillRect(0, 0, width, height);

      // Exemple : si tu veux un background image
      // const background = await loadImage(path.join(__dirname, "../assets/bg.png"));
      // ctx.drawImage(background, 0, 0, width, height);

      // Texte
      ctx.fillStyle = "#1E90FF"; // Bleu
      ctx.font = "bold 80px Sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, width / 2, height / 2);

      // Convertir en buffer
      const buffer = canvas.toBuffer("image/png");

      await sock.sendMessage(from, {
        image: buffer,
        caption: `🎨 Logo généré pour : ${text}\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`
      });

      console.log(`📝 Logo généré pour ${msg.key.participant || from}: ${text} > 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`);
    } catch (err) {
      console.error("❌ Erreur logo:", err);
      await sock.sendMessage(from, {
        text: "❌ Impossible de générer le logo.\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }
  }
};