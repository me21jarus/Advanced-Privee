// Image capture and sharing utilities with view-once feature

export interface SharedImage {
  id: string;
  data: string; // base64 encoded image
  sender: string;
  senderName: string;
  timestamp: Date;
  roomId: string;
  viewed: boolean;
  viewedBy: string[];
}

// Capture image from camera
export const captureImageFromCamera = (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if we're on HTTPS or localhost
      if (
        location.protocol !== "https:" &&
        location.hostname !== "localhost" &&
        location.hostname !== "127.0.0.1"
      ) {
        reject(
          new Error(
            "Camera access requires HTTPS. Please use HTTPS or localhost for development.",
          ),
        );
        return;
      }

      // Check camera permission
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        if (permission.state === "denied") {
          reject(
            new Error(
              "Camera permission denied. Please enable camera access in your browser settings.",
            ),
          );
          return;
        }
      }

      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Create a container for the camera UI
        const container = document.createElement("div");
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          `;

        video.style.cssText = `
            max-width: 90vw;
            max-height: 70vh;
            border-radius: 12px;
          `;

        const buttonContainer = document.createElement("div");
        buttonContainer.style.cssText = `
            display: flex;
            gap: 16px;
            margin-top: 20px;
          `;

        const captureBtn = document.createElement("button");
        captureBtn.textContent = "📸 Capture";
        captureBtn.style.cssText = `
            padding: 12px 24px;
            background: #059669;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
          `;

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "❌ Cancel";
        cancelBtn.style.cssText = `
            padding: 12px 24px;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
          `;

        captureBtn.onclick = () => {
          context?.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL("image/jpeg", 0.8);

          // Stop camera
          stream.getTracks().forEach((track) => track.stop());
          document.body.removeChild(container);

          resolve(imageData);
        };

        cancelBtn.onclick = () => {
          stream.getTracks().forEach((track) => track.stop());
          document.body.removeChild(container);
          reject(new Error("Camera capture cancelled"));
        };

        buttonContainer.appendChild(captureBtn);
        buttonContainer.appendChild(cancelBtn);
        container.appendChild(video);
        container.appendChild(buttonContainer);
        document.body.appendChild(container);
      };
    } catch (error) {
      reject(error);
    }
  });
};

// Select image from file system
export const selectImageFromFile = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(file);
    };

    input.click();
  });
};

// Share image in room (view-once)
export const shareImage = (
  roomId: string,
  imageData: string,
  userId: string,
  userName: string,
): void => {
  const rooms = JSON.parse(localStorage.getItem("securechat_rooms") || "{}");
  const room = rooms[roomId];

  if (!room) return;

  const sharedImage: SharedImage = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    data: imageData,
    sender: userId,
    senderName: userName,
    timestamp: new Date(),
    roomId,
    viewed: false,
    viewedBy: [],
  };

  // Add to room's shared images
  if (!room.sharedImages) {
    room.sharedImages = [];
  }
  room.sharedImages.push(sharedImage);

  // Save and trigger update
  localStorage.setItem("securechat_rooms", JSON.stringify(rooms));
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "securechat_rooms",
      newValue: JSON.stringify(rooms),
    }),
  );
};

// View image (mark as viewed, then remove)
export const viewImage = (
  roomId: string,
  imageId: string,
  userId: string,
): string | null => {
  const rooms = JSON.parse(localStorage.getItem("securechat_rooms") || "{}");
  const room = rooms[roomId];

  if (!room || !room.sharedImages) return null;

  const imageIndex = room.sharedImages.findIndex(
    (img: SharedImage) => img.id === imageId,
  );
  if (imageIndex === -1) return null;

  const image = room.sharedImages[imageIndex];

  // Check if already viewed by this user
  if (image.viewedBy.includes(userId)) {
    return null; // Already viewed
  }

  // Mark as viewed by this user
  image.viewedBy.push(userId);

  // If viewed by all participants, remove the image
  const participantIds = room.participants.map((p: any) => p.id);
  const allViewed = participantIds.every((id: string) =>
    image.viewedBy.includes(id),
  );

  let imageData = image.data;

  if (allViewed) {
    // Remove image after being viewed by all
    room.sharedImages.splice(imageIndex, 1);
  }

  // Save changes
  localStorage.setItem("securechat_rooms", JSON.stringify(rooms));
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "securechat_rooms",
      newValue: JSON.stringify(rooms),
    }),
  );

  return imageData;
};

// Get pending images for user
export const getPendingImages = (
  roomId: string,
  userId: string,
): SharedImage[] => {
  const rooms = JSON.parse(localStorage.getItem("securechat_rooms") || "{}");
  const room = rooms[roomId];

  if (!room || !room.sharedImages) return [];

  return room.sharedImages.filter(
    (img: SharedImage) =>
      img.sender !== userId && // Not sent by current user
      !img.viewedBy.includes(userId), // Not yet viewed by current user
  );
};
