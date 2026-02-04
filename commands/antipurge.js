const fs = require('fs');

const path = require('path');

// ================== CONFIG ==================

const DB_FILE = path.join(__dirname, 'antipurge.json');

// Mots-clés de purge à détecter (EXCLURE "antipurge")

const PURGE_KEYWORDS = [

  'kickall', 'kick all', 'kick-all', 'kickall',

  'purge', 'purgeall', 'purge all', 'purge-all',

  '.kickall', '.kick all', '.kick-all',

  '.purge', '.purgeall', '.purge all',

  '!kickall', '!purge', '/kickall', '/purge',

  'KICKALL', 'PURGE', 'KICK ALL', 'PURGE ALL'

];

// Mots à EXCLURE (ne pas détecter comme purge)

const EXCLUDED_KEYWORDS = [

  'antipurge', 'anti purge', 'anti-purge',

  '.antipurge', '!antipurge', '/antipurge',

  'ANTIPURGE', 'ANTI PURGE'

];

// Stockage des groupes activés

const activeGroups = new Set();

let sockInstance = null;

let isInitialized = false;

// ================== INIT DB ==================

if (!fs.existsSync(DB_FILE)) {

  fs.writeFileSync(DB_FILE, JSON.stringify({ groups: [] }, null, 2));

}

const loadDB = () => {

  try {

    const data = fs.readFileSync(DB_FILE, 'utf8');

    return JSON.parse(data);

  } catch (err) {

    console.error("❌ Erreur lecture DB antipurge:", err);

    return { groups: [] };

  }

};

const saveDB = (db) => {

  try {

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

  } catch (err) {

    console.error("❌ Erreur sauvegarde DB antipurge:", err);

  }

};

// ============================================

// 🔧 FONCTION D'INITIALISATION

// ============================================

function initAntipurgeSystem(sock) {

  if (!sock) {

    console.error("❌ Socket non fourni pour antipurge");

    return;

  }

  sockInstance = sock;

  console.log("✅ Système Antipurge initialisé");

  // Écoute des messages

  sock.ev.on('messages.upsert', async ({ messages }) => {

    try {

      const msg = messages[0];

      if (!msg.message) return;

      const from = msg.key.remoteJid;

      const sender = msg.key.participant || from;

      // Vérifier si c'est un groupe et si Antipurge est actif

      if (!from.endsWith('@g.us') || !activeGroups.has(from)) return;

      // Ignorer les messages du bot

      if (msg.key.fromMe) return;

      // Récupérer le texte du message

      let text = '';

      if (msg.message.conversation) text = msg.message.conversation;

      else if (msg.message.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;

      else if (msg.message.imageMessage?.caption) text = msg.message.imageMessage.caption;

      else if (msg.message.videoMessage?.caption) text = msg.message.videoMessage.caption;

      else if (msg.message.documentMessage?.caption) text = msg.message.documentMessage.caption;

      if (!text || text.trim() === '') return;

      // Normaliser le texte pour la comparaison

      const normalizedText = text.toLowerCase().trim();

      console.log(`🔍 Antipurge - Message: "${text}"`);

      // ===== VÉRIFICATION CRITIQUE =====

      // D'ABORD vérifier si c'est une commande antipurge (à EXCLURE)

      let isAntipurgeCommand = false;

      for (const excluded of EXCLUDED_KEYWORDS) {

        if (normalizedText.includes(excluded.toLowerCase())) {

          isAntipurgeCommand = true;

          console.log(`🔒 Message exclu: contient "${excluded}" (commande antipurge)`);

          break;

        }

      }

      // Si c'est une commande antipurge, on IGNORE

      if (isAntipurgeCommand) {

        console.log(`✅ Ignoré: Commande antipurge légitime`);

        return;

      }

      // ===== DÉTECTION DES PURGES DANGEREUSES =====

      let foundKeyword = null;

      for (const keyword of PURGE_KEYWORDS) {

        const lowerKeyword = keyword.toLowerCase();

        if (normalizedText.includes(lowerKeyword)) {

          foundKeyword = keyword;

          console.log(`🚨 Mot-clé PURGE détecté: "${keyword}"`);

          break;

        }

      }

      if (!foundKeyword) {

        // Vérification supplémentaire

        const cleanText = normalizedText.replace(/[^\w\s]/g, ' ');

        const words = cleanText.split(/\s+/);

        

        for (let i = 0; i < words.length; i++) {

          if (words[i] === 'kick' && i + 1 < words.length && words[i + 1] === 'all') {

            foundKeyword = 'kick all';

            break;

          }

          if (words[i] === 'purge' && i + 1 < words.length && words[i + 1] === 'all') {

            foundKeyword = 'purge all';

            break;

          }

        }

      }

      // Si aucun mot-clé dangereux n'est trouvé, on sort

      if (!foundKeyword) {

        console.log(`✅ Aucun mot-clé dangereux détecté`);

        return;

      }

      // ========== ACTION DE NEUTRALISATION ==========

      console.log(`🚨🚨 ALERTE ANTIPURGE: "${foundKeyword}" détecté par ${sender}`);

      // Récupérer les infos du groupe

      let groupMetadata;

      try {

        groupMetadata = await sock.groupMetadata(from);

      } catch (metaErr) {

        console.log(`❌ Erreur metadata: ${metaErr.message}`);

        return;

      }

      const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

      const participants = groupMetadata.participants;

      const groupOwner = groupMetadata.owner;

      const senderParticipant = participants.find(p => p.id === sender);

      

      // 1. SUPPRIMER LE MESSAGE DANGEREUX

      try {

        await sock.sendMessage(from, { delete: msg.key });

        console.log(`✅ Message supprimé`);

      } catch (deleteErr) {

        console.log(`⚠️ Impossible de supprimer: ${deleteErr.message}`);

      }

      // 2. EXPULSER L'AUTEUR EN PREMIER (s'il n'est pas le propriétaire)

      let authorAction = "non actionné";

      try {

        const isOwner = groupOwner === sender;

        

        if (!isOwner) {

          // Expulser l'auteur

          await sock.groupParticipantsUpdate(from, [sender], 'remove');

          authorAction = "expulsé";

          console.log(`✅ Auteur expulsé en premier: ${sender}`);

        } else {

          // Si c'est le propriétaire, le dégrader seulement

          await sock.groupParticipantsUpdate(from, [sender], 'demote');

          authorAction = "dégradé (propriétaire)";

          console.log(`✅ Propriétaire dégradé: ${sender}`);

        }

      } catch (authorErr) {

        console.log(`⚠️ Erreur avec l'auteur: ${authorErr.message}`);

        authorAction = "erreur";

        

        // Essayer la dégradation si l'expulsion échoue

        try {

          await sock.groupParticipantsUpdate(from, [sender], 'demote');

          authorAction = "dégradé (fallback)";

          console.log(`✅ Auteur dégradé à la place`);

        } catch (demoteErr) {

          console.log(`❌ Impossible de dégrader l'auteur: ${demoteErr.message}`);

        }

      }

      // 3. DÉGRADER TOUS LES ADMINS (sauf le bot et le créateur)

      let adminsDemoted = 0;

      try {

        const adminsToDemote = participants

          .filter(p => {

            // Garder le bot

            if (p.id === botId) return false;

            // Garder le créateur du groupe

            if (p.id === groupOwner) return false;

            // Garder l'auteur s'il a déjà été expulsé (inutile de le dégrader)

            if (p.id === sender && authorAction === "expulsé") return false;

            // Ne prendre que les admins

            return p.admin;

          })

          .map(p => p.id);

        if (adminsToDemote.length > 0) {

          // Dégradation par lots pour éviter les erreurs

          for (const adminId of adminsToDemote) {

            try {

              await sock.groupParticipantsUpdate(from, [adminId], 'demote');

              adminsDemoted++;

              console.log(`✅ Admin dégradé: ${adminId}`);

              

              // Petite pause pour éviter le rate limiting

              await new Promise(resolve => setTimeout(resolve, 100));

            } catch (singleErr) {

              console.log(`⚠️ Impossible de dégrader ${adminId}: ${singleErr.message}`);

            }

          }

        }

      } catch (demoteErr) {

        console.log(`⚠️ Erreur dégradation admins: ${demoteErr.message}`);

      }

      // 4. ENVOYER L'ALERTE AU GROUPE

      const senderName = sender.split('@')[0];

      const now = new Date();

      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const alertMessage = `𝐃𝐀𝐍𝐆𝐄𝐑 ☢️\n━━━━━━━━━━━━━━━━━━━━━━━\n*𝚃𝙴𝙽𝚃𝙰𝚃𝙸𝚅𝙴 𝙳𝙴 𝙳𝙴𝚂𝚃𝚁𝚄𝙲𝚃𝙸𝙾𝙽 𝙳𝚄 𝙶𝚁𝙾𝚄𝙿𝙴 𝙿𝙰𝚁 @${senderName} 𝙲𝙼𝙳 𝚝𝚊𝚙𝚎́* "${foundKeyword}"\n━━━━━━━━━━━━━━━━━━━━━━━\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`;

      try {

        await sock.sendMessage(from, {

          text: alertMessage,

          mentions: [sender]

        });

        console.log(`✅ Alerte envoyée au groupe`);

      } catch (alertErr) {

        console.log(`⚠️ Erreur alerte: ${alertErr.message}`);

      }

      // 5. ALERTE AU PROPRIÉTAIRE DU BOT

      try {

        const ownerJid = "243816107573@s.whatsapp.net"; // REMPLACEZ par votre JID

        const groupName = groupMetadata.subject || "Groupe sans nom";

        

        await sock.sendMessage(ownerJid, {

          text: `🚨 *ALERTE ANTIPURGE* 🚨

*Groupe:* ${groupName}

*ID:* ${from}

*Auteur:* ${sender}

*Commande détectée:* "${foundKeyword}"

*Message original:* "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"

*Heure:* ${new Date().toLocaleTimeString()}

*Actions prises:*

✅ Message supprimé

✅ Auteur ${authorAction}

✅ ${adminsDemoted} admin(s) révoqué(s)

Système antipurge fonctionnel.`

        });

        console.log(`✅ Propriétaire alerté`);

      } catch (ownerErr) {

        console.log(`⚠️ Impossible d'alerter propriétaire: ${ownerErr.message}`);

      }

      console.log(`✅✅✅ ATTENTION NEUTRALISÉE - Séquence complète exécutée`);

    } catch (err) {

      console.error("❌ Erreur critique antipurge:", err.message);

      console.error(err.stack);

    }

  });

  isInitialized = true;

}

// ============================================

// 💫 COMMANDE PRINCIPALE

// ============================================

async function execute(sock, msg, args, context) {

  const from = msg.key.remoteJid;

  const sender = msg.key.participant || from;

  if (!from.endsWith('@g.us')) {

    await sock.sendMessage(from, { 

      text: "❌ *Groupes seulement.*\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷" 

    });

    return;

  }

  try {

    const groupMetadata = await sock.groupMetadata(from);

    const participants = groupMetadata.participants;

    const senderParticipant = participants.find(p => p.id === sender);

    const isAdmin = senderParticipant && ['admin', 'superadmin'].includes(senderParticipant.admin);

    if (!isAdmin) {

      await sock.sendMessage(from, { 

        text: "❌ *𝚜𝚎𝚞𝚕 𝚕'𝚊𝚍𝚖𝚒𝚗 𝚙𝚎𝚞𝚝 𝚊𝚌𝚝𝚒𝚟𝚎𝚎 𝚕𝚊 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚎 𝚊𝚗𝚝𝚒𝚙𝚞𝚛𝚐𝚎*\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷" 

      });

      return;

    }

    // INITIALISATION AUTOMATIQUE si pas encore faite

    if (!isInitialized && sock) {

      initAntipurgeSystem(sock);

      console.log("✅ Antipurge auto-initialisé depuis la commande");

    }

    // Charger/sauvegarder dans la DB

    const db = loadDB();

    const isInDB = db.groups.includes(from);

    if (!args[0]) {

      const status = activeGroups.has(from) ? "🟢 *ACTIF*" : "🔴 *INACTIF*";

      const dbStatus = isInDB ? "✅ Enregistré en DB" : "⚠️ Non enregistré";

      

      await sock.sendMessage(from, {

        text: `🛡️ *SYSTÈME ANTIPURGE* 🛡️

━━━━━━━━━━━━━━━━━━━━━━━

${status}

${dbStatus}

🔍 *Mots-clés surveillés:* ${PURGE_KEYWORDS.length}

⚡ *SÉQUENCE D'ACTION:*

1️⃣ Expulsion auteur (sauf propriétaire)

2️⃣ Révocation admins (sauf bot + créateur)

3️⃣ Verrouillage complet

📋 *Commandes disponibles:*

• \`.antipurge on\` - Activer protection

• \`.antipurge off\` - Désactiver protection

• \`.antipurge status\` - Voir statut

━━━━━━━━━━━━━━━━━━━━━━━

> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

      });

      return;

    }

    const subCommand = args[0].toLowerCase();

    switch (subCommand) {

      case 'on':

        activeGroups.add(from);

        if (!isInDB) {

          db.groups.push(from);

          saveDB(db);

        }

        await sock.sendMessage(from, {

          text: `🛡️ *𝙰𝙽𝚃𝙸𝙿𝚄𝚁𝙶𝙴 𝙰𝙲𝚃𝙸𝚅𝙴*

━━━━━━━━━━━━━━━━━━━━━━━         

*Le système de protection est maintenant actif. Toute tentative de purge sera neutralisée et l auteur sera bani*.

━━━━━━━━━━━━━━━━━━━━━━━

> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷🇨🇩`

        });

        console.log(`✅ Antipurge activé pour ${from}`);

        break;

      case 'off':

        activeGroups.delete(from);

        if (isInDB) {

          db.groups = db.groups.filter(g => g !== from);

          saveDB(db);

        }

        await sock.sendMessage(from, {

          text: `🛡️ *ANTIPURGE DÉSACTIVÉ* 🛡️

━━━━━━━━━━━━━━━━━━━━━━━

❌ *PROTECTION DÉSACTIVÉE*

⚠️ *ATTENTION:*

• Groupe vulnérable aux attaques

• Commandes purge/kickall possibles

• Aucune protection automatique

🔓 Pour réactiver: \`.antipurge on\`

━━━━━━━━━━━━━━━━━━━━━━━

> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷🇨🇩`

        });

        console.log(`❌ Antipurge désactivé pour ${from}`);

        break;

      case 'status':

        const isActive = activeGroups.has(from);

        const dbActive = isInDB;

        

        let statusDetails = "";

        if (isActive && dbActive) {

          statusDetails = "✅ Pleinement actif (mémoire + DB)";

        } else if (isActive && !dbActive) {

          statusDetails = "⚠️ Actif en mémoire seulement";

        } else if (!isActive && dbActive) {

          statusDetails = "⚠️ Enregistré en DB mais inactif";

        } else {

          statusDetails = "❌ Complètement désactivé";

        }

        

        await sock.sendMessage(from, {

          text: `🛡️ *STATUT DÉTAILLÉ* 🛡️

━━━━━━━━━━━━━━━━━━━━━━━

${isActive ? "🟢 SYSTÈME ACTIF" : "🔴 SYSTÈME INACTIF"}

📊 ${statusDetails}

🔍 *Mots-clés détectés:*

${PURGE_KEYWORDS.slice(0, 8).map(k => `• ${k}`).join('\n')}...

⚡ *SÉQUENCE D'EXÉCUTION:*

1. Suppression message

2. Expulsion auteur

3. Révocation admins

4. Alerte groupe

━━━━━━━━━━━━━━━━━━━━━━━

> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

        });

        break;

      default:

        await sock.sendMessage(from, {

          text: "❌ *Commande inconnue*\n\nUsage: .antipurge on/off/status\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷"

        });

    }

  } catch (error) {

    console.error("❌ Erreur commande antipurge:", error);

    await sock.sendMessage(from, {

      text: `❌ *Erreur*\n${error.message}\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

    });

  }

}

// ============================================

// 📦 EXPORT

// ============================================

module.exports = {

  name: "antipurge",

  description: "Protection contre les purges avec séquence d'action",

  category: "admin",

  execute: execute

};
