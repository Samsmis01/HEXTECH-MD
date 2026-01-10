const fs = require("fs");

const path = require("path");

// Chemin vers le fichier qui stocke les sudoers

const sudoPath = path.join(__dirname, "../sudoers.json");

// Fonction pour charger la liste

function loadSudoers() {

  if (!fs.existsSync(sudoPath)) return [];

  return JSON.parse(fs.readFileSync(sudoPath, "utf-8"));

}

// Fonction pour sauvegarder la liste

function saveSudoers(list) {

  fs.writeFileSync(sudoPath, JSON.stringify(list, null, 2));

}

module.exports = {

  name: "sudoadd",

  description: "Ajouter un utilisateur à la liste des sudoers",

  execute: async (sock, msg, args) => {

    const from = msg.key.remoteJid;

    const sender = msg.key.participant || msg.key.remoteJid;

    if (!args[0]) {

      return await sock.sendMessage(from, {

        text: "⚙️ Utilisation : `.sudoadd 243XXXXXXXXX`"

      });

    }

    let sudoers = loadSudoers();

    const jid = args[0].replace(/\D/g, "") + "@s.whatsapp.net";

    if (sudoers.includes(jid)) {

      return await sock.sendMessage(from, {

        text: "✅ Cet utilisateur est déjà sudoer"

      });

    }

    sudoers.push(jid);

    saveSudoers(sudoers);

    await sock.sendMessage(from, {

      text: `🎉 Utilisateur ajouté à la liste des sudoers : ${jid}`

    });

    console.log(`📝 ${sender} a ajouté ${jid} aux sudoers`);

  }

};