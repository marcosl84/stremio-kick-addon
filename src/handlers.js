const kickApi = require('./kickApi');
const manifest = require('../manifest.json');

// Handler para catálogo
async function handleCatalog(type, id, extra) {
  try {
    let results = [];

    // Retornar catálogos vazios por enquanto
    return {
      metas: results
    };
  } catch (error) {
    console.error('Erro no handler de catálogo:', error);
    return { metas: [] };
  }
}

// Handler para metadados
async function handleMeta(type, id) {
  try {
    return null;
  } catch (error) {
    console.error('Erro no handler de meta:', error);
    return null;
  }
}

// Handler para streams
async function handleStream(type, id) {
  try {
    return { streams: [] };
  } catch (error) {
    console.error('Erro no handler de stream:', error);
    return { streams: [] };
  }
}

module.exports = {
  handleCatalog,
  handleMeta,
  handleStream
};
