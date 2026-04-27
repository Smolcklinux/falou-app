/**
 * ============================================
 * FALOU - FIRESTORE FRIENDS SERVICE
 * ============================================
 */

import { 
  db, collection, doc, addDoc, getDocs, query, where,
  updateDoc, arrayUnion, arrayRemove, serverTimestamp
} from './config';
import { getUserProfile } from './user';

export const sendFriendRequest = async (fromUserId, toUserId) => {
  try {
    const existingQuery = query(
      collection(db, 'friendRequests'), 
      where('from', '==', fromUserId), 
      where('to', '==', toUserId),
      where('status', '==', 'pending')
    );
    const existing = await getDocs(existingQuery);
    if (!existing.empty) {
      return { success: false, error: 'Solicitação já enviada' };
    }
    
    await addDoc(collection(db, 'friendRequests'), {
      from: fromUserId,
      to: toUserId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getFriendRequests = async (userId) => {
  try {
    const q = query(collection(db, 'friendRequests'), where('to', '==', userId), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    const requests = [];
    for (const doc of querySnapshot.docs) {
      const requestData = doc.data();
      const fromUser = await getUserProfile(requestData.from);
      if (fromUser.success) {
        requests.push({
          requestId: doc.id,
          uid: requestData.from,
          nick: fromUser.data.nick,
          avatarUrl: fromUser.data.avatarUrl,
          gender: fromUser.data.gender
        });
      }
    }
    return { success: true, data: requests };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const acceptFriendRequest = async (requestId, currentUserId, fromUserId) => {
  try {
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });
    await updateDoc(doc(db, 'users', currentUserId), { friends: arrayUnion(fromUserId) });
    await updateDoc(doc(db, 'users', fromUserId), { friends: arrayUnion(currentUserId) });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getFriends = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const friendsIds = userSnap.data()?.friends || [];
    const friends = [];
    for (const uid of friendsIds) {
      const friend = await getUserProfile(uid);
      if (friend.success) {
        friends.push({ ...friend.data });
      }
    }
    return { success: true, data: friends };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getFollowers = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const followersIds = userSnap.data()?.followers || [];
    const followers = [];
    for (const uid of followersIds) {
      const user = await getUserProfile(uid);
      if (user.success) {
        followers.push(user.data);
      }
    }
    return { success: true, data: followers };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getFollowing = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const followingIds = userSnap.data()?.following || [];
    const following = [];
    for (const uid of followingIds) {
      const user = await getUserProfile(uid);
      if (user.success) {
        following.push(user.data);
      }
    }
    return { success: true, data: following };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const followUser = async (currentUserId, targetUserId) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    await updateDoc(currentUserRef, { following: arrayUnion(targetUserId) });
    await updateDoc(targetUserRef, { followers: arrayUnion(currentUserId) });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const unfollowUser = async (currentUserId, targetUserId) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    await updateDoc(currentUserRef, { following: arrayRemove(targetUserId) });
    await updateDoc(targetUserRef, { followers: arrayRemove(currentUserId) });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const checkIsFollowing = async (currentUserId, targetUserId) => {
  try {
    const userRef = doc(db, 'users', currentUserId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.following?.includes(targetUserId) || false;
    }
    return false;
  } catch (error) {
    return false;
  }
};
