const fs = require("fs");

const path = require("path");

const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {

  name: "sauv",

  description: "Sauvegarde et renvoie image ou vidéo",

  async execute(sock, msg) {

    try {

      const from = msg.key.remoteJid;

      const quoted =

        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted) {

        return await sock.sendMessage(

          from,

          { text: "❌ Réponds à une image ou une vidéo avec `.sauv`" },

          { quoted: msg }

        );

      }

      let mediaType;

      let mediaMsg;

      let extension;

      // 📸 IMAGE

      if (quoted.imageMessage) {

        mediaType = "image";

        mediaMsg = quoted.imageMessage;

        extension = "jpg";

      }

      // 🎥 VIDÉO

      else if (quoted.videoMessage) {

        mediaType = "video";

        mediaMsg = quoted.videoMessage;

        extension = "mp4";

      } else {

        return await sock.sendMessage(

          from,

          { text: "❌ Type non supporté (image ou vidéo uniquement)" },

          { quoted: msg }

        );

      }

      // 📁 dossier de sauvegarde

      const saveDir = path.join(__dirname, `../saved_${mediaType}s`);

      if (!fs.existsSync(saveDir)) {

        fs.mkdirSync(saveDir, { recursive: true });

      }

      // ⬇️ téléchargement média

      const stream = await downloadContentFromMessage(mediaMsg, mediaType);

      let buffer = Buffer.from([]);

      for await (const chunk of stream) {

        buffer = Buffer.concat([buffer, chunk]);

      }

      const fileName = `${mediaType}_${Date.now()}.${extension}`;

      const filePath = path.join(saveDir, fileName);

      fs.writeFileSync(filePath, buffer);

      // 📤 RENVOI DANS WHATSAPP

      await sock.sendMessage(

        from,

        {

          [mediaType]: buffer,

          caption:

            `${mediaType === "image" ? "🖼️ Image" : "🎥 Vidéo"} téléchargée ✅\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

        },

        { quoted: msg }

      );

      // 😉 réaction

      await sock.sendMessage(from, {

        react: { text: "😉", key: msg.key }

      });

    } catch (err) {

      console.error("❌ Erreur .sauv :", err);

      await sock.sendMessage(

        msg.key.remoteJid,

        { text: "❌ Erreur lors du téléchargement" },

        { quoted: msg }

      );

    }

  }

};