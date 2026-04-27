/**
 * ============================================
 * FALOU - FIRESTORE SERVICE (ÍNDICE)
 * ============================================
 * Exporta todas as funções dos sub-módulos
 * ============================================
 */

// ✅ Importar de user.js
import { 
  createUserProfile,
  completeUserProfile,
  getUserProfile,
  searchUsers,
  updateUserProfile,
  updateUserStats
} from './user';

// ✅ Importar de friends.js
import {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  getFriends,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  checkIsFollowing
} from './friends';

// ✅ Importar de messages.js
import {
  sendMessage,
  getMessages,
  listenToMessages,
  markMessagesAsRead,
  getChats
} from './messages';

// ✅ Importar de rooms.js
import {
  createVoiceRoom,
  getUserVoiceRoom,
  getRoomByNumericId,
  getActiveRooms,
  getPopularRooms,
  getNewRooms,
  getRecentRooms,
  getFollowedRooms,
  searchRooms,
  updateUserVoiceRoom,
  deleteUserVoiceRoom,
  updateRoomPopularity,
  getRoomSeats,
  updateRoomSeats,
  sendRoomMessage,
  getRoomMessages,
  listenToRoomMessages
} from './rooms';

// ✅ Importar de moments.js
import {
  getMoments,
  createMoment,
  likeMoment,
  listenToMoments,
  getFollowingMoments,
  getPopularMoments
} from './moments';

// ✅ Importar de visitors.js
import {
  addVisitor,
  getVisitors
} from './visitors';

// ============================================
// ✅ EXPORTAÇÕES
// ============================================

// User
export {
  createUserProfile,
  completeUserProfile,
  getUserProfile,
  searchUsers,
  updateUserProfile,
  updateUserStats
};

// Friends
export {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  getFriends,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  checkIsFollowing
};

// Messages
export {
  sendMessage,
  getMessages,
  listenToMessages,
  markMessagesAsRead,
  getChats
};

// Rooms
export {
  createVoiceRoom,
  getUserVoiceRoom,
  getRoomByNumericId,
  getActiveRooms,
  getPopularRooms,
  getNewRooms,
  getRecentRooms,
  getFollowedRooms,
  searchRooms,
  updateUserVoiceRoom,
  deleteUserVoiceRoom,
  updateRoomPopularity,
  getRoomSeats,
  updateRoomSeats,
  sendRoomMessage,
  getRoomMessages,
  listenToRoomMessages
};

// Moments
export {
  getMoments,
  createMoment,
  likeMoment,
  listenToMoments,
  getFollowingMoments,
  getPopularMoments
};

// Visitors
export {
  addVisitor,
  getVisitors
};
