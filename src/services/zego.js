import ZegoExpressEngine from 'zego-express-engine-reactnative';

// ⚠️ SUAS CREDENCIAIS DO ZEGOCLOUD
const ZEGO_APP_ID = 294404594;
const ZEGO_APP_SIGN = '618b5819ed9825e01f18ce21eb35d89b98791b41a918446ca89b65e63cfa92bf';

let engine = null;
let currentRoomId = null;

export const initZego = async () => {
  try {
    if (engine) return engine;
    
    console.log('🔧 Inicializando ZEGO...');
    engine = await ZegoExpressEngine.createEngine(
      ZEGO_APP_ID, 
      ZEGO_APP_SIGN, 
      true, // useTestEnv = true para teste
      1 // General scenario
    );
    
    // Habilitar áudio
    engine.enableMicrophone(true);
    engine.enableSpeaker(true);
    
    console.log('✅ ZEGO inicializado com sucesso!');
    return engine;
  } catch (error) {
    console.error('❌ Erro ao inicializar ZEGO:', error);
    throw error;
  }
};

export const loginZegoRoom = async (roomId, userId, userName) => {
  try {
    if (!engine) await initZego();
    
    const user = { userID: userId, userName: userName };
    const config = { isUserStatusNotify: true };
    
    console.log(`🔑 Entrando na sala: ${roomId} como ${userName}`);
    await engine.loginRoom(roomId, user, config);
    currentRoomId = roomId;
    
    console.log('✅ Login na sala ZEGO realizado!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao login na sala:', error);
    throw error;
  }
};

export const logoutZegoRoom = async () => {
  try {
    if (engine && currentRoomId) {
      await engine.logoutRoom(currentRoomId);
      currentRoomId = null;
      console.log('✅ Saiu da sala ZEGO');
    }
  } catch (error) {
    console.error('❌ Erro ao sair da sala:', error);
  }
};

export const muteMicrophone = async (mute) => {
  try {
    if (engine) {
      await engine.muteMicrophone(mute);
      console.log(`🎤 Microfone ${mute ? 'desativado' : 'ativado'}`);
    }
  } catch (error) {
    console.error('❌ Erro ao controlar microfone:', error);
  }
};

export const destroyZego = async () => {
  try {
    if (engine) {
      await engine.destroyEngine();
      engine = null;
      console.log('✅ ZEGO destruído');
    }
  } catch (error) {
    console.error('❌ Erro ao destruir ZEGO:', error);
  }
};

export const onRoomUserUpdate = (callback) => {
  if (engine) {
    engine.on('roomUserUpdate', (roomId, updateType, userList) => {
      callback(roomId, updateType, userList);
    });
  }
};

export const onRoomStreamUpdate = (callback) => {
  if (engine) {
    engine.on('roomStreamUpdate', (roomId, updateType, streamList) => {
      callback(roomId, updateType, streamList);
    });
  }
};