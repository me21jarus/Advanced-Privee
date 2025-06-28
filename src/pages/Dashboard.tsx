import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, LogOut, Copy, Check, Clock, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Will redirect
  }

  const handleCreateRoom = () => {
    if (!user) return;

    const newRoomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    setActiveRoom({
      id: newRoomCode,
      createdAt: new Date(),
      participants: 1,
    });
    // Navigate directly to the chat room
    navigate(`/room/${newRoomCode}`);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim() && roomCode.length === 6) {
      // Navigate to the chat room
      navigate(`/room/${roomCode.toUpperCase()}`);
    }
  };

  const copyRoomCode = async () => {
    if (activeRoom) {
      try {
        await navigator.clipboard.writeText(activeRoom.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = activeRoom.id;
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-white dark:from-slate-900 dark:via-gray-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/10 dark:bg-gray-900/10 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-brand-500 to-blue-500 text-white shadow-lg">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold gradient-text">SecureChat</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </span>
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Welcome section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Welcome to your{" "}
              <span className="gradient-text">Secure Dashboard</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Create a private room or join an existing one to start your
              encrypted conversation. Remember: rooms support only 2
              participants for maximum privacy.
            </p>
          </div>

          {/* Active room status */}
          {activeRoom && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="backdrop-blur-sm bg-green-50/80 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
                    <Shield className="h-5 w-5" />
                    Active Room
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-lg font-bold text-green-900 dark:text-green-300">
                        {activeRoom.id}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Created {activeRoom.createdAt.toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      onClick={copyRoomCode}
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-800 hover:bg-green-100 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? "Copied!" : "Copy Code"}
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-green-700 dark:text-green-400">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {activeRoom.participants}/2 participants
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Waiting for guest...
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Action cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create room */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Card className="h-full backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/30 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-brand-500" />
                    Create Room
                  </CardTitle>
                  <CardDescription>
                    Start a new private conversation room and share the code
                    with one person
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>✓ Encrypted room creation</p>
                    <p>✓ Unique 6-character code</p>
                    <p>✓ Maximum 2 participants</p>
                  </div>
                  <Button
                    onClick={handleCreateRoom}
                    className="w-full bg-gradient-to-r from-brand-500 to-blue-500 hover:from-brand-600 hover:to-blue-600"
                    disabled={!!activeRoom}
                  >
                    {activeRoom ? "Room Already Active" : "Create Secure Room"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Join room */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Card className="h-full backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/30 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Join Room
                  </CardTitle>
                  <CardDescription>
                    Enter a room code to join an existing private conversation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomCode">Room Code</Label>
                    <Input
                      id="roomCode"
                      placeholder="Enter 6-character code"
                      value={roomCode}
                      onChange={(e) =>
                        setRoomCode(e.target.value.toUpperCase())
                      }
                      maxLength={6}
                      className="font-mono text-center tracking-widest"
                    />
                  </div>
                  <Button
                    onClick={handleJoinRoom}
                    variant="outline"
                    className="w-full"
                    disabled={roomCode.length !== 6}
                  >
                    Join Secure Room
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Privacy reminder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-center p-6 rounded-xl bg-gradient-to-r from-brand-50 to-blue-50 dark:from-brand-950/50 dark:to-blue-950/50 border border-brand-200 dark:border-brand-800"
          >
            <Shield className="h-8 w-8 text-brand-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Your Privacy is Protected
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              All conversations are end-to-end encrypted. Messages auto-delete
              after 2 minutes. No data is stored permanently on our servers.
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
