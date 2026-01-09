// 📁 FICHIER: ownerManager.js - GESTION DU PROPRIÉTAIRE DU BOT

const fs = require('fs').promises;

const path = require('path');

class OwnerManager {

    constructor() {

        this.ownerFile = './config/owner.json';

        this.ownerData = {

            ownerNumber: null,

            ownerName: 'Administrateur',

            authorizedNumbers: [],

            settings: {

                autoBackup: true,

                maxGroups: 50,

                commandLogs: true,

                debugMode: false

            },

            stats: {

                commandsUsed: 0,

                groupsManaged: 0,

                uptime: 0,

                lastBackup: null

            }

        };

        

        this.init();

    }

    

    async init() {

        try {

            await fs.mkdir(path.dirname(this.ownerFile), { recursive: true });

            

            if (await this.fileExists(this.ownerFile)) {

                const data = await fs.readFile(this.ownerFile, 'utf8');

                this.ownerData = JSON.parse(data);

                console.log('✅ Configuration owner chargée');

            } else {

                await this.saveData();

                console.log('📁 Fichier owner créé');

            }

        } catch (error) {

            console.error('❌ Erreur initialisation owner:', error);

        }

    }

    

    async fileExists(filePath) {

        try {

            await fs.access(filePath);

            return true;

        } catch {

            return false;

        }

    }

    

    async saveData() {

        try {

            await fs.writeFile(this.ownerFile, JSON.stringify(this.ownerData, null, 2));

        } catch (error) {

            console.error('❌ Erreur sauvegarde owner:', error);

        }

    }

    

    // 🔐 VÉRIFICATION DES PERMISSIONS

    isOwner(jid) {

        if (!jid) return false;

        

        const cleanJid = jid.split('@')[0];

        

        // Vérifier si c'est le propriétaire principal

        if (this.ownerData.ownerNumber && cleanJid.includes(this.ownerData.ownerNumber)) {

            return true;

        }

        

        // Vérifier les numéros autorisés

        return this.ownerData.authorizedNumbers.some(num => cleanJid.includes(num));

    }

    

    isAdminInGroup(msg) {

        // Vérifier si l'utilisateur est admin dans le groupe

        try {

            const participant = msg.key.participant || msg.key.remoteJid;

            // Cette vérification dépend de votre implémentation des groupes

            // À adapter selon votre code

            return false;

        } catch {

            return false;

        }

    }

    

    // 👑 COMMANDES OWNER

    async handleOwnerCommand(msg, command, args) {

        const from = msg.key.remoteJid;

        const userJid = msg.key.participant || from;

        

        if (!this.isOwner(userJid)) {

            return { success: false, message: '❌ Accès réservé au propriétaire.' };

        }

        

        switch(command) {

            case '.setowner':

                return await this.setOwnerNumber(args[0], msg.pushName);

                

            case '.addadmin':

                return await this.addAuthorizedNumber(args[0]);

                

            case '.removeadmin':

                return await this.removeAuthorizedNumber(args[0]);

                

            case '.listadmins':

                return await this.listAuthorizedNumbers();

                

            case '.backup':

                return await this.createBackup();

                

            case '.stats':

                return await this.showStats();

                

            case '.settings':

                return await this.updateSettings(args);

                

            case '.restart':

                return await this.restartBot();

                

            case '.broadcast':

                return await this.broadcastMessage(args.join(' '));

                

            case '.eval':

                return await this.evaluateCode(args.join(' '));

                

            default:

                return { success: false, message: '❌ Commande owner inconnue.' };

        }

    }

    

    // 📱 DÉFINIR LE PROPRIÉTAIRE

    async setOwnerNumber(number, name) {

        if (!number) {

            return { success: false, message: '❌ Numéro requis: .setowner 1234567890' };

        }

        

        this.ownerData.ownerNumber = number.replace(/\D/g, '');

        this.ownerData.ownerName = name || 'Propriétaire';

        

        await this.saveData();

        

        return {

            success: true,

            message: `✅ Propriétaire défini:\n📱 ${this.ownerData.ownerNumber}\n👤 ${this.ownerData.ownerName}`

        };

    }

    

    // 👥 AJOUTER UN ADMIN

    async addAuthorizedNumber(number) {

        if (!number) {

            return { success: false, message: '❌ Numéro requis: .addadmin 1234567890' };

        }

        

        const cleanNumber = number.replace(/\D/g, '');

        

        if (this.ownerData.authorizedNumbers.includes(cleanNumber)) {

            return { success: false, message: '❌ Ce numéro est déjà admin.' };

        }

        

        this.ownerData.authorizedNumbers.push(cleanNumber);

        await this.saveData();

        

        return {

            success: true,

            message: `✅ Admin ajouté:\n📱 ${cleanNumber}\n👥 Total: ${this.ownerData.authorizedNumbers.length}`

        };

    }

    

    // 🗑️ RETIRER UN ADMIN

    async removeAuthorizedNumber(number) {

        if (!number) {

            return { success: false, message: '❌ Numéro requis: .removeadmin 1234567890' };

        }

        

        const cleanNumber = number.replace(/\D/g, '');

        const index = this.ownerData.authorizedNumbers.indexOf(cleanNumber);

        

        if (index === -1) {

            return { success: false, message: '❌ Numéro non trouvé.' };

        }

        

        this.ownerData.authorizedNumbers.splice(index, 1);

        await this.saveData();

        

        return {

            success: true,

            message: `✅ Admin retiré:\n📱 ${cleanNumber}\n👥 Restants: ${this.ownerData.authorizedNumbers.length}`

        };

    }

    

    // 📋 LISTER LES ADMINS

    async listAuthorizedNumbers() {

        const admins = this.ownerData.authorizedNumbers.map((num, idx) => 

            `${idx + 1}. ${num}`

        ).join('\n');

        

        return {

            success: true,

            message: `👥 *LISTE DES ADMINS*\n\n` +

                     `👑 Propriétaire:\n${this.ownerData.ownerNumber} (${this.ownerData.ownerName})\n\n` +

                     `📱 Admins autorisés:\n${admins || 'Aucun'}\n\n` +

                     `⚙️ *Total:* ${this.ownerData.authorizedNumbers.length} admin(s)`

        };

    }

    

    // 💾 CRÉER UN BACKUP

    async createBackup() {

        try {

            const backupDir = './backups/';

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

            

            await fs.mkdir(backupDir, { recursive: true });

            

            const backupData = {

                ...this.ownerData,

                backupDate: new Date().toISOString()

            };

            

            await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));

            

            this.ownerData.stats.lastBackup = new Date().toISOString();

            await this.saveData();

            

            return {

                success: true,

                message: `✅ Backup créé:\n📁 ${backupFile}\n📅 ${new Date().toLocaleString('fr-FR')}`

            };

            

        } catch (error) {

            console.error('❌ Erreur backup:', error);

            return { success: false, message: '❌ Erreur création backup.' };

        }

    }

    

    // 📊 AFFICHER LES STATS

    async showStats() {

        const uptime = process.uptime();

        const hours = Math.floor(uptime / 3600);

        const minutes = Math.floor((uptime % 3600) / 60);

        

        return {

            success: true,

            message: `📊 *STATISTIQUES BOT*\n\n` +

                     `🤖 *Bot:*\n` +

                     `• Uptime: ${hours}h ${minutes}m\n` +

                     `• Commandes exécutées: ${this.ownerData.stats.commandsUsed}\n` +

                     `• Groupes managés: ${this.ownerData.stats.groupsManaged}\n\n` +

                     `👑 *Owner:*\n` +

                     `• Nom: ${this.ownerData.ownerName}\n` +

                     `• Numéro: ${this.ownerData.ownerNumber}\n` +

                     `• Admins: ${this.ownerData.authorizedNumbers.length}\n\n` +

                     `⚙️ *Paramètres:*\n` +

                     `• Auto-backup: ${this.ownerData.settings.autoBackup ? '✅' : '❌'}\n` +

                     `• Logs: ${this.ownerData.settings.commandLogs ? '✅' : '❌'}\n` +

                     `• Debug: ${this.ownerData.settings.debugMode ? '✅' : '❌'}\n\n` +

                     `📅 Dernier backup: ${this.ownerData.stats.lastBackup ? new Date(this.ownerData.stats.lastBackup).toLocaleString('fr-FR') : 'Jamais'}`

        };

    }

    

    // ⚙️ MODIFIER LES PARAMÈTRES

    async updateSettings(args) {

        if (args.length < 2) {

            return {

                success: false,

                message: `❌ Usage: .settings [param] [valeur]\n\n` +

                         `Paramètres disponibles:\n` +

                         `• autobackup on/off\n` +

                         `• logs on/off\n` +

                         `• debug on/off\n` +

                         `• maxgroups [nombre]`

            };

        }

        

        const param = args[0].toLowerCase();

        const value = args[1].toLowerCase();

        

        switch(param) {

            case 'autobackup':

                this.ownerData.settings.autoBackup = value === 'on';

                break;

                

            case 'logs':

                this.ownerData.settings.commandLogs = value === 'on';

                break;

                

            case 'debug':

                this.ownerData.settings.debugMode = value === 'on';

                break;

                

            case 'maxgroups':

                const max = parseInt(value);

                if (isNaN(max) || max < 1) {

                    return { success: false, message: '❌ Nombre invalide.' };

                }

                this.ownerData.settings.maxGroups = max;

                break;

                

            default:

                return { success: false, message: '❌ Paramètre inconnu.' };

        }

        

        await this.saveData();

        

        return {

            success: true,

            message: `✅ Paramètre mis à jour:\n` +

                     `⚙️ ${param} = ${value}\n\n` +

                     `💾 Configuration sauvegardée.`

        };

    }

    

    // 🔄 REDÉMARRER LE BOT

    async restartBot() {

        return {

            success: true,

            message: '🔄 Redémarrage en cours...',

            action: 'restart'

        };

    }

    

    // 📣 DIFFUSER UN MESSAGE

    async broadcastMessage(message) {

        if (!message || message.trim() === '') {

            return { success: false, message: '❌ Message requis pour broadcast.' };

        }

        

        // Ici vous devrez intégrer votre système de groupes

        // Pour l'instant, retournons un message d'info

        

        return {

            success: true,

            message: `📣 *BROADCAST PRÊT*\n\n` +

                     `Message: ${message}\n\n` +

                     `⚠️ *Fonctionnalité à implémenter*\n` +

                     `Contactez le développeur pour l'activation.`

        };

    }

    

    // 💻 ÉVALUER DU CODE (DANGEREUX - À UTILISER AVEC PRÉCAUTION)

    async evaluateCode(code) {

        if (!this.ownerData.settings.debugMode) {

            return { success: false, message: '❌ Mode debug désactivé.' };

        }

        

        try {

            // SECURITÉ: Ne jamais utiliser eval() en production!

            // Ceci est pour le développement seulement

            const result = eval(code);

            

            return {

                success: true,

                message: `💻 *ÉVALUATION DE CODE*\n\n` +

                         `Code: \`${code}\`\n\n` +

                         `Résultat: \`${result}\`\n\n` +

                         `⚠️ *FONCTION DANGEREUSE*`

            };

            

        } catch (error) {

            return {

                success: false,

                message: `❌ Erreur d'évaluation:\n\`${error.message}\``

            };

        }

    }

    

    // 📈 METTRE À JOUR LES STATS

    async incrementCommandCount() {

        this.ownerData.stats.commandsUsed++;

        await this.saveData();

    }

    

    async updateGroupCount(count) {

        this.ownerData.stats.groupsManaged = count;

        await this.saveData();

    }

    

    // 🔍 OBTENIR LES INFOS OWNER

    getOwnerInfo() {

        return {

            number: this.ownerData.ownerNumber,

            name: this.ownerData.ownerName,

            admins: this.ownerData.authorizedNumbers.length

        };

    }

}

module.exports = OwnerManager;