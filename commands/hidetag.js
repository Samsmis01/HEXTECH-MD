module.exports = {
  name: "hidetag",
  groupOnly: true,
  execute: async (sock, msg, args) => {
    const text = args.join(" ") || "📢";
    const metadata = await sock.groupMetadata(msg.key.remoteJid);
    const mentions = metadata.participants.map(p => p.id);

    await sock.sendMessage(msg.key.remoteJid, {
      text,
      mentions
    });
  }
};