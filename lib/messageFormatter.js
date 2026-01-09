

module.exports = {

  formatMessage: function(text, options = {}) {

    // Formatage simple du texte

    let formatted = text;

    

    if (options.bold) {

      formatted = `*${formatted}*`;

    }

    

    if (options.italic) {

      formatted = `_${formatted}_`;

    }

    

    if (options.code) {

      formatted = `\`\`\`${formatted}\`\`\``;

    }

    

    return formatted;

  },

  

  formatError: function(error) {

    return `❌ *Erreur:* ${error.message || error}`;

  },

  

  formatSuccess: function(message) {

    return `✅ *Succès:* ${message}`;

  },

  

  formatWarning: function(message) {

    return `⚠️ *Attention:* ${message}`;

  },

  

  formatInfo: function(message) {

    return `ℹ️ *Info:* ${message}`;

  }

};