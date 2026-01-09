// Vérifie si un JID est admin dans un groupe

async function isAdmin(participants, jid) {

  return participants.some(

    p => p.id === jid && (p.admin === "admin" || p.admin === "superadmin")

  );

}

// Tu peux exporter d'autres fonctions plus tard, par ex. pour les mutes

function setMute() { /* ... */ }

function getMute() { /* ... */ }

function addTask() { /* ... */ }

module.exports = { isAdmin, setMute, getMute, addTask };