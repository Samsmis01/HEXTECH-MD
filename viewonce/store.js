const fs = require("fs");

const path = require("path");

// 📁 Chemin pour stocker les vues uniques

const STORE_PATH = path.join(__dirname, "viewonce.json");

// Si le fichier n'existe pas, le créer

if (!fs.existsSync(STORE_PATH)) {

  fs.writeFileSync(STORE_PATH, JSON.stringify({}));

}

/**

 * 💾 Sauvegarde une vue unique interceptée

 * @param {string} jid - JID du groupe ou contact

 * @param {object} data - { type: "image"|"video", buffer: base64, caption, from, time }

 */

function saveViewOnce(jid, data) {

  const db = JSON.parse(fs.readFileSync(STORE_PATH));

  if (!db[jid]) db[jid] = [];

  db[jid].push(data);

  fs.writeFileSync(STORE_PATH, JSON.stringify(db, null, 2));

}

/**

 * 📤 Récupère la dernière vue unique interceptée pour un JID

 * @param {string} jid

 * @returns {object|null} Dernière vue unique ou null si aucune

 */

function getLastViewOnce(jid) {

  const db = JSON.parse(fs.readFileSync(STORE_PATH));

  if (!db[jid] || db[jid].length === 0) return null;

  return db[jid][db[jid].length - 1];

}

/**

 * 🔍 Récupère tout l’historique des vues uniques pour un JID

 * @param {string} jid

 * @returns {array} Tableau des vues uniques

 */

function getAllViewOnce(jid) {

  const db = JSON.parse(fs.readFileSync(STORE_PATH));

  if (!db[jid]) return [];

  return db[jid];

}

module.exports = { saveViewOnce, getLastViewOnce, getAllViewOnce };