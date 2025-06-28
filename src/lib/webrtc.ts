// WebRTC utilities for audio/video calls

export interface CallState {
  isInCall: boolean;
  isVideoCall: boolean;
  isAudioCall: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private roomId: string;
  private userId: string;
  private onStateChange: (state: CallState) => void;
  private onIncomingCall: (isVideo: boolean) => void;

  constructor(
    roomId: string,
    userId: string,
    onStateChange: (state: CallState) => void,
    onIncomingCall: (isVideo: boolean) => void,
  ) {
    this.roomId = roomId;
    this.userId = userId;
    this.onStateChange = onStateChange;
    this.onIncomingCall = onIncomingCall;
    this.setupStorageListener();
  }

  private setupStorageListener() {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `webrtc_${this.roomId}`) {
        const data = JSON.parse(e.newValue || "{}");
        if (data.type === "offer" && data.to === this.userId) {
          this.onIncomingCall(data.isVideo);
        } else if (data.type === "answer" && data.to === this.userId) {
          this.handleAnswer(data.answer);
        } else if (data.type === "ice-candidate" && data.to === this.userId) {
          this.handleIceCandidate(data.candidate);
        } else if (data.type === "call-end" && data.to === this.userId) {
          this.endCall();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
  }

  private sendSignal(data: any) {
    localStorage.setItem(`webrtc_${this.roomId}`, JSON.stringify(data));
    // Trigger storage event for other tabs
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: `webrtc_${this.roomId}`,
        newValue: JSON.stringify(data),
      }),
    );
  }

  async startCall(isVideo: boolean, otherUserId: string) {
    try {
      // Check if we're on HTTPS or localhost
      if (
        location.protocol !== "https:" &&
        location.hostname !== "localhost" &&
        location.hostname !== "127.0.0.1"
      ) {
        throw new Error("HTTPS_REQUIRED");
      }

      // Check permissions first
      if (navigator.permissions) {
        const microphonePermission = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (isVideo) {
          const cameraPermission = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          if (cameraPermission.state === "denied") {
            throw new Error("CAMERA_PERMISSION_DENIED");
          }
        }
        if (microphonePermission.state === "denied") {
          throw new Error("MICROPHONE_PERMISSION_DENIED");
        }
      }

      // Get user media with better constraints
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Add local stream to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0];
        this.updateState({
          isInCall: true,
          isVideoCall: isVideo,
          isAudioCall: !isVideo,
          localStream: this.localStream,
          remoteStream,
          isMuted: false,
          isVideoOff: false,
        });
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignal({
            type: "ice-candidate",
            candidate: event.candidate,
            to: otherUserId,
            from: this.userId,
          });
        }
      };

      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Send offer
      this.sendSignal({
        type: "offer",
        offer,
        isVideo,
        to: otherUserId,
        from: this.userId,
      });

      this.updateState({
        isInCall: true,
        isVideoCall: isVideo,
        isAudioCall: !isVideo,
        localStream: this.localStream,
        remoteStream: null,
        isMuted: false,
        isVideoOff: false,
      });
    } catch (error) {
      console.error("Error starting call:", error);
      throw error;
    }
  }

  async acceptCall(
    offer: RTCSessionDescriptionInit,
    isVideo: boolean,
    otherUserId: string,
  ) {
    try {
      // Check if we're on HTTPS or localhost
      if (
        location.protocol !== "https:" &&
        location.hostname !== "localhost" &&
        location.hostname !== "127.0.0.1"
      ) {
        throw new Error("HTTPS_REQUIRED");
      }

      // Check permissions first
      if (navigator.permissions) {
        const microphonePermission = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (isVideo) {
          const cameraPermission = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          if (cameraPermission.state === "denied") {
            throw new Error("CAMERA_PERMISSION_DENIED");
          }
        }
        if (microphonePermission.state === "denied") {
          throw new Error("MICROPHONE_PERMISSION_DENIED");
        }
      }

      // Get user media with better constraints
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Add local stream
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0];
        this.updateState({
          isInCall: true,
          isVideoCall: isVideo,
          isAudioCall: !isVideo,
          localStream: this.localStream,
          remoteStream,
          isMuted: false,
          isVideoOff: false,
        });
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignal({
            type: "ice-candidate",
            candidate: event.candidate,
            to: otherUserId,
            from: this.userId,
          });
        }
      };

      // Set remote description
      await this.peerConnection.setRemoteDescription(offer);

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Send answer
      this.sendSignal({
        type: "answer",
        answer,
        to: otherUserId,
        from: this.userId,
      });

      this.updateState({
        isInCall: true,
        isVideoCall: isVideo,
        isAudioCall: !isVideo,
        localStream: this.localStream,
        remoteStream: null,
        isMuted: false,
        isVideoOff: false,
      });
    } catch (error) {
      console.error("Error accepting call:", error);
      throw error;
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(answer);
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(candidate);
    }
  }

  endCall(otherUserId?: string) {
    if (otherUserId) {
      this.sendSignal({
        type: "call-end",
        to: otherUserId,
        from: this.userId,
      });
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.updateState({
      isInCall: false,
      isVideoCall: false,
      isAudioCall: false,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
    });
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.updateState({
          isInCall: true,
          isVideoCall: this.localStream.getVideoTracks().length > 0,
          isAudioCall: this.localStream.getVideoTracks().length === 0,
          localStream: this.localStream,
          remoteStream: null,
          isMuted: !audioTrack.enabled,
          isVideoOff: false,
        });
      }
    }
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.updateState({
          isInCall: true,
          isVideoCall: true,
          isAudioCall: false,
          localStream: this.localStream,
          remoteStream: null,
          isMuted: false,
          isVideoOff: !videoTrack.enabled,
        });
      }
    }
  }

  private updateState(state: CallState) {
    this.onStateChange(state);
  }

  cleanup() {
    this.endCall();
  }
}
