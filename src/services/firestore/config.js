/**
 * ============================================
 * FALOU - FIRESTORE CONFIGURAÇÕES
 * ============================================
 */

import { db } from '../../../config/firebase';
import { 
  doc, setDoc, getDoc, updateDoc, collection, 
  addDoc, query, where, getDocs, orderBy, limit,
  arrayUnion, arrayRemove, serverTimestamp, deleteDoc,
  onSnapshot, increment
} from 'firebase/firestore';

export { 
  db, doc, setDoc, getDoc, updateDoc, collection, 
  addDoc, query, where, getDocs, orderBy, limit,
  arrayUnion, arrayRemove, serverTimestamp, deleteDoc,
  onSnapshot, increment
};

let currentNumericId = null;

export const getMaxNumericId = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    let maxId = 999991;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.numericId && data.numericId > maxId) {
        maxId = data.numericId;
      }
    });
    return maxId;
  } catch (error) {
    console.error('Erro ao buscar maior ID:', error);
    return 999991;
  }
};

export const generateNumericId = async () => {
  if (currentNumericId === null) {
    currentNumericId = await getMaxNumericId();
  }
  currentNumericId++;
  return currentNumericId;
};
