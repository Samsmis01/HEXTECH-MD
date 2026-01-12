module.exports = {
  name: "add",
  execute: async (sock, msg, args) => {
    const from = msg.key.remoteJid;

    if (!args[0]) return;

    const user = args[0].replace(/\D/g, "") + "@s.whatsapp.net";

    await sock.groupParticipantsUpdate(from, [user], "add");

    await sock.sendMessage(from, {
      text: `✅ @${args[0]} ajouté`,
      mentions: [user]
    });
  }
};