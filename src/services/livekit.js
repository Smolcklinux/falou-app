/**
 * ============================================
 * FALOU - LIVEKIT SERVICE (ATIVADO)
 * ============================================
 * ✅ LiveKit ativado para áudio ao vivo
 * ============================================
 * Gerencia tokens e conexão com LiveKit Cloud
 * - Gera tokens JWT para autenticação
 * - Testa conectividade com o backend
 * ============================================
 */

const LIVEKIT_URL = 'wss://falou-voice-bschu9m4.livekit.cloud';
const BACKEND_URL = 'https://falou-backend.vercel.app/api/token';

/**
 * ✅ Gera token para entrar na sala de voz
 * @param {string} roomName - Nome da sala
 * @param {string} participantName - Nome do participante
 * @param {string} participantId - ID do participante (UID do Firebase)
 * @param {object} metadata - Metadados adicionais (cadeira, etc)
 * @returns {Promise<{success: boolean, token?: string, url?: string, error?: string}>}
 */
export const generateLiveKitToken = async (roomName, participantName, participantId, metadata = {}) => {
  try {
    console.log('🔑 [LiveKit] Solicitando token para sala:', roomName);
    console.log('🔑 [LiveKit] Participante:', participantName, 'ID:', participantId);
    
    const url = `${BACKEND_URL}?roomName=${encodeURIComponent(roomName)}&participantName=${encodeURIComponent(participantName)}&participantId=${encodeURIComponent(participantId)}&metadata=${encodeURIComponent(JSON.stringify(metadata))}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (data.token) {
      console.log('✅ [LiveKit] Token recebido com sucesso');
      return { success: true, token: data.token, url: LIVEKIT_URL };
    }
    
    console.error('❌ [LiveKit] Erro ao gerar token:', data.error);
    return { success: false, error: data.error || 'Erro ao gerar token' };
  } catch (error) {
    console.error('❌ [LiveKit] Erro na requisição:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ✅ Testa se o backend está funcionando
 * @returns {Promise<boolean>}
 */
export const testBackend = async () => {
  try {
    console.log('🔍 [LiveKit] Testando conectividade com backend...');
    const response = await fetch('https://falou-backend.vercel.app/api/health');
    const isOk = response.ok;
    console.log(isOk ? '✅ [LiveKit] Backend online' : '⚠️ [LiveKit] Backend offline');
    return isOk;
  } catch (error) {
    console.error('❌ [LiveKit] Backend offline:', error);
    return false;
  }
};s