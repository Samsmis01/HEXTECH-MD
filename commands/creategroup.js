module.exports = {
  name: "creategroup",
  execute: async (sock, msg, args) => {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      return sock.sendMessage(from, {
        text: "⚙️ Utilisation : `.creategroup NomDuGroupe`\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }

    const name = args.join(" ");

    const group = await sock.groupCreate(name, [from.replace("@g.us", "")]);

    await sock.sendMessage(from, {
      text: `✅ Groupe créé : *${name}*\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`
    });
  }
};