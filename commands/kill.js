module.exports = {
    name: "kill",
    description: "Action de tuer quelqu'un",
    execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;
        const sender = msg.pushName || "Quelqu'un";
        
        // Cible
        let target = "quelqu'un";
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            target = `@${msg.message.extendedTextMessage.contextInfo.mentionedJid[0].split('@')[0]}`;
        } else if (args[0]) {
            target = args[0];
        }
        
        const kills = [
            `${sender} a assassiné ${target} avec une dague empoisonnée! ☠️`,
            `${sender} a éliminé ${target} d'un coup de sniper! 🔫`,
            `${sender} a envoyé ${target} dans l'au-delà! 👻`,
            `${target} a été sacrifié par ${sender}! ⚰️`
        ];
        
        const killMsg = kills[Math.floor(Math.random() * kills.length)];
        
        await sock.sendMessage(from, {
            text: killMsg,
            mentions: msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        });
    }
};