
import React, { useState, useEffect } from 'react';
import { User, Role, Notification } from '../types';
import * as storage from '../services/storageService';
import { LogoutIcon } from './icons/LogoutIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ROLE_CONFIG } from '../constants';
import { NotificationPopup } from './NotificationPopup';
import { Modal } from './Modal';


interface DashboardLayoutProps {
    user: User;
    onLogout: () => void;
    // FIX: Made 'children' prop optional to fix widespread 'missing children' errors.
    children?: React.ReactNode;
    onNavigateToProfile?: () => void;
}

export const DashboardLayout = ({ user, onLogout, children, onNavigateToProfile }: DashboardLayoutProps) => {
    const config = ROLE_CONFIG[user.role];
    const roleClass = user.role.toLowerCase();
    
    // State for Reminders and Notifications
    const [reminders, setReminders] = useState<{formId: string, message: string}[]>([]);
    const [systemNotifications, setSystemNotifications] = useState<Notification[]>([]);
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

    useEffect(() => {
      if (!user) return;
      
      // 1. Check for Form Payment Reminders
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const allForms = storage.getForms();
      let userReminders: {formId: string, message: string}[] = [];

      if (user.role === Role.FIRM) {
        userReminders = allForms
          .filter(f => f.createdByUserId === user.id && f.paymentReminder && !f.reminderNotified && new Date(f.expectedDate) <= today)
          .map(f => ({ formId: f.id, message: `Payment due for audit at ${f.location}.` }));
      } else if (user.role === Role.ADMIN && user.adminCode) {
         const adminCodeLower = user.adminCode.trim().toLowerCase();
         userReminders = allForms
          .filter(f => {
              // Support multiple admin codes (comma separated)
              const formCodes = (f.adminCode || '').split(',').map(c => c.trim().toLowerCase());
              return formCodes.includes(adminCodeLower) && f.paymentReminder && !f.reminderNotified && new Date(f.expectedDate) <= today;
          })
          .map(f => ({ formId: f.id, message: `Payment reminder for ${f.firmName} at ${f.location}.` }));
      }

      setReminders(userReminders);
      
      // Open Modal if there are active payment reminders
      if (userReminders.length > 0) {
          setIsReminderModalOpen(true);
      }

      // 2. Check for System Notifications (e.g., Subscription Active, Expiry warning)
      const unreadNotifications = user.notifications.filter(n => !n.read);
      setSystemNotifications(unreadNotifications);

    }, [user]);

    const handleCloseReminder = (formId: string) => {
        const form = storage.getFormById(formId);
        if (form) {
            storage.updateForm({ ...form, reminderNotified: true });
        }
        setReminders(prev => prev.filter(r => r.formId !== formId));
    };

    const handleCloseSystemNotification = (notificationId: string) => {
        storage.markNotificationAsRead(user.id, notificationId);
        setSystemNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const handleCloseModal = () => {
        setIsReminderModalOpen(false);
        // Optionally mark reminders as notified in background when modal is acknowledged
        reminders.forEach(r => {
             const form = storage.getFormById(r.formId);
             if (form) {
                 storage.updateForm({ ...form, reminderNotified: true });
             }
        });
        // Clear reminders from view since they were acknowledged via modal
        setReminders([]); 
    };

    return (
        <div className="dashboard-layout">
            <header className="dashboard-header">
                <div className="header-container">
                    <div className="header-content">
                        <div className="header-user-info">
                             <span className="user-name">{user.name}</span>
                             <span className={`user-role-badge ${roleClass}`}>{config.name}</span>
                        </div>
                        <div className="header-right">
                            {onNavigateToProfile && (
                                <button
                                    onClick={onNavigateToProfile}
                                    className={`header-icon-button profile-icon ${roleClass}`}
                                    aria-label="View Profile">
                                    <UserCircleIcon className="user-icon" />
                                </button>
                            )}
                            <button
                                onClick={onLogout}
                                className="header-icon-button logout-icon"
                                aria-label="Logout">
                                <LogoutIcon className="logout-icon" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="dashboard-main">
                <div className="main-content-container">
                    {children}
                </div>
            </main>
            
            {/* Notification Toasts */}
            <div className="notification-container">
                {/* Form Payment Reminders */}
                {reminders.map(reminder => (
                    <React.Fragment key={reminder.formId}>
                      <NotificationPopup
                        message={reminder.message}
                        onClose={() => handleCloseReminder(reminder.formId)}
                      />
                    </React.Fragment>
                ))}
                {/* System Notifications */}
                {systemNotifications.map(notification => (
                    <React.Fragment key={notification.id}>
                      <NotificationPopup
                        message={notification.message}
                        onClose={() => handleCloseSystemNotification(notification.id)}
                      />
                    </React.Fragment>
                ))}
            </div>

            {/* Modal for Urgent Reminders (Pop Up) */}
            <Modal isOpen={isReminderModalOpen} onClose={handleCloseModal} title="Payment Reminders">
                <div>
                    <p style={{marginBottom: '1rem', color: 'var(--gray-700)'}}>
                        You have the following pending payment reminders:
                    </p>
                    <ul style={{listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1.5rem', color: 'var(--gray-800)'}}>
                        {reminders.map(r => (
                            <li key={r.formId} style={{marginBottom: '0.5rem', fontWeight: 500}}>
                                {r.message}
                            </li>
                        ))}
                    </ul>
                    <div className="modal-actions">
                         <button onClick={handleCloseModal} className="modal-button save">
                            Acknowledge
                         </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

