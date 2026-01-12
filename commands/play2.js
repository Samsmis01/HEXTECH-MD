const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "play2",
  description: "Télécharger de la musique depuis YouTube / Tubidy",
  execute: async (sock, msg, args) => {
    const from = msg.key.remoteJid;

    if (!args.length) {
      return sock.sendMessage(from, {
        text:
          "❌ Veuillez fournir le nom ou titre de la musique.\n\nExemple : `.play David liberté`\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }

    const query = args.join(" ");
    const fileName = `./temp/${Date.now()}.mp3`;

    try {
      await sock.sendMessage(from, {
        text: `🎵 Recherche et téléchargement de : *${query}*\nVeuillez patienter...`
      });

      // Commande yt-dlp pour télécharger en mp3
      const cmd = `yt-dlp -x --audio-format mp3 -o "${fileName}" "ytsearch1:${query}"`;

      exec(cmd, async (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Erreur téléchargement musique:", error);
          return sock.sendMessage(from, {
            text: `❌ Impossible de télécharger la musique.\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`
          });
        }

        if (!fs.existsSync(fileName)) {
          return sock.sendMessage(from, {
            text: `❌ Fichier introuvable après téléchargement.\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`
          });
        }

        // Envoyer le fichier mp3
        await sock.sendMessage(from, {
          audio: fs.readFileSync(fileName),
          mimetype: "audio/mpeg",
          ptt: false
        });

        console.log(`🎶 Musique envoyée : ${query} > 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`);

        // Supprimer le fichier temporaire
        fs.unlinkSync(fileName);
      });

    } catch (err) {
      console.error("❌ Erreur play command:", err);
      await sock.sendMessage(from, {
        text: `❌ Une erreur est survenue.\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`
      });
    }
  }
};