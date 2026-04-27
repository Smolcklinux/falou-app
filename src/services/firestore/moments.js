/**
 * ============================================
 * FALOU - FIRESTORE MOMENTS SERVICE
 * ============================================
 */

import { 
  db, collection, addDoc, getDocs, query, orderBy,
  where, updateDoc, arrayUnion, arrayRemove, onSnapshot, limit,
  doc
} from './config';

export const getMoments = async () => {
  try {
    const q = query(collection(db, 'moments'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const moments = [];
    querySnapshot.forEach((doc) => {
      moments.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: moments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createMoment = async (userId, userNick, text, userAvatar, imageUrl = null) => {
  try {
    const docRef = await addDoc(collection(db, 'moments'), {
      userId: userId,
      userNick: userNick,
      userAvatar: userAvatar,
      text: text,
      imageUrl: imageUrl,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const likeMoment = async (momentId, userId, hasLiked) => {
  try {
    const momentRef = doc(db, 'moments', momentId);
    if (hasLiked) {
      await updateDoc(momentRef, { likes: arrayRemove(userId) });
    } else {
      await updateDoc(momentRef, { likes: arrayUnion(userId) });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const listenToMoments = (callback) => {
  const q = query(collection(db, 'moments'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const moments = [];
    querySnapshot.forEach((doc) => {
      moments.push({ id: doc.id, ...doc.data() });
    });
    callback(moments);
  });
};

export const getFollowingMoments = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const following = userSnap.data()?.following || [];
    if (following.length === 0) return { success: true, data: [] };
    const momentsRef = collection(db, 'moments');
    const q = query(momentsRef, where('userId', 'in', following), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const moments = [];
    querySnapshot.forEach((doc) => {
      moments.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: moments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getPopularMoments = async () => {
  try {
    const q = query(collection(db, 'moments'), orderBy('likes', 'desc'), limit(30));
    const querySnapshot = await getDocs(q);
    const moments = [];
    querySnapshot.forEach((doc) => {
      moments.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: moments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
