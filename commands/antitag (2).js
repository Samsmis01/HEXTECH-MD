const fs = require('fs');

const path = require('path');

// ================== VARIABLES ==================

const antitagEnabledGroups = new Set();

const spamTracker = new Map();

const blacklist = new Set();

// ================== CONFIG ==================

const SPAM_LIMIT = 9;

const SPAM_WINDOW = 30_000;

// Audio situé dans le dossier commands

const AUDIO_PATH = path.join(__dirname, '152552636.mp3');

// Mots-clés à détecter (même système que Arcane)

const FORBIDDEN_WORDS = [

  'tagall', 'hidetag', 'tag all', 'hide tag', 'tag-all', 'hide-tag',

  '.tagall', '.hidetag', '.tag all', '.hide tag', '.tag-all', '.hide-tag',

  '!tagall', '!hidetag', '/tagall', '/hidetag',

  'TAGALL', 'HIDETAG', 'TAG ALL', 'HIDE TAG',

  '@everyone', '@all', 'mention all',

  'tague tout', 'mentionner tout',

  '.tague', '.mention', 'tague', 'mention'

];

// ================== UTILS ==================

const now = () => Date.now();

// ================== INITIALISATION ==================

let sockInstance = null;

let isInitialized = false;

function initAntitagSystem(sock) {

  if (!sock) {

    console.error("❌ Socket non fourni pour antitag");

    return;

  }

  sockInstance = sock;

  

  // Vérifier si l'audio existe

  if (fs.existsSync(AUDIO_PATH)) {

    console.log(`✅ Système Antitag initialisé - Audio trouvé: ${AUDIO_PATH}`);

  } else {

    console.log(`⚠️ Système Antitag initialisé - Audio introuvable: ${AUDIO_PATH}`);

    console.log(`📁 Recherche dans le dossier commands:`, fs.readdirSync(__dirname).filter(f => f.endsWith('.mp3')));

  }

  // Écoute des messages (même système que Arcane)

  sock.ev.on('messages.upsert', async ({ messages }) => {

    try {

      const msg = messages[0];

      if (!msg.message) return;

      const from = msg.key.remoteJid;

      const sender = msg.key.participant || from;

      // Vérifier si c'est un groupe et si Antitag est actif

      if (!from.endsWith('@g.us') || !antitagEnabledGroups.has(from)) return;

      // Ignorer les messages du bot

      if (msg.key.fromMe) return;

      // Récupérer le texte du message

      let text = '';

      if (msg.message.conversation) text = msg.message.conversation.toLowerCase();

      else if (msg.message.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text.toLowerCase();

      else if (msg.message.imageMessage?.caption) text = msg.message.imageMessage.caption.toLowerCase();

      else if (msg.message.videoMessage?.caption) text = msg.message.videoMessage.caption.toLowerCase();

      else if (msg.message.documentMessage?.caption) text = msg.message.documentMessage.caption.toLowerCase();

      if (!text) return;

      // Vérifier les mots interdits (même système que Arcane)

      let foundWord = null;

      for (const word of FORBIDDEN_WORDS) {

        if (text.includes(word.toLowerCase())) {

          foundWord = word;

          break;

        }

      }

      // Vérifier les mentions

      let hasAnyMention = false;

      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid && 

          msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {

        hasAnyMention = true;

      }

      // Vérifier les faux tags

      const fakeTagDetected = /@\d{8,}/.test(text);

      // Si rien n'est détecté, on sort

      if (!foundWord && !hasAnyMention && !fakeTagDetected) {

        return;

      }

      console.log(`[ANTITAG] Détection: Mot="${foundWord}" Mention=${hasAnyMention} FauxTag=${fakeTagDetected}`);

      // ANTI-SPAM (même système que Arcane)

      const key = `${from}:${sender}`;

      const history = spamTracker.get(key) || [];

      const filtered = history.filter(t => now() - t < SPAM_WINDOW);

      filtered.push(now());

      spamTracker.set(key, filtered);

      if (filtered.length >= SPAM_LIMIT) {

        blacklist.add(sender);

        await sock.sendMessage(from, {

          text: `🚫 @${sender.split('@')[0]} tu abuses du tag.\nTu es maintenant ignoré.`,

          mentions: [sender]

        });

        return;

      }

      // ENVOI AUDIO (SEULEMENT NON-PTT)

      let audioSent = false;

      if (fs.existsSync(AUDIO_PATH)) {

        console.log('[ANTITAG] Fichier audio trouvé, envoi non-PTT...');

        

        try {

          const audioBuffer = fs.readFileSync(AUDIO_PATH);

          const stats = fs.statSync(AUDIO_PATH);

          const fileSizeMB = stats.size / (1024 * 1024);

          

          console.log(`[ANTITAG] Taille audio: ${fileSizeMB.toFixed(2)}MB`);

          

          if (fileSizeMB <= 16) {

            // ENVOI SEULEMENT EN NON-PTT

            await sock.sendMessage(from, {

              audio: audioBuffer,

              mimetype: 'audio/mpeg',

              ptt: false // NON-PTT seulement

            });

            audioSent = true;

            console.log('[ANTITAG] ✅ Audio non-PTT envoyé!');

          } else {

            console.log('[ANTITAG] Audio trop volumineux (>16MB)');

          }

        } catch (audioError) {

          console.error('[ANTITAG] ❌ Erreur audio:', audioError.message);

        }

      } else {

        console.log(`[ANTITAG] ❌ Fichier audio introuvable: ${AUDIO_PATH}`);

        console.log(`[ANTITAG] 📁 Fichiers disponibles dans commands:`, fs.readdirSync(__dirname).filter(f => f.endsWith('.mp3')));

      }

      // ENVOI TEXTE "NO TAG ME!"

      let mentionedPeople = [];

      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {

        mentionedPeople = msg.message.extendedTextMessage.contextInfo.mentionedJid

          .filter(jid => jid !== sender)

          .slice(0, 5);

      }

      let tagType = '';

      if (foundWord) tagType = `COMMANDE "${foundWord}"`;

      else if (hasAnyMention) tagType = 'TAG DE PERSONNE';

      else if (fakeTagDetected) tagType = 'FAUX TAG';

      const senderName = sender.split('@')[0];

      

      // Message 

      let responseText = `🎭*TAG DÉTECTÉ* > 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷🇨🇩`;

      await sock.sendMessage(from, {

        text: responseText,

        mentions: [sender, ...mentionedPeople]

      });

      console.log('[ANTITAG] ✅ Réponse "NO TAG ME!" envoyée!');

    } catch (err) {

      console.error('[ANTITAG] ❌ Erreur globale:', err);

    }

  });

  isInitialized = true;

}

// ================== COMMANDES ==================

async function execute(sock, msg, args, context) {

  try {

    const from = msg.key.remoteJid;

    const sender = msg.key.participant || from;

    if (!from.endsWith('@g.us')) {

      await sock.sendMessage(from, { 

        text: "❌ *Groupes seulement.*\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷" 

      });

      return;

    }

    // SUPPRESSION DE LA VÉRIFICATION ADMIN - ANTITAG EST PUBLIC

    // Tous les membres peuvent utiliser les commandes antitag

    // INITIALISATION AUTOMATIQUE si pas encore faite

    if (!isInitialized && sock) {

      initAntitagSystem(sock);

      console.log("✅ Antitag auto-initialisé depuis la commande");

    }

    if (!args[0]) {

      const status = antitagEnabledGroups.has(from) ? "🟢 *ACTIF*" : "🔴 *INACTIF*";

      const audioExists = fs.existsSync(AUDIO_PATH);

      const audioStatus = audioExists ? "✅ Audio disponible" : "❌ Audio introuvable";

      

      // Lister les fichiers MP3 dans le dossier commands

      const mp3Files = fs.readdirSync(__dirname).filter(f => f.endsWith('.mp3'));

      const audioList = mp3Files.length > 0 ? mp3Files.join(', ') : 'Aucun fichier MP3';

      

      await sock.sendMessage(from, {

        text: `🚫 *SYSTÈME ANTITAG "NO TAG ME!"*\n━━━━━━━━━━━━━━━━━━━━━━━\n${status}\n${audioStatus}\n📁 *Fichiers audio:* ${audioList}\n📊 *Mots détectés:* ${FORBIDDEN_WORDS.length}\n👥 *Blacklist:* ${blacklist.size} membres\n━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 *Commandes:*\n• .antitag on - Activer (public)\n• .antitag off - Désactiver (public)\n• .antitag status - Statut\n• .antitag test - Tester\n• .antitag blacklist - Liste noire\n• .antitag audio - Tester audio\n━━━━━━━━━━━━━━━━━━━━━━━\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

      });

      return;

    }

    const subCommand = args[0].toLowerCase();

    switch (subCommand) {

      case 'on':

        antitagEnabledGroups.add(from);

        await sock.sendMessage(from, {

          text: `🚫 *ANTITAG ACTIVÉ*\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

        });

        console.log(`✅ Antitag activé pour ${from} (par ${sender})`);

        break;

      case 'off':

        antitagEnabledGroups.delete(from);

        await sock.sendMessage(from, {

          text: `🚫 *ANTITAG DÉSACTIVÉ*\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

        });

        console.log(`❌ Antitag désactivé pour ${from} (par ${sender})`);

        break;

      case 'status':

        const isActive = antitagEnabledGroups.has(from);

        const audioExists = fs.existsSync(AUDIO_PATH);

        

        // Lister tous les fichiers MP3

        const allMp3Files = fs.readdirSync(__dirname).filter(f => f.endsWith('.mp3'));

        const filesList = allMp3Files.length > 0 

          ? allMp3Files.map(f => `• ${f}`).join('\n')

          : '• Aucun fichier MP3';

        

        let statusDetails = `📊 *STATUT DÉTAILLÉ ANTITAG*\n━━━━━━━━━━━━━━━━━━━━━━━\n`;

        statusDetails += `${isActive ? "🟢 SYSTÈME ACTIF" : "🔴 SYSTÈME INACTIF"}\n`;

        statusDetails += `${audioExists ? "✅ Audio disponible" : "❌ Audio introuvable"}\n`;

        statusDetails += `📈 Groupes actifs: ${antitagEnabledGroups.size}\n`;

        statusDetails += `🚫 Blacklist: ${blacklist.size} membres\n`;

        statusDetails += `🔍 Mots détectés: ${FORBIDDEN_WORDS.length}\n`;

        statusDetails += `📁 Fichiers MP3:\n${filesList}\n`;

        statusDetails += `━━━━━━━━━━━━━━━━━━━━━━━\n`;

        statusDetails += `*CHEMIN AUDIO:*\n${AUDIO_PATH}\n`;

        statusDetails += `━━━━━━━━━━━━━━━━━━━━━━━\n`;

        statusDetails += `*PRINCIPAUX MOTS-CLÉS:*\n`;

        statusDetails += FORBIDDEN_WORDS.slice(0, 8).map(k => `• ${k}`).join('\n');

        statusDetails += `...\n━━━━━━━━━━━━━━━━━━━━━━━\n`;

        statusDetails += `> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`;

        

        await sock.sendMessage(from, { text: statusDetails });

        break;

      case 'test':

        // Tester le système

        await sock.sendMessage(from, {

          text: `🚫 *TEST ANTITAG*\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ *SYSTÈME OPÉRATIONNEL*\n\n*TESTEZ AVEC:*\n• .tagall (commande)\n• @quelquun (mention)\n• tag all (texte)\n• @123456789 (faux tag)\n\n*RÉPONSE ATTENDUE:*\n"NO TAG ME!" + Audio non-PTT\n\n*FICHIER AUDIO:*\n152552636.mp3\n━━━━━━━━━━━━━━━━━━━━━━━\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

        });

        break;

      case 'blacklist':

        const blacklistText = [...blacklist].map(jid => `• @${jid.split('@')[0]}`).join('\n') || 'Liste vide';

        await sock.sendMessage(from, {

          text: `🚫 *LISTE NOIRE*\n━━━━━━━━━━━━━━━━━━━━━━━\n${blacklistText}\n━━━━━━━━━━━━━━━━━━━━━━━\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

        });

        break;

      case 'audio':

        // Tester l'audio

        if (fs.existsSync(AUDIO_PATH)) {

          try {

            const audioBuffer = fs.readFileSync(AUDIO_PATH);

            const stats = fs.statSync(AUDIO_PATH);

            const fileSizeMB = stats.size / (1024 * 1024);

            

            await sock.sendMessage(from, {

              audio: audioBuffer,

              mimetype: 'audio/mpeg',

              ptt: false // NON-PTT seulement

            });

            

            await sock.sendMessage(from, {

              text: `🎵 *TEST AUDIO*\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ Audio envoyé (non-PTT)\n📁 *Fichier:* 152552636.mp3\n📊 *Taille:* ${fileSizeMB.toFixed(2)} MB\n📂 *Chemin:* ${AUDIO_PATH}\n━━━━━━━━━━━━━━━━━━━━━━━\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

            });

          } catch (err) {

            await sock.sendMessage(from, {

              text: `❌ *ERREUR AUDIO*\n${err.message}\n\n*Chemin:* ${AUDIO_PATH}\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

            });

          }

        } else {

          // Lister les fichiers disponibles

          const availableFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.mp3'));

          const filesMsg = availableFiles.length > 0 

            ? `Fichiers disponibles:\n${availableFiles.map(f => `• ${f}`).join('\n')}`

            : 'Aucun fichier MP3 trouvé';

            

          await sock.sendMessage(from, {

            text: `❌ *FICHIER INTROUVABLE*\n━━━━━━━━━━━━━━━━━━━━━━━\n*Chemin recherché:*\n${AUDIO_PATH}\n\n${filesMsg}\n━━━━━━━━━━━━━━━━━━━━━━━\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

          });

        }

        break;

      default:

        await sock.sendMessage(from, {

          text: "❌ *Commande inconnue*\n\nUsage: .antitag on/off/status/test/blacklist/audio\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷"

        });

    }

  } catch (error) {

    console.error('[ANTITAG] Erreur:', error);

    await sock.sendMessage(from, {

      text: `❌ *Erreur*\n${error.message}\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

    });

  }

}

// ================== MODULE ==================

const antitagModule = {

  name: 'antitag',

  description: 'Protection contre les tags massifs - NO TAG ME! (Public)',

  category: 'public',

  execute: execute,

  initAntitagSystem: initAntitagSystem

};

module.exports = antitagModule;