const messageFormatter = require('../lib/messageFormatter');

const fs = require('fs');

const path = require('path');

// URLs des images avec fallbacks

const IMAGES = {

  WARNING: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWgdpht5MkFVsGN-FN58ITlSpS1ZmPiG318w584em7Hw&s=10",

  SUCCESS: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScUdCCFwMYmO3eY7zjViNBjvZ1l_NffVYwFYkuAZxMag&s=10"

};

// Fonction pour envoyer un message avec image (avec fallback)

async function sendMessageWithImage(sock, jid, imageUrl, caption, options = {}) {

  try {

    return await sock.sendMessage(jid, {

      image: { url: imageUrl },

      caption: caption,

      ...options

    });

  } catch (imageError) {

    console.log(`⚠️ Image non disponible (${imageUrl}):`, imageError.message);

    // Fallback: envoyer seulement le texte

    return await sock.sendMessage(jid, {

      text: caption,

      ...options

    });

  }

}

async function execute(sock, msg, args, context) {

  const from = msg.key.remoteJid;

  const sender = msg.key.participant || from;

  

  // Vérifier si c'est un groupe

  if (!from.endsWith('@g.us')) {

    await sock.sendMessage(from, {

      text: "❌ *Cette commande ne fonctionne que dans les groupes.*"

    });

    return;

  }

  

  try {

    // Récupérer les informations du groupe

    const groupMetadata = await sock.groupMetadata(from);

    const participants = groupMetadata.participants;

    

    // Vérifier si l'expéditeur est admin

    const senderParticipant = participants.find(p => p.id === sender);

    const isAdmin = senderParticipant && ['admin', 'superadmin'].includes(senderParticipant.admin);

    

    if (!isAdmin) {

      await sock.sendMessage(from, {

        text: "❌ *Permission refusée*\nSeuls les administrateurs peuvent utiliser cette commande."

      });

      return;

    }

    

    // Identifier les membres non-admin à expulser (exclure l'expéditeur)

    const membersToKick = participants.filter(p => !p.admin && p.id !== sender);

    

    if (membersToKick.length === 0) {

      await sock.sendMessage(from, {

        text: "ℹ️ *Aucun membre à expulser*\nIl n'y a que des administrateurs dans ce groupe."

      });

      return;

    }

    

    // Message d'avertissement avec image

    const warningMessage = `⚠️ *𝙰𝚃𝚃𝙴𝙽𝚃𝙸𝙾𝙽 𝚜𝚑𝚒𝚖𝚖𝚎𝚛 𝚍𝚎𝚝𝚎𝚌𝚝𝚎𝚎́*\n━━━━━━━━━━━━━━━━━━━━━━━\n👤 *Déclenché par:* @${sender.split('@')[0]}\n👥 *Cible:* ${membersToKick.length} membres non-admins\n👑 *Admins protégés:* ${participants.filter(p => p.admin).length}\n━━━━━━━━━━━━━━━━━━━━━━━\n⏱️ *Début dans 3 secondes...*\n\n🚫 *𝚝𝚘𝚞𝚜 𝚕𝚎𝚜 𝚖𝚎𝚖𝚋𝚛𝚎𝚜 𝚒𝚗𝚏𝚎𝚌𝚝𝚎𝚎́ 𝚜𝚎𝚛𝚘𝚗𝚝 𝚙𝚞𝚛𝚒𝚏𝚒𝚎𝚛 𝚍𝚊𝚗𝚜 2 𝚜*`;

    

    await sendMessageWithImage(sock, from, IMAGES.WARNING, warningMessage, {

      mentions: [sender]

    });

    

    // Compte à rebours

    await sleep(1000);

    await sock.sendMessage(from, { text: "⏱️ *2...*" });

    

    await sleep(1000);

    await sock.sendMessage(from, { text: "⏱️ *1...*" });

    

    await sleep(1000);

    

    // Début de l'expulsion

    await sock.sendMessage(from, {

      text: `*☣️𝙳𝚎́𝚋𝚞𝚝 𝚍𝚎 𝚕𝚊 𝚙𝚞𝚛𝚒𝚏𝚒𝚌𝚊𝚝𝚒𝚘𝚗*\n\nExpulsion de ${membersToKick.length} membres en cours...`

    });

    

    let kickedCount = 0;

    let failedCount = 0;

    

    // Expulser par lots de 4

    for (let i = 0; i < membersToKick.length; i += 4) {

      const batch = membersToKick.slice(i, i + 4);

      

      try {

        await sock.groupParticipantsUpdate(

          from,

          batch.map(m => m.id),

          "remove"

        );

        

        kickedCount += batch.length;

        

        // Mettre à jour le statut toutes les 10 expulsions

        if (kickedCount % 10 === 0) {

          await sock.sendMessage(from, {

            text: `📊 *𝚙𝚛𝚘𝚐𝚛𝚎𝚜𝚜𝚒𝚘𝚗:* ${kickedCount}/${membersToKick.length} expulsés`

          });

        }

        

        // Petite pause pour éviter le rate limiting

        await sleep(800);

        

      } catch (error) {

        failedCount += batch.length;

        console.error(`❌ Erreur expulsion batch ${i}:`, error.message);

      }

    }

    

    // Résultats finaux avec image de succès

    const remainingAdmins = participants.filter(p => p.admin).length;

    const remainingTotal = participants.length - kickedCount;

    

    const resultMessage = `✅ *𝙿𝚄𝚁𝙸𝙵𝙸𝙲𝙰𝚃𝙸𝙾𝙽 𝚃𝙴𝚁𝙼𝙸𝙽𝙴𝙴*\n━━━━━━━━━━━━━━━━━━━━━━━\n📊 *𝚜𝚝𝚊𝚝𝚒𝚜𝚝𝚒𝚚𝚞𝚎𝚜 𝚏𝚒𝚗𝚊𝚕𝚎𝚜*\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ *𝙿𝚄𝚃𝙸𝙵𝙸𝙴 𝙰𝚅𝙴𝙲 𝚂𝚄𝙲𝙲𝙴𝚂:* ${kickedCount}\n❌ *Échecs:* ${failedCount}\n👑 *𝚊𝚍𝚖𝚒𝚗𝚜 𝚛𝚎𝚜𝚝𝚊𝚗𝚝𝚜:* ${remainingAdmins}\n👥 *𝚜𝚞𝚛𝚟𝚒𝚟𝚊𝚗𝚝:* ${remainingTotal}\n━━━━━━━━━━━━━━━━━━━━━━━\n🎯 *Taux de réussite:* ${Math.round((kickedCount / membersToKick.length) * 100)}%\n\nLe groupe a été nettoyé avec succès ! 🧹\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`;

    

    await sendMessageWithImage(sock, from, IMAGES.SUCCESS, resultMessage);

    

    // Log dans la console

    console.log(`🚫 shimmers exécuté par ${sender.split('@')[0]} dans ${from}`);

    console.log(`📊 Résultats: ${kickedCount} expulsés, ${failedCount} échecs`);

    

  } catch (error) {

    console.error("❌ Erreur shimmers:", error);

    await sock.sendMessage(from, {

      text: `❌ *ERREUR CRITIQUE*\n\nL'expulsion a échoué:\n\`${error.message}\`\n\nVeuillez réessayer plus tard.`

    });

  }

}

// Fonction utilitaire pour attendre

function sleep(ms) {

  return new Promise(resolve => setTimeout(resolve, ms));

}

module.exports = {

  name: "shimmers",  // Nom de commande changé ici

  description: "Expulser automatiquement tous les membres non-admins après 3 secondes d'avertissement",

  category: "admin",

  execute: execute

};