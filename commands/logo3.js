const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { Sticker, StickerTypes } = require("wa-sticker-formatter"); // Pour stickers

module.exports = {
  name: "logo3",
  description: "Créer un logo stylé en sticker avec texte, style et couleur",
  execute: async (sock, msg, args) => {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      return sock.sendMessage(from, {
        text: "❌ Veuillez fournir un texte pour le logo.\n\nExemple : `.logo hextech glow bleu`\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }

    const text = args[0];
    const style = args[1] || "glow"; // glow par défaut
    const color = args[2] || "blue"; // bleu par défaut

    try {
      // 🔹 Construction URL API FlamingText
      const apiUrl = `https://www6.flamingtext.com/net-fu/proxy_form.cgi?script=${encodeURIComponent(
        style + "-logo"
      )}&text=${encodeURIComponent(text)}&doScale=true&scaleWidth=800&scaleHeight=400&fontsize=120&fillTextType=solid&fillTextColor=${encodeURIComponent(
        color
      )}`;

      // Récupérer JSON avec le lien de l'image
      const response = await fetch(apiUrl);
      const json = await response.json();

      if (!json || !json.src) throw new Error("Impossible de récupérer le logo.");

      // Télécharger l'image
      const imgBuffer = await fetch(json.src).then(res => res.arrayBuffer());
      const tempPath = path.join(__dirname, "../temp/logo.png");
      fs.writeFileSync(tempPath, Buffer.from(imgBuffer));

      // 🔹 Créer sticker à partir de l'image
      const sticker = new Sticker(tempPath, {
        pack: "HEX-TECH",
        author: "Bot WhatsApp",
        type: StickerTypes.FULL,
        categories: ["🤖"],
      });

      // Envoyer le sticker
      await sock.sendMessage(from, { sticker: await sticker.toMessage() });

      console.log(
        `📝 Logo sticker créé pour ${msg.key.participant || from} | Texte: ${text}, Style: ${style}, Couleur: ${color} > 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`
      );

      // Supprimer fichier temporaire
      fs.unlinkSync(tempPath);

    } catch (err) {
      console.error("❌ Erreur création logo sticker:", err);
      await sock.sendMessage(from, {
        text: "❌ Une erreur est survenue lors de la création du logo sticker.\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }
  }
};