
const isGroup = (jid) => jid.endsWith('@g.us');

const getAdmins = (participants) =>
  participants.filter(p => p.admin).map(p => p.id);

const isAdmin = (jid, admins) => admins.includes(jid);

module.exports = { isGroup, getAdmins, isAdmin };
