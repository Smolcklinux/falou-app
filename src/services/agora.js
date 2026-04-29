/**
 * ============================================
 * FALOU - SERVIÇO AGORA.IO
 * ============================================
 */

const AGORA_APP_ID = '87a7dc688c034264894f131e68ad8939';
const AGORA_CERTIFICATE = '7b773112a3c144b6a261e5d3cc108c35';
const TOKEN_SERVER = 'https://falou-backend.vercel.app/api/agora-token';

export const generateAgoraToken = async (channelName, uid, role = 'publisher') => {
  try {
    const response = await fetch(
      `${TOKEN_SERVER}?channel=${channelName}&uid=${uid}&role=${role}`,
      { method: 'GET' }
    );
    const data = await response.json();
    
    if (data.token) {
      return { success: true, token: data.token, appId: AGORA_APP_ID };
    }
    return { success: false, error: data.error || 'Erro ao gerar token' };
  } catch (error) {
    // Fallback para teste local
    if (__DEV__) {
      try {
        const { RtcTokenBuilder } = require('agora-token');
        const token = RtcTokenBuilder.buildTokenWithUid(
          AGORA_APP_ID,
          AGORA_CERTIFICATE,
          channelName,
          parseInt(uid) || 0,
          role === 'publisher' ? 1 : 2,
          Math.floor(Date.now() / 1000) + 3600
        );
        return { success: true, token, appId: AGORA_APP_ID };
      } catch (e) {
        console.log('Erro no fallback:', e);
      }
    }
    return { success: false, error: error.message };
  }
};

export const getAudioConfig = () => ({
  channelProfile: 1, // LIVE_BROADCASTING
  clientRole: 1, // BROADCASTER
  audioProfile: 2, // SPEECH_STANDARD
  audioScenario: 3, // GAME_STREAMING
});

export { AGORA_APP_ID };
