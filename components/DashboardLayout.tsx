import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import * as storage from '../services/storageService';
import { LogoutIcon } from './icons/LogoutIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ROLE_CONFIG } from '../constants';
import { NotificationPopup } from './NotificationPopup';


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
    const [reminders, setReminders] = useState<{formId: string, message: string}[]>([]);

    useEffect(() => {
      if (!user) return;
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const allForms = storage.getForms();
      let userReminders: {formId: string, message: string}[] = [];

      if (user.role === Role.FIRM) {
        userReminders = allForms
          .filter(f => f.createdByUserId === user.id && f.paymentReminder && !f.reminderNotified && new Date(f.expectedDate) <= today)
          .map(f => ({ formId: f.id, message: `Payment reminder for audit at ${f.location}.` }));
      } else if (user.role === Role.ADMIN && user.adminCode) {
         userReminders = allForms
          .filter(f => f.adminCode?.trim().toLowerCase() === user.adminCode?.trim().toLowerCase() && f.paymentReminder && !f.reminderNotified && new Date(f.expectedDate) <= today)
          .map(f => ({ formId: f.id, message: `Payment reminder for ${f.firmName} at ${f.location}.` }));
      }

      setReminders(userReminders);
    }, [user]);

    const handleCloseReminder = (formId: string) => {
        const form = storage.getFormById(formId);
        if (form) {
            storage.updateForm({ ...form, reminderNotified: true });
        }
        setReminders(prev => prev.filter(r => r.formId !== formId));
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
            <div className="notification-container">
                {reminders.map(reminder => (
                    // FIX: Wrap NotificationPopup in a React.Fragment to resolve a TypeScript error where the 'key' prop was incorrectly being checked against NotificationPopup's props.
                    <React.Fragment key={reminder.formId}>
                      <NotificationPopup
                        message={reminder.message}
                        onClose={() => handleCloseReminder(reminder.formId)}
                      />
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
