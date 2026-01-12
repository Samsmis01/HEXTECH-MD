const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "logo2",
  description: "Créer un logo stylé à partir d’un texte",
  execute: async (sock, msg, args) => {
    const from = msg.key.remoteJid;

    // Vérifier si l'utilisateur a fourni du texte
    if (!args[0]) {
      return sock.sendMessage(from, {
        text: "❌ Veuillez fournir un texte pour le logo.\n\nExemple : `.logo hextech`\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }

    const text = args.join(" ");

    try {
      // 🔹 Générer le logo via FlamingText API (exemple)
      const apiUrl = `https://www6.flamingtext.com/net-fu/proxy_form.cgi?script=glow-logo&text=${encodeURIComponent(text)}&doScale=true&scaleWidth=800&scaleHeight=400&fontsize=120`;
      
      const response = await fetch(apiUrl);
      const json = await response.json();

      if (!json || !json.src) throw new Error("Impossible de récupérer le logo.");

      // Télécharger l'image
      const logoBuffer = await fetch(json.src).then(res => res.arrayBuffer());
      const tempPath = path.join(__dirname, "../temp/logo.png");
      fs.writeFileSync(tempPath, Buffer.from(logoBuffer));

      // Envoyer le logo
      await sock.sendMessage(from, {
        image: fs.readFileSync(tempPath),
        caption: `🎨 Logo généré pour : *${text}*\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`
      });

      console.log(`📝 Logo créé pour ${msg.key.participant || from} > 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`);

      // Supprimer le fichier temporaire
      fs.unlinkSync(tempPath);

    } catch (err) {
      console.error("❌ Erreur création logo:", err);
      await sock.sendMessage(from, {
        text: "❌ Une erreur est survenue lors de la création du logo.\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }
  }
};