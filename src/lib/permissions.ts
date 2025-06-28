// Permission checking utilities

export interface PermissionResult {
  granted: boolean;
  error?: string;
  requiresHttps?: boolean;
}

// Check if browser supports required APIs
export const checkBrowserSupport = (): PermissionResult => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      granted: false,
      error:
        "Your browser doesn't support camera/microphone access. Please use a modern browser like Chrome, Firefox, or Safari.",
    };
  }

  if (!window.RTCPeerConnection) {
    return {
      granted: false,
      error:
        "Your browser doesn't support video calls. Please use a modern browser.",
    };
  }

  return { granted: true };
};

// Check HTTPS requirement
export const checkHttpsRequirement = (): PermissionResult => {
  const isLocalhost =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]";

  if (location.protocol !== "https:" && !isLocalhost) {
    return {
      granted: false,
      requiresHttps: true,
      error:
        "Camera and microphone access requires HTTPS. Please use HTTPS in production or localhost for development.",
    };
  }

  return { granted: true };
};

// Check camera permission
export const checkCameraPermission = async (): Promise<PermissionResult> => {
  try {
    // First check browser support
    const browserCheck = checkBrowserSupport();
    if (!browserCheck.granted) return browserCheck;

    // Check HTTPS requirement
    const httpsCheck = checkHttpsRequirement();
    if (!httpsCheck.granted) return httpsCheck;

    // Check if permissions API is available
    if (navigator.permissions) {
      const permission = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      if (permission.state === "denied") {
        return {
          granted: false,
          error:
            "Camera access denied. Please enable camera permissions in your browser settings and refresh the page.",
        };
      }
    }

    return { granted: true };
  } catch (error) {
    return {
      granted: false,
      error: "Unable to check camera permissions. Please try again.",
    };
  }
};

// Check microphone permission
export const checkMicrophonePermission =
  async (): Promise<PermissionResult> => {
    try {
      // First check browser support
      const browserCheck = checkBrowserSupport();
      if (!browserCheck.granted) return browserCheck;

      // Check HTTPS requirement
      const httpsCheck = checkHttpsRequirement();
      if (!httpsCheck.granted) return httpsCheck;

      // Check if permissions API is available
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (permission.state === "denied") {
          return {
            granted: false,
            error:
              "Microphone access denied. Please enable microphone permissions in your browser settings and refresh the page.",
          };
        }
      }

      return { granted: true };
    } catch (error) {
      return {
        granted: false,
        error: "Unable to check microphone permissions. Please try again.",
      };
    }
  };

// Request camera access with user-friendly handling
export const requestCameraAccess = async (): Promise<PermissionResult> => {
  const permissionCheck = await checkCameraPermission();
  if (!permissionCheck.granted) return permissionCheck;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Stop the stream immediately - we just wanted to test permissions
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (error: any) {
    if (error.name === "NotAllowedError") {
      return {
        granted: false,
        error:
          "Camera access denied. Please click 'Allow' when prompted and refresh the page if needed.",
      };
    } else if (error.name === "NotFoundError") {
      return {
        granted: false,
        error: "No camera found. Please connect a camera and try again.",
      };
    } else {
      return {
        granted: false,
        error: `Camera error: ${error.message}`,
      };
    }
  }
};

// Request microphone access with user-friendly handling
export const requestMicrophoneAccess = async (): Promise<PermissionResult> => {
  const permissionCheck = await checkMicrophonePermission();
  if (!permissionCheck.granted) return permissionCheck;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately - we just wanted to test permissions
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (error: any) {
    if (error.name === "NotAllowedError") {
      return {
        granted: false,
        error:
          "Microphone access denied. Please click 'Allow' when prompted and refresh the page if needed.",
      };
    } else if (error.name === "NotFoundError") {
      return {
        granted: false,
        error:
          "No microphone found. Please connect a microphone and try again.",
      };
    } else {
      return {
        granted: false,
        error: `Microphone error: ${error.message}`,
      };
    }
  }
};

// Get helpful error message based on error type
export const getErrorHelp = (error: string): string => {
  if (error.includes("HTTPS")) {
    return "💡 To enable camera/microphone:\n• Use HTTPS in production\n• Use localhost for development\n• Chrome/Firefox require secure contexts for media access";
  }

  if (error.includes("denied") || error.includes("NotAllowedError")) {
    return "💡 To fix permission issues:\n• Click 'Allow' when browser asks for permissions\n• Check browser settings (click lock icon in address bar)\n• Refresh the page after granting permissions\n• Make sure no other app is using camera/microphone";
  }

  if (error.includes("NotFoundError")) {
    return "💡 Device not found:\n• Connect camera/microphone\n• Check device drivers\n• Try a different browser\n• Restart your browser";
  }

  return "💡 Try these steps:\n• Refresh the page\n• Check browser settings\n• Try a different browser\n• Restart your device";
};
