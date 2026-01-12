module.exports = {
    name: "cry",
    description: "Envoie un GIF de pleurs",
    execute: async (sock, msg, args) => {
        const gifs = [
            "https://media.tenor.com/Z1QqFAAZ6tsAAAAC/sad-cat-cat-cry.gif",
            "https://media.tenor.com/Gf3yR_cl2UAAAAAC/cat-cry-sad-cat.gif",
            "https://media.tenor.com/MA0GfBkZ5kEAAAAC/anime-cry.gif"
        ];
        
        const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
        
        await sock.sendMessage(msg.key.remoteJid, {
            video: { url: randomGif },
            gifPlayback: true,
            caption: "😭 *sniff sniff*"
        });
    }
};