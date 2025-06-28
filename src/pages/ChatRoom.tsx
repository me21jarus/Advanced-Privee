import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  Phone,
  Video,
  MoreVertical,
  Shield,
  Clock,
  Users,
  Copy,
  Check,
  Camera,
  Image as ImageIcon,
  PhoneCall,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  createRoom,
  joinRoom,
  leaveRoom,
  sendMessage,
  getRoom,
  updateLastSeen,
  cleanupExpiredMessages,
  removeInactiveUsers,
  type ChatMessage,
  type Room,
} from "@/lib/roomManager";
import { WebRTCManager, CallState } from "@/lib/webrtc";
import {
  captureImageFromCamera,
  selectImageFromFile,
  shareImage,
  viewImage,
  getPendingImages,
  SharedImage,
} from "@/lib/imageManager";
import { VideoCall } from "@/components/VideoCall";
import { ImageViewer, ImageNotification } from "@/components/ImageViewer";
import { PermissionDialog } from "@/components/PermissionDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  checkCameraPermission,
  checkMicrophonePermission,
} from "@/lib/permissions";

const ChatRoom = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Call state
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isVideoCall: false,
    isAudioCall: false,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoOff: false,
  });
  const [webrtcManager, setWebrtcManager] = useState<WebRTCManager | null>(
    null,
  );
  const [incomingCall, setIncomingCall] = useState<{
    isVideo: boolean;
    from: string;
  } | null>(null);

  // Image state
  const [pendingImages, setPendingImages] = useState<SharedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<SharedImage | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  // Permission dialog state
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionType, setPermissionType] = useState<
    "camera" | "microphone" | "both"
  >("both");
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Initialize WebRTC manager
  useEffect(() => {
    if (!user || !roomId) return;

    const manager = new WebRTCManager(
      roomId,
      user.id,
      setCallState,
      (isVideo) => setIncomingCall({ isVideo, from: "other" }),
    );
    setWebrtcManager(manager);

    return () => {
      manager.cleanup();
    };
  }, [user, roomId]);

  // Initialize or join room
  useEffect(() => {
    if (!user || !roomId) return;

    let existingRoom = getRoom(roomId);

    if (!existingRoom) {
      // Create new room if it doesn't exist
      const newRoomId = createRoom(user.id, user.name);
      if (newRoomId !== roomId) {
        // Room ID mismatch, redirect to correct room
        navigate(`/room/${newRoomId}`);
        return;
      }
      existingRoom = getRoom(roomId);
    } else {
      // Try to join existing room
      const joined = joinRoom(roomId, user.id, user.name);
      if (!joined) {
        // Room is full or doesn't exist
        navigate("/dashboard");
        return;
      }
    }

    setRoom(existingRoom);
  }, [user, roomId, navigate]);

  // Real-time updates via storage events
  useEffect(() => {
    if (!roomId) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "securechat_rooms") {
        const updatedRoom = getRoom(roomId);
        if (updatedRoom) {
          setRoom(updatedRoom);
        } else {
          // Room was deleted
          navigate("/dashboard");
        }
      }
    };

    // Listen for localStorage changes from other tabs
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [roomId, navigate]);

  // Update last seen and cleanup periodically
  useEffect(() => {
    if (!user || !roomId) return;

    const interval = setInterval(() => {
      updateLastSeen(roomId, user.id);
      cleanupExpiredMessages(roomId);
      removeInactiveUsers(roomId);

      // Check for pending images
      const pending = getPendingImages(roomId, user.id);
      setPendingImages(pending);

      // Refresh room data
      const updatedRoom = getRoom(roomId);
      if (updatedRoom) {
        setRoom(updatedRoom);
      } else {
        navigate("/dashboard");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, roomId, navigate]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room?.messages]);

  // Cleanup when leaving component
  useEffect(() => {
    return () => {
      if (user && roomId) {
        leaveRoom(roomId, user.id);
      }
    };
  }, [user, roomId]);

  const handleSendMessage = () => {
    if (!user || !roomId || !newMessage.trim()) return;

    const success = sendMessage(roomId, newMessage.trim(), user.id, user.name);
    if (success) {
      setNewMessage("");
      // Refresh room data
      const updatedRoom = getRoom(roomId);
      if (updatedRoom) {
        setRoom(updatedRoom);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyRoomCode = async () => {
    if (!roomId) return;

    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Failed to copy text: ", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // Call functions
  const startCall = async (isVideo: boolean) => {
    if (!webrtcManager || !room || room.participants.length < 2) return;

    // Check permissions first
    const microphoneCheck = await checkMicrophonePermission();
    let cameraCheck = { granted: true };

    if (isVideo) {
      cameraCheck = await checkCameraPermission();
    }

    if (!microphoneCheck.granted || (isVideo && !cameraCheck.granted)) {
      setPermissionType(isVideo ? "both" : "microphone");
      setPendingAction(() => () => actuallyStartCall(isVideo));
      setShowPermissionDialog(true);
      return;
    }

    actuallyStartCall(isVideo);
  };

  const actuallyStartCall = async (isVideo: boolean) => {
    if (!webrtcManager || !room || room.participants.length < 2) return;

    const otherUser = room.participants.find((p) => p.id !== user?.id);
    if (!otherUser) return;

    try {
      await webrtcManager.startCall(isVideo, otherUser.id);
    } catch (error: any) {
      console.error("Failed to start call:", error);
      let errorMessage = "Failed to start call. ";

      if (error.message === "HTTPS_REQUIRED") {
        errorMessage += "HTTPS is required for camera/microphone access.";
      } else if (error.message === "CAMERA_PERMISSION_DENIED") {
        errorMessage += "Camera permission denied.";
      } else if (error.message === "MICROPHONE_PERMISSION_DENIED") {
        errorMessage += "Microphone permission denied.";
      } else {
        errorMessage += "Please check your camera/microphone permissions.";
      }

      alert(errorMessage);
    }
  };

  const acceptCall = async () => {
    if (!webrtcManager || !incomingCall) return;

    try {
      // Note: In a real implementation, you'd need to pass the offer from the signaling
      await webrtcManager.acceptCall(
        {} as any,
        incomingCall.isVideo,
        incomingCall.from,
      );
      setIncomingCall(null);
    } catch (error) {
      console.error("Failed to accept call:", error);
      alert(
        "Failed to accept call. Please check camera/microphone permissions.",
      );
    }
  };

  const endCall = () => {
    if (!webrtcManager || !room) return;

    const otherUser = room.participants.find((p) => p.id !== user?.id);
    webrtcManager.endCall(otherUser?.id);
  };

  // Image functions
  const handleCaptureImage = async () => {
    if (!user || !roomId) return;

    // Check camera permission first
    const cameraCheck = await checkCameraPermission();

    if (!cameraCheck.granted) {
      setPermissionType("camera");
      setPendingAction(() => () => actuallyCapturePage());
      setShowPermissionDialog(true);
      return;
    }

    actuallyCapturePage();
  };

  const actuallyCapturePage = async () => {
    if (!user || !roomId) return;

    try {
      const imageData = await captureImageFromCamera();
      shareImage(roomId, imageData, user.id, user.name);
    } catch (error: any) {
      console.error("Failed to capture image:", error);

      let errorMessage = "Failed to capture image. ";
      if (error.message?.includes("HTTPS")) {
        errorMessage += "HTTPS is required for camera access.";
      } else if (error.message?.includes("denied")) {
        errorMessage += "Camera permission denied.";
      } else {
        errorMessage += "Please check your camera permissions.";
      }

      alert(errorMessage);
    }
  };

  const handleSelectImage = async () => {
    if (!user || !roomId) return;

    try {
      const imageData = await selectImageFromFile();
      shareImage(roomId, imageData, user.id, user.name);
    } catch (error) {
      console.error("Failed to select image:", error);
    }
  };

  const handleViewImage = (image: SharedImage) => {
    setCurrentImage(image);
    setShowImageViewer(true);
  };

  const handleImageView = () => {
    if (!currentImage || !roomId || !user) return;

    viewImage(roomId, currentImage.id, user.id);
  };

  const leaveRoomAndGoBack = () => {
    if (user && roomId) {
      leaveRoom(roomId, user.id);
    }
    if (webrtcManager) {
      webrtcManager.cleanup();
    }
    navigate("/dashboard");
  };

  const getTimeRemaining = (expiresAt: string | Date) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const remaining = Math.max(0, expiry.getTime() - now.getTime());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!user) {
    return null; // Will redirect
  }

  if (!room) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  const isConnected = room.participants.length > 0;
  const participantCount = room.participants.length;
  const otherParticipants = room.participants.filter((p) => p.id !== user.id);

  return (
    <>
      {/* Video Call Component */}
      {callState.isInCall && (
        <VideoCall
          callState={callState}
          onEndCall={endCall}
          onToggleMute={() => webrtcManager?.toggleMute()}
          onToggleVideo={() => webrtcManager?.toggleVideo()}
          otherUserName={otherParticipants[0]?.name}
        />
      )}

      {/* Incoming Call Alert */}
      {incomingCall && (
        <Alert className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-96">
          <PhoneCall className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Incoming {incomingCall.isVideo ? "video" : "audio"} call
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIncomingCall(null)}
              >
                Decline
              </Button>
              <Button size="sm" onClick={acceptCall}>
                Accept
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Image Notifications */}
      <ImageNotification
        count={pendingImages.length}
        onClick={() => {
          if (pendingImages.length > 0) {
            handleViewImage(pendingImages[0]);
          }
        }}
      />

      {/* Image Viewer */}
      {showImageViewer && currentImage && (
        <ImageViewer
          image={currentImage}
          onClose={() => {
            setShowImageViewer(false);
            setCurrentImage(null);
          }}
          onView={handleImageView}
        />
      )}

      {/* Permission Dialog */}
      <PermissionDialog
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        type={permissionType}
        onSuccess={() => {
          pendingAction();
          setPendingAction(() => {});
        }}
      />

      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <header className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={leaveRoomAndGoBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-foreground">
                    Room {roomId}
                  </h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyRoomCode}
                    className="h-6 px-2"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge
                    variant={isConnected ? "default" : "destructive"}
                    className="h-4 text-xs"
                  >
                    <div
                      className={`mr-1 h-1.5 w-1.5 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    {isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {participantCount}/2
                  </span>
                  {otherParticipants.length > 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      with {otherParticipants[0].name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20"
                disabled={participantCount < 2 || callState.isInCall}
                onClick={() => startCall(false)}
                title="Start audio call"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                disabled={participantCount < 2 || callState.isInCall}
                onClick={() => startCall(true)}
                title="Start video call"
              >
                <Video className="h-4 w-4" />
              </Button>

              {/* Image sharing dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9"
                    title="Share images"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleCaptureImage}>
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSelectImage}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Choose from Gallery
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ThemeToggle />
              <Button variant="ghost" size="sm" className="h-9 w-9">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Welcome message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                <Shield className="h-4 w-4" />
                End-to-end encrypted conversation
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Messages auto-delete after 2 minutes
              </p>
              {participantCount === 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Share the room code to invite someone
                </p>
              )}
            </motion.div>

            {/* Messages */}
            <AnimatePresence>
              {room.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${
                    message.sender === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.sender === user.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {message.sender !== user.id && (
                      <p className="text-xs opacity-60 mb-1">
                        {message.senderName}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1 text-xs opacity-60">
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeRemaining(message.expiresAt)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="shrink-0 border-t border-border bg-card/50 backdrop-blur-sm p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message... (auto-deletes in 2 minutes)"
                  className="resize-none border-muted-foreground/20 focus:border-primary"
                  disabled={!isConnected}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !isConnected}
                className="h-10 w-10 shrink-0"
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Privacy reminder */}
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>
                Messages are encrypted and auto-delete after 2 minutes
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatRoom;
