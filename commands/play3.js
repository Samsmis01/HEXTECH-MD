const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "play3",
  description: "Télécharger de la musique depuis YouTube avec info et miniature",
  execute: async (sock, msg, args) => {
    const from = msg.key.remoteJid;

    if (!args.length) {
      return sock.sendMessage(from, {
        text: "❌ Veuillez fournir le nom ou titre de la musique.\n\nExemple : `.play David liberté`\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }

    const query = args.join(" ");
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    try {
      // 1️⃣ Récupération des infos de la vidéo (JSON)
      const infoCmd = `yt-dlp -j "ytsearch1:${query}"`;
      exec(infoCmd, async (err, stdout, stderr) => {
        if (err || !stdout) {
          console.error("❌ Erreur récupération info musique:", err);
          return sock.sendMessage(from, { text: `❌ Impossible de trouver la musique.\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴` });
        }

        const info = JSON.parse(stdout);
        const title = info.title.replace(/[\\\/:*?"<>|]/g, ""); // nettoyer le nom
        const uploader = info.uploader || "Inconnu";
        const duration = info.duration ? `${Math.floor(info.duration/60)}m ${info.duration%60}s` : "N/A";
        const thumbnail = info.thumbnail;

        // 2️⃣ Envoyer info + miniature avant téléchargement
        await sock.sendMessage(from, {
          image: { url: thumbnail },
          caption: `🎵 *Titre:* ${title}\n👤 *Artiste:* ${uploader}\n⏱ *Durée:* ${duration}\n🔄 Téléchargement en cours...`
        });

        // 3️⃣ Télécharger la musique
        const fileName = path.join(tempDir, `${title}.mp3`);
        const dlCmd = `yt-dlp -x --audio-format mp3 -o "${fileName}" "ytsearch1:${query}"`;

        exec(dlCmd, async (err2, stdout2, stderr2) => {
          if (err2 || !fs.existsSync(fileName)) {
            console.error("❌ Erreur téléchargement musique:", err2);
            return sock.sendMessage(from, { text: `❌ Échec du téléchargement.\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴` });
          }

          // 4️⃣ Envoyer le mp3
          await sock.sendMessage(from, {
            audio: fs.readFileSync(fileName),
            mimetype: "audio/mpeg",
            ptt: false
          });

          console.log(`🎶 Musique envoyée : ${title} > 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`);

          // 5️⃣ Supprimer le fichier temporaire
          fs.unlinkSync(fileName);
        });
      });

    } catch (error) {
      console.error("❌ Erreur command play:", error);
      await sock.sendMessage(from, { text: `❌ Une erreur est survenue.\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴` });
    }
  }
};