const fs = require("fs");
const path = require("path");
const { toBuffer } = require("baileys"); // ou utilitaire pour conversion image si tu as besoin

module.exports = {
  name: "sticker",
  description: "Convertir une image en sticker",
  execute: async (sock, msg, args) => {
    const from = msg.key.remoteJid;

    try {
      // Vérifier si le message contient une image ou est une réponse à une image
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imageMessage = msg.message?.imageMessage || quoted?.imageMessage;

      if (!imageMessage) {
        return await sock.sendMessage(from, {
          text: "❌ Veuillez envoyer ou répondre à une image pour créer un sticker.\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
        });
      }

      // Télécharger le contenu de l'image
      const stream = await sock.downloadMediaMessage(imageMessage, "buffer");
      if (!stream) throw new Error("Impossible de télécharger l'image.");

      // Créer le sticker (si tu utilises wa-sticker-formatter ou sharp)
      const { writeFile } = fs.promises;
      const stickerPath = path.join(__dirname, "../temp/sticker.webp");

      // Convertir en webp (sticker)
      const sharp = require("sharp");
      await sharp(stream)
        .webp({ quality: 100 })
        .toFile(stickerPath);

      // Envoyer le sticker
      await sock.sendMessage(from, {
        sticker: fs.readFileSync(stickerPath),
        fileName: "sticker.webp"
      });

      console.log(`📝 Sticker créé par ${msg.key.participant || from} > 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`);

      // Supprimer le fichier temporaire
      fs.unlinkSync(stickerPath);

    } catch (error) {
      console.error("❌ Erreur création sticker:", error);
      await sock.sendMessage(from, {
        text: "❌ Une erreur est survenue lors de la création du sticker.\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }
  }
};