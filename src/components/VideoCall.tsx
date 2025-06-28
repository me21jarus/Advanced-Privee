import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Monitor } from "lucide-react";
import { CallState } from "@/lib/webrtc";

interface VideoCallProps {
  callState: CallState;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  otherUserName?: string;
}

export function VideoCall({
  callState,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  otherUserName,
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  // Set up remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.remoteStream]);

  if (!callState.isInCall) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Video containers */}
      <div className="flex-1 relative">
        {/* Remote video (main) */}
        {callState.remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">
                  {otherUserName?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
              <p className="text-lg">{otherUserName || "Other User"}</p>
              <p className="text-sm text-gray-400">
                {callState.isVideoCall ? "Connecting video..." : "Audio call"}
              </p>
            </div>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        {callState.isVideoCall && callState.localStream && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 w-32 h-24 md:w-48 md:h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {callState.isVideoOff && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="h-6 w-6 text-white" />
              </div>
            )}
          </motion.div>
        )}

        {/* Call duration */}
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          Call in progress
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/80 backdrop-blur-sm p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Mute button */}
          <Button
            onClick={onToggleMute}
            size="lg"
            variant={callState.isMuted ? "destructive" : "secondary"}
            className="h-12 w-12 rounded-full"
          >
            {callState.isMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          {/* Video toggle (only for video calls) */}
          {callState.isVideoCall && (
            <Button
              onClick={onToggleVideo}
              size="lg"
              variant={callState.isVideoOff ? "destructive" : "secondary"}
              className="h-12 w-12 rounded-full"
            >
              {callState.isVideoOff ? (
                <VideoOff className="h-5 w-5" />
              ) : (
                <Video className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* End call button */}
          <Button
            onClick={onEndCall}
            size="lg"
            variant="destructive"
            className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          {/* Screen share (placeholder) */}
          <Button
            size="lg"
            variant="secondary"
            className="h-12 w-12 rounded-full"
            disabled
          >
            <Monitor className="h-5 w-5" />
          </Button>
        </div>

        {/* Call info */}
        <div className="text-center mt-4 text-white">
          <p className="text-sm opacity-80">
            {callState.isVideoCall ? "Video call" : "Audio call"} with{" "}
            {otherUserName || "Other User"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
