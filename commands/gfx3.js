module.exports = {
    name: "gfx3",
    description: "Effets GFX ultime - Niveau 3",
    execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;
        
        if (!args[0]) {
            return sock.sendMessage(from, {
                text: "💎 *GFX3 MENU*\n\n.gfx3 <texte> - Effet diamant\n.gfx3 anime <texte> - Style anime\n.gfx3 metal <texte> - Effet métal\n.gfx3 gradient <texte> - Dégradé premium\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷"
            });
        }
        
        const text = args.join(' ');
        let effect = 'diamond';
        
        // Détecter l'effet
        if (text.toLowerCase().startsWith('anime ')) {
            effect = 'anime';
        } else if (text.toLowerCase().startsWith('metal ')) {
            effect = 'metal';
        } else if (text.toLowerCase().startsWith('gradient ')) {
            effect = 'gradient';
        }
        
        const cleanText = text.replace(/anime |metal |gradient /i, '');
        
        try {
            await sock.sendMessage(from, {
                text: `💫 *Génération GFX3 ${effect.toUpperCase()}...*`
            });
            
            // API premium pour GFX3
            const apis = {
                'diamond': `https://api.popcat.xyz/drip?text=${encodeURIComponent(cleanText)}`,
                'anime': `https://api.popcat.xyz/wanted?text=${encodeURIComponent(cleanText)}`,
                'metal': `https://api.popcat.xyz/captcha?text=${encodeURIComponent(cleanText)}`,
                'gradient': `https://api.popcat.xyz/banner?text=${encodeURIComponent(cleanText)}`
            };
            
            const apiUrl = apis[effect] || apis['diamond'];
            
            await sock.sendMessage(from, {
                image: { url: apiUrl },
                caption: `💎 *GFX3 - ${effect.toUpperCase()}*\n\n📝 *Texte :* ${cleanText}\n🎨 *Niveau :* Ultimate\n✨ *Qualité :* 4K Premium\n⚡ *Technologie :* HEX-TECH Engine\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`
            });
            
        } catch (error) {
            console.log("GFX3 error:", error);
            
            // Effets ASCII ultimes
            let asciiUltimate;
            switch(effect) {
                case 'anime':
                    asciiUltimate = `
┏━━━━❖ ＧＦＸ３ ❖━━━┓
┃
┃  🎌 *${cleanText}* 🎌
┃
┃  ╔══════════════╗
┃  ║    ANIME     ║
┃  ║   STYLE      ║
┃  ╚══════════════╝
┃
┃  *Powered by HEX-TECH*
┗━━━━━━━━━━━━━━━━━━┛`;
                    break;
                case 'metal':
                    asciiUltimate = `
┏━━━━❖ ＧＦＸ３ ❖━━━┓
┃
┃  🔩 *${cleanText}* 🔩
┃
┃  ╔══════════════╗
┃  ║    METAL     ║
┃  ║   CHROME     ║
┃  ╚══════════════╝
┃
┃  *Powered by HEX-TECH*
┗━━━━━━━━━━━━━━━━━━┛`;
                    break;
                case 'gradient':
                    asciiUltimate = `
┏━━━━❖ ＧＦＸ３ ❖━━━┓
┃
┃  🌈 *${cleanText}* 🌈
┃
┃  ╔══════════════╗
┃  ║  GRADIENT    ║
┃  ║   PREMIUM    ║
┃  ╚══════════════╝
┃
┃  *Powered by HEX-TECH*
┗━━━━━━━━━━━━━━━━━━┛`;
                    break;
                default:
                    asciiUltimate = `
┏━━━━❖ ＧＦＸ３ ❖━━━┓
┃
┃  💎 *${cleanText}* 💎
┃
┃  ╔══════════════╗
┃  ║   DIAMOND    ║
┃  ║   EFFECT     ║
┃  ╚══════════════╝
┃
┃  *Powered by HEX-TECH*
┗━━━━━━━━━━━━━━━━━━┛`;
            }
            
            await sock.sendMessage(from, {
                text: asciiUltimate + '\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷'
            });
        }
    }
};