/**
 * ============================================
 * FALOU - SERVIÇO DE AUTENTICAÇÃO
 * Gerenciamento de usuários com Firebase Auth
 * ============================================
 */

import { auth } from '../../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

// ========== CADASTRO COM EMAIL/SENHA ==========
export const registerUser = async (email, password, nick) => {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout - Servidor lento')), 15000)
    );
    
    const registerPromise = createUserWithEmailAndPassword(auth, email, password);
    const userCredential = await Promise.race([registerPromise, timeoutPromise]);
    
    await updateProfile(userCredential.user, { displayName: nick });
    return { success: true, user: userCredential.user };
  } catch (error) {
    let errorMessage = 'Erro ao cadastrar';
    if (error.message === 'Timeout - Servidor lento') {
      errorMessage = 'Servidor demorou muito. Tente novamente.';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email já cadastrado';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Senha muito fraca (mínimo 6 caracteres)';
    }
    return { success: false, error: errorMessage };
  }
};

// ========== LOGIN COM EMAIL/SENHA ==========
export const loginUser = async (email, password) => {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout - Servidor lento')), 10000)
    );
    
    const loginPromise = signInWithEmailAndPassword(auth, email, password);
    const userCredential = await Promise.race([loginPromise, timeoutPromise]);
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    let errorMessage = 'Erro ao entrar';
    if (error.message === 'Timeout - Servidor lento') {
      errorMessage = 'Servidor demorou muito. Tente novamente.';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Email ou senha incorretos';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'Usuário desabilitado';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Muitas tentativas. Aguarde um momento.';
    }
    return { success: false, error: errorMessage };
  }
};

// ========== LOGOUT ==========
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== RESETAR SENHA ==========
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    let errorMessage = 'Erro ao enviar email de recuperação';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado';
    }
    return { success: false, error: errorMessage };
  }
};

// ========== OBTER USUÁRIO ATUAL ==========
export const getCurrentUser = () => {
  return auth.currentUser;
};