const { downloadContentFromMessage, generateWAMessageFromContent, proto } = require("@whiskeysockets/baileys");

const fs = require("fs");

const sharp = require("sharp"); // Pour la compression des images

const path = require("path");

module.exports = {

  name: "stickers",

  description: "Convertir une image ou GIF en sticker WhatsApp",

  execute: async (sock, msg, args) => {

    const from = msg.key.remoteJid;

    try {

      // ⚠️ Vérifier si message est une image ou view-once

      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      const imageMessage = quoted?.imageMessage || quoted?.viewOnceMessageV2?.message?.imageMessage;

      if (!imageMessage) {

        return await sock.sendMessage(from, {

          text: "❌ Réponds à une *image* ou *GIF* pour créer un sticker.\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝚃𝙴𝚇𝙷"

        });

      }

      // 🔽 Télécharger l'image

      const stream = await downloadContentFromMessage(imageMessage, "image");

      let buffer = Buffer.from([]);

      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      // 🔧 Compression pour WhatsApp

      const compressedBuffer = await sharp(buffer)

        .resize({ width: 512, height: 512, fit: "inside" })

        .webp({ quality: 80 })

        .toBuffer();

      // 📤 Envoyer le sticker

      await sock.sendMessage(from, {

        sticker: compressedBuffer,

        fileName: "sticker.webp"

      });

      console.log(`✅ Sticker créé pour ${msg.key.participant || from}`);

    } catch (err) {

      console.error("STICKER ERROR:", err);

      await sock.sendMessage(from, {

        text: "❌ Une erreur est survenue lors de la création du sticker.\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝚃𝙴𝚇𝙷"

      });

    }

  }

};