/**
 * ============================================
 * FALOU - FIRESTORE USER SERVICE
 * ============================================
 */

import { 
  db, doc, setDoc, getDoc, updateDoc, collection,
  query, where, getDocs, limit
} from './config';
import { generateNumericId } from './config';

export const createUserProfile = async (userId, userData) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, numericId: docSnap.data().numericId };
    }
    
    const numericId = await generateNumericId();
    
    await setDoc(docRef, {
      uid: userId,
      numericId: numericId,
      nick: userData.nick || '',
      email: userData.email || '',
      avatarUrl: userData.avatarUrl || null,
      bio: userData.bio || '',
      gender: '',
      birthDate: '',
      country: '',
      language: '',
      age: null,
      profileCompleted: false,
      level: 1,
      charisma: 0,
      wealth: 0,
      followers: [],
      following: [],
      friends: [],
      createdAt: new Date().toISOString(),
      traits: userData.traits || {}
    });
    
    return { success: true, numericId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const completeUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    await updateDoc(userRef, {
      nick: userData.nick,
      avatarUrl: userData.avatarUrl || userSnap.data()?.avatarUrl,
      gender: userData.gender,
      country: userData.country,
      language: userData.language,
      age: userData.age,
      bio: userData.bio || userSnap.data()?.bio || 'Olá! Estou no Falou!',
      profileCompleted: true,
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        success: true, 
        data: { 
          id: docSnap.id, 
          uid: data.uid,
          numericId: data.numericId,
          nick: data.nick, 
          email: data.email,
          avatarUrl: data.avatarUrl,
          bio: data.bio || '',
          gender: data.gender || '',
          birthDate: data.birthDate || '',
          country: data.country || '',
          language: data.language || '',
          age: data.age || null,
          profileCompleted: data.profileCompleted || false,
          level: data.level || 1, 
          charisma: data.charisma || 0, 
          wealth: data.wealth || 0,
          followers: data.followers || [],
          following: data.following || [],
          friends: data.friends || [],
          createdAt: data.createdAt
        } 
      };
    }
    return { success: false, error: 'Usuário não encontrado' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const searchUsers = async (searchTerm) => {
  try {
    const usersRef = collection(db, 'users');
    const term = searchTerm.toLowerCase().trim();
    const isNumeric = /^\d+$/.test(term);
    
    if (isNumeric) {
      const q = query(usersRef, where('numericId', '==', parseInt(term)), limit(20));
      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          uid: doc.data().uid,
          nick: doc.data().nick,
          avatarUrl: doc.data().avatarUrl,
          level: doc.data().level,
          numericId: doc.data().numericId,
          gender: doc.data().gender
        });
      });
      return { success: true, data: users };
    }
    
    const q = query(usersRef, where('nick', '>=', term), where('nick', '<=', term + '\uf8ff'), limit(20));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        uid: doc.data().uid,
        nick: doc.data().nick,
        avatarUrl: doc.data().avatarUrl,
        level: doc.data().level,
        numericId: doc.data().numericId,
        gender: doc.data().gender
      });
    });
    
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (uid, data) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateUserStats = async (uid, stats) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, stats);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
