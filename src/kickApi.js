const axios = require('axios');

const KICK_API_BASE = 'https://kick.com/api/v2';

class KickApi {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
  }

  // Limpar cache expirado
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Buscar com cache
  async getCached(key, fetchFn) {
    this.clearExpiredCache();
    
    if (this.cache.has(key)) {
      return this.cache.get(key).data;
    }

    const data = await fetchFn();
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheExpiry
    });
    
    return data;
  }

  // Buscar streams ao vivo
  async getLiveStreams(genre = null, limit = 50) {
    try {
      const cacheKey = `live_${genre}_${limit}`;
      
      return await this.getCached(cacheKey, async () => {
        // Retornar array vazio para agora (API será integrada depois)
        return [];
      });
    } catch (error) {
      console.error('Erro ao buscar streams ao vivo:', error.message);
      return [];
    }
  }

  // Buscar VODs
  async getVODs(search = null, limit = 50) {
    try {
      const cacheKey = `vods_${search}_${limit}`;
      
      return await this.getCached(cacheKey, async () => {
        return [];
      });
    } catch (error) {
      console.error('Erro ao buscar VODs:', error.message);
      return [];
    }
  }

  // Buscar canais
  async searchChannels(query, limit = 50) {
    try {
      const cacheKey = `channels_${query}_${limit}`;
      
      return await this.getCached(cacheKey, async () => {
        return [];
      });
    } catch (error) {
      console.error('Erro ao buscar canais:', error.message);
      return [];
    }
  }

  // Buscar informações de um canal específico
  async getChannel(slug) {
    try {
      const cacheKey = `channel_${slug}`;
      
      return await this.getCached(cacheKey, async () => {
        return null;
      });
    } catch (error) {
      console.error('Erro ao buscar canal:', error.message);
      return null;
    }
  }

  // Buscar stream de um canal específico
  async getChannelStream(slug) {
    try {
      const channel = await this.getChannel(slug);
      
      if (!channel || !channel.isLive) {
        return null;
      }

      return {
        id: `kick_live_${slug}`,
        title: channel.name,
        url: `https://kick.com/${slug}`,
        thumbnail: channel.thumbnail,
        description: channel.description,
        viewers: channel.viewers,
        isLive: true
      };
    } catch (error) {
      console.error('Erro ao buscar stream do canal:', error.message);
      return null;
    }
  }

  // Verificar se um criador está online
  async isChannelLive(slug) {
    try {
      const channel = await this.getChannel(slug);
      return channel ? channel.isLive : false;
    } catch (error) {
      console.error('Erro ao verificar status do canal:', error.message);
      return false;
    }
  }
}

module.exports = new KickApi();
