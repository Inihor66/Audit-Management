import React from 'react';
import { User } from '../types';
import { LogoutIcon } from './icons/LogoutIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ROLE_CONFIG } from '../constants';

interface DashboardLayoutProps {
    user: User;
    onLogout: () => void;
    children: React.ReactNode;
    onNavigateToProfile?: () => void;
}

export const DashboardLayout = ({ user, onLogout, children, onNavigateToProfile }: DashboardLayoutProps) => {
    const config = ROLE_CONFIG[user.role];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="header-user-info">
                         <span className="user-name">{user.name}</span>
                         <span className={`role-tag role-tag-${user.role}`}>{config.name}</span>
                    </div>
                    <div className="header-actions">
                         {onNavigateToProfile && (
                            <button
                                onClick={onNavigateToProfile}
                                className="header-action-btn profile-btn"
                                aria-label="View Profile"
                            >
                                <UserCircleIcon />
                            </button>
                         )}
                        <button
                            onClick={onLogout}
                            className="header-action-btn logout-btn"
                            aria-label="Logout"
                        >
                            <LogoutIcon />
                        </button>
                    </div>
                </div>
            </header>
            <main>
                <div className="container">
                    {children}
                </div>
            </main>
        </div>
    );
};