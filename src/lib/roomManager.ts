// Room management for real-time communication using localStorage events

export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  senderName: string;
  timestamp: Date;
  expiresAt: Date;
  roomId: string;
}

export interface RoomParticipant {
  id: string;
  name: string;
  joinedAt: Date;
  lastSeen: Date;
}

export interface Room {
  id: string;
  participants: RoomParticipant[];
  messages: ChatMessage[];
  createdAt: Date;
  hostId: string;
}

// Get all rooms from localStorage
const getRooms = (): Record<string, Room> => {
  try {
    return JSON.parse(localStorage.getItem("securechat_rooms") || "{}");
  } catch {
    return {};
  }
};

// Save rooms to localStorage
const saveRooms = (rooms: Record<string, Room>) => {
  localStorage.setItem("securechat_rooms", JSON.stringify(rooms));
  // Trigger storage event for other tabs
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "securechat_rooms",
      newValue: JSON.stringify(rooms),
    }),
  );
};

// Create a new room
export const createRoom = (userId: string, userName: string): string => {
  const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
  const rooms = getRooms();

  const newRoom: Room = {
    id: roomId,
    participants: [
      {
        id: userId,
        name: userName,
        joinedAt: new Date(),
        lastSeen: new Date(),
      },
    ],
    messages: [],
    createdAt: new Date(),
    hostId: userId,
  };

  rooms[roomId] = newRoom;
  saveRooms(rooms);

  return roomId;
};

// Join an existing room
export const joinRoom = (
  roomId: string,
  userId: string,
  userName: string,
): boolean => {
  const rooms = getRooms();
  const room = rooms[roomId];

  if (!room) {
    return false; // Room doesn't exist
  }

  if (room.participants.length >= 2) {
    return false; // Room is full
  }

  // Check if user is already in room
  const existingParticipant = room.participants.find((p) => p.id === userId);
  if (existingParticipant) {
    existingParticipant.lastSeen = new Date();
  } else {
    room.participants.push({
      id: userId,
      name: userName,
      joinedAt: new Date(),
      lastSeen: new Date(),
    });
  }

  saveRooms(rooms);
  return true;
};

// Leave a room
export const leaveRoom = (roomId: string, userId: string): void => {
  const rooms = getRooms();
  const room = rooms[roomId];

  if (!room) return;

  // Remove participant
  room.participants = room.participants.filter((p) => p.id !== userId);

  // If host leaves or room is empty, delete the room
  if (userId === room.hostId || room.participants.length === 0) {
    delete rooms[roomId];
  }

  saveRooms(rooms);
};

// Send a message
export const sendMessage = (
  roomId: string,
  content: string,
  userId: string,
  userName: string,
): boolean => {
  const rooms = getRooms();
  const room = rooms[roomId];

  if (!room) return false;

  // Check if user is in room
  const participant = room.participants.find((p) => p.id === userId);
  if (!participant) return false;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes

  const message: ChatMessage = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    content,
    sender: userId,
    senderName: userName,
    timestamp: now,
    expiresAt,
    roomId,
  };

  room.messages.push(message);

  // Update last seen
  participant.lastSeen = new Date();

  saveRooms(rooms);
  return true;
};

// Get room data
export const getRoom = (roomId: string): Room | null => {
  const rooms = getRooms();
  return rooms[roomId] || null;
};

// Update user's last seen timestamp
export const updateLastSeen = (roomId: string, userId: string): void => {
  const rooms = getRooms();
  const room = rooms[roomId];

  if (!room) return;

  const participant = room.participants.find((p) => p.id === userId);
  if (participant) {
    participant.lastSeen = new Date();
    saveRooms(rooms);
  }
};

// Clean up expired messages
export const cleanupExpiredMessages = (roomId: string): void => {
  const rooms = getRooms();
  const room = rooms[roomId];

  if (!room) return;

  const now = new Date();
  room.messages = room.messages.filter(
    (message) => new Date(message.expiresAt) > now,
  );

  saveRooms(rooms);
};

// Remove inactive users (haven't been seen for 30 seconds)
export const removeInactiveUsers = (roomId: string): void => {
  const rooms = getRooms();
  const room = rooms[roomId];

  if (!room) return;

  const cutoff = new Date(Date.now() - 30 * 1000); // 30 seconds
  const activeParticipants = room.participants.filter(
    (p) => new Date(p.lastSeen) > cutoff,
  );

  if (activeParticipants.length !== room.participants.length) {
    room.participants = activeParticipants;

    // If host left, delete room
    if (!room.participants.find((p) => p.id === room.hostId)) {
      delete rooms[roomId];
    }

    saveRooms(rooms);
  }
};
