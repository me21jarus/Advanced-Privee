import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Eye, Camera, Image as ImageIcon } from "lucide-react";
import { SharedImage } from "@/lib/imageManager";

interface ImageViewerProps {
  image: SharedImage | null;
  onClose: () => void;
  onView: () => void;
}

export function ImageViewer({ image, onClose, onView }: ImageViewerProps) {
  const [isViewing, setIsViewing] = useState(false);

  if (!image) return null;

  const handleView = () => {
    setIsViewing(true);
    onView();
    // Auto-close after 10 seconds
    setTimeout(() => {
      onClose();
    }, 10000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative max-w-4xl max-h-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {image.senderName[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {image.senderName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(image.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                View Once
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            {!isViewing ? (
              <div className="space-y-6">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    View-Once Image
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    This image will disappear after you view it. Make sure
                    you're ready!
                  </p>
                  <Button
                    onClick={handleView}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Image
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <img
                  src={image.data}
                  alt="Shared image"
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                />
                <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Image will disappear in 10 seconds
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface ImageNotificationProps {
  count: number;
  onClick: () => void;
}

export function ImageNotification({ count, onClick }: ImageNotificationProps) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed top-20 right-4 z-40"
    >
      <Button
        onClick={onClick}
        className="relative bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
      >
        <Camera className="h-4 w-4 mr-2" />
        New Images
        <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
          {count}
        </Badge>
      </Button>
    </motion.div>
  );
}
