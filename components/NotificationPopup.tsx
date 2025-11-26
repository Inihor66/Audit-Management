
import React, { useEffect } from 'react';

interface NotificationPopupProps {
  message: string;
  onClose: () => void;
}

export const NotificationPopup = ({ message, onClose }: NotificationPopupProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="notification-popup">
      <p>{message}</p>
      <button onClick={onClose} className="notification-close-btn" aria-label="Close notification">&times;</button>
    </div>
  );
};
