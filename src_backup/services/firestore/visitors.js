/**
 * ============================================
 * FALOU - FIRESTORE VISITORS SERVICE
 * ============================================
 */

import { 
  db, collection, addDoc, getDocs, query, orderBy, limit
} from './config';
import { getUserProfile } from './user';

export const addVisitor = async (userId, visitorId) => {
  try {
    if (userId === visitorId) {
      return { success: true };
    }
    
    if (!visitorId || visitorId === 'visitante_id_temp') {
      return { success: true };
    }
    
    const visitor = await getUserProfile(visitorId);
    if (!visitor.success) {
      return { success: false };
    }
    
    const visitorsRef = collection(db, 'users', userId, 'visitors');
    await addDoc(visitorsRef, {
      uid: visitorId,
      nick: visitor.data.nick,
      avatarUrl: visitor.data.avatarUrl,
      visitedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getVisitors = async (userId) => {
  try {
    const visitorsRef = collection(db, 'users', userId, 'visitors');
    const q = query(visitorsRef, orderBy('visitedAt', 'desc'), limit(20));
    const querySnapshot = await getDocs(q);
    const visitors = [];
    querySnapshot.forEach((doc) => {
      visitors.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: visitors };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
