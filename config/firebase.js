import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDyNkk3BuofXAHyrPCYPm6XRpJp4_zsOrI",
  authDomain: "falou-app.firebaseapp.com",
  projectId: "falou-app",
  storageBucket: "falou-app.firebasestorage.app",
  messagingSenderId: "294883976776",
  appId: "1:294883976776:web:f72bada4d65ea5c2831a7d"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth com persistência (importante para React Native)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inicializar Firestore (banco de dados)
const db = getFirestore(app);

// ❌ NÃO estamos usando o Storage do Firebase
// Todas as imagens (avatares, presentes, etc.) serão gerenciadas pelo Cloudinary

// Exportar apenas o necessário
export { auth, db };
export default app;