const axios = require('axios');

// Keep-alive: Faz ping no servidor a cada 14 minutos para não hibernar
const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutos

function startKeepAlive() {
  const appUrl = process.env.APP_URL || 'http://localhost:7000/health';
  
  setInterval(async () => {
    try {
      await axios.get(appUrl, { timeout: 5000 });
      console.log('✅ Keep-alive: App ainda está acordado');
    } catch (error) {
      console.log('⚠️ Keep-alive: Falha ao fazer ping (normal em hibernação)');
    }
  }, KEEP_ALIVE_INTERVAL);
  
  console.log('🔄 Keep-alive iniciado - App será mantido acordado');
}

module.exports = { startKeepAlive };
