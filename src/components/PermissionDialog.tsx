import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Camera,
  Mic,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Globe,
} from "lucide-react";
import {
  checkBrowserSupport,
  checkHttpsRequirement,
  requestCameraAccess,
  requestMicrophoneAccess,
  getErrorHelp,
  PermissionResult,
} from "@/lib/permissions";

interface PermissionDialogProps {
  open: boolean;
  onClose: () => void;
  type: "camera" | "microphone" | "both";
  onSuccess: () => void;
}

export function PermissionDialog({
  open,
  onClose,
  type,
  onSuccess,
}: PermissionDialogProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<"intro" | "checking" | "error" | "success">(
    "intro",
  );

  const needsCamera = type === "camera" || type === "both";
  const needsMicrophone = type === "microphone" || type === "both";

  const handleCheckPermissions = async () => {
    setIsChecking(true);
    setStep("checking");
    setError("");

    try {
      // Check browser support first
      const browserCheck = checkBrowserSupport();
      if (!browserCheck.granted) {
        setError(browserCheck.error || "Browser not supported");
        setStep("error");
        return;
      }

      // Check HTTPS requirement
      const httpsCheck = checkHttpsRequirement();
      if (!httpsCheck.granted) {
        setError(httpsCheck.error || "HTTPS required");
        setStep("error");
        return;
      }

      // Check permissions based on type
      let cameraResult: PermissionResult = { granted: true };
      let microphoneResult: PermissionResult = { granted: true };

      if (needsCamera) {
        cameraResult = await requestCameraAccess();
        if (!cameraResult.granted) {
          setError(cameraResult.error || "Camera access denied");
          setStep("error");
          return;
        }
      }

      if (needsMicrophone) {
        microphoneResult = await requestMicrophoneAccess();
        if (!microphoneResult.granted) {
          setError(microphoneResult.error || "Microphone access denied");
          setStep("error");
          return;
        }
      }

      // Success!
      setStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Permission check failed");
      setStep("error");
    } finally {
      setIsChecking(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "camera":
        return "Camera Permission Required";
      case "microphone":
        return "Microphone Permission Required";
      case "both":
        return "Camera & Microphone Access Required";
    }
  };

  const getDescription = () => {
    switch (type) {
      case "camera":
        return "We need access to your camera to capture and share photos securely.";
      case "microphone":
        return "We need access to your microphone for audio calls.";
      case "both":
        return "We need access to your camera and microphone for video calls and photo sharing.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex justify-center gap-4">
                  {needsCamera && (
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Camera className="h-8 w-8 text-blue-500" />
                      <span className="text-sm font-medium">Camera</span>
                    </div>
                  )}
                  {needsMicrophone && (
                    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Mic className="h-8 w-8 text-green-500" />
                      <span className="text-sm font-medium">Microphone</span>
                    </div>
                  )}
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Your privacy is protected. We don't store or record any
                    media. All communication is encrypted and ephemeral.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleCheckPermissions}
                  className="w-full"
                  disabled={isChecking}
                >
                  Grant Permissions
                </Button>
              </motion.div>
            )}

            {step === "checking" && (
              <motion.div
                key="checking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-8 space-y-4"
              >
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                <div>
                  <p className="font-medium">Checking permissions...</p>
                  <p className="text-sm text-muted-foreground">
                    Please allow access when prompted by your browser
                  </p>
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8 space-y-4"
              >
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Permissions granted!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You can now use{" "}
                    {type === "both" ? "video calls and camera features" : type}{" "}
                    features
                  </p>
                </div>
              </motion.div>
            )}

            {step === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>

                {error && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <div className="flex gap-3">
                      <Globe className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-blue-700 dark:text-blue-400 mb-2">
                          How to fix this:
                        </div>
                        <pre className="whitespace-pre-wrap text-blue-600 dark:text-blue-300 text-xs">
                          {getErrorHelp(error)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleCheckPermissions}
                    disabled={isChecking}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
