const { isAdmin } = require("../lib"); // Vérifie si un membre est admin

const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {

  name: "delpromote",

  description: "Retirer le statut d'admin d'un membre du groupe",

  execute: async (sock, msg, args) => {

    const from = msg.key.remoteJid;

    // ✅ Vérification que c'est un groupe

    if (!from.endsWith("@g.us")) {

      return await sock.sendMessage(from, {

        text: "❌ Cette commande est réservée aux groupes."

      });

    }

    // 🔹 Récupérer les métadonnées du groupe

    const metadata = await sock.groupMetadata(from);

    const participants = metadata.participants || [];

    // 🔐 Vérifier que l'expéditeur est admin

    const senderJid = msg.key.participant || msg.key.remoteJid;

    if (!isAdmin(participants, senderJid)) {

      return await sock.sendMessage(from, {

        text: "☣️ Seuls les admins peuvent retirer un admin."

      });

    }

    // 🤖 Vérifier que le bot est admin

    const botJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";

    if (!isAdmin(participants, botJid)) {

      return await sock.sendMessage(from, {

        text: "☣️ Je dois être admin pour retirer un admin."

      });

    }

    // ⚠️ Vérifier si un membre est mentionné

    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (!mentioned || mentioned.length === 0) {

      return await sock.sendMessage(from, {

        text: "⚠️ Mentionne la personne que tu veux rétrograder.\nExemple : `.delpromote @numero`"

      });

    }

    try {

      // Rétrograder chaque membre mentionné

      for (const jid of mentioned) {

        await sock.groupParticipantsUpdate(from, [jid], "demote");

        await delay(1000);

      }

      await sock.sendMessage(from, {

        text: `✅ ${mentioned.map(j => j.split("@")[0]).join(", ")} rétrogradé(s) admin avec succès !`

      });

    } catch (err) {

      console.error("DELPROMOTE ERROR:", err);

      await sock.sendMessage(from, {

        text: "❌ Une erreur est survenue lors de la rétrogradation."

      });

    }

  }

};