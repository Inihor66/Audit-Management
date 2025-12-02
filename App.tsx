
import React, { useState, useEffect, useCallback } from 'react';
import { Role, User } from './types';
import * as storage from './services/storageService';
import { BriefcaseIcon } from './components/icons/BriefcaseIcon';
import { GraduationCapIcon } from './components/icons/GraduationCapIcon';
import { BuildingIcon } from './components/icons/BuildingIcon';

// Dynamically import pages to keep this file cleaner
const FirmDashboard = React.lazy(() => import('./pages/firm/FirmDashboard'));
const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const SignUp = React.lazy(() => import('./pages/SignUp'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmail'));
const FormDetailsPage = React.lazy(() => import('./pages/FormDetailsPage'));


const WelcomePage = ({ onNavigate }: { onNavigate: (page: string, options?: { role?: Role }) => void }) => {
    return (
        <div className="welcome-page">
            <div className="welcome-background-shape"></div>
            
            <div className="welcome-container">
                <div className="welcome-header">
                    <h1 className="welcome-title">Welcome to Audit Management</h1>
                    <p className="welcome-subtitle">Choose your role to get started with the platform.</p>
                </div>

                <div className="welcome-role-grid">
                    {/* Firm Button - Blue with Building */}
                    <button 
                        onClick={() => onNavigate('login', { role: Role.FIRM })} 
                        className="welcome-role-btn firm"
                    >
                        <div className="welcome-icon-circle">
                            <BuildingIcon className="w-8 h-8" />
                        </div>
                        <span className="role-btn-text">Login as Firm</span>
                    </button>

                    {/* Student Button - Orange with Graduation Cap */}
                    <button 
                        onClick={() => onNavigate('login', { role: Role.STUDENT })} 
                        className="welcome-role-btn student"
                    >
                        <div className="welcome-icon-circle">
                            <GraduationCapIcon className="w-8 h-8" />
                        </div>
                        <span className="role-btn-text">Login as Student</span>
                    </button>

                    {/* Admin Button - Green with Briefcase */}
                    <button 
                        onClick={() => onNavigate('login', { role: Role.ADMIN })} 
                        className="welcome-role-btn admin"
                    >
                        <div className="welcome-icon-circle">
                            <BriefcaseIcon className="w-8 h-8" />
                        </div>
                        <span className="role-btn-text">Login as Admin</span>
                    </button>
                </div>

                <div className="welcome-footer">
                    <p>New to the platform?</p>
                    <button onClick={() => onNavigate('signup')} className="welcome-signup-btn">
                        Sign Up
                    </button>
                </div>
            </div>
            
            <footer className="simple-footer">
                &copy; {new Date().getFullYear()} Audit Flow Manager. All rights reserved.
            </footer>
        </div>
    );
};

export default function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [page, setPage] = useState('welcome'); // welcome, login, signup, verify_email, dashboard, form_details
    const [selectedRole, setSelectedRole] = useState<Role | undefined>();
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null); // For verification page
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Run subscription automation rules (Auto-Unlock / Expiry)
        storage.processSubscriptionRules();

        const urlParams = new URLSearchParams(window.location.search);
        const pageFromUrl = urlParams.get('page');

        if (pageFromUrl === 'signup') {
            window.history.replaceState({}, document.title, window.location.pathname);
            setPage('signup');
            setLoading(false);
            return;
        }

        const loggedInUserId = sessionStorage.getItem('loggedInUserId');
        if (loggedInUserId) {
            const user = storage.getUserById(loggedInUserId);
            if (user) {
                setCurrentUser(user);
                setPage('dashboard');
            }
        }
        setLoading(false);
    }, []);

    const handleLogin = useCallback((user: User) => {
        sessionStorage.setItem('loggedInUserId', user.id);
        setCurrentUser(user);
        setPage('dashboard');
    }, []);
    
    const handleLogout = useCallback(() => {
        sessionStorage.removeItem('loggedInUserId');
        setCurrentUser(null);
        setPage('welcome');
        setSelectedFormId(null);
        setSelectedUserId(null);
    }, []);

    const handleNavigate = useCallback((newPage: string, options?: { role?: Role; formId?: string; userId?: string }) => {
        setPage(newPage);
        setSelectedRole(options?.role);
        setSelectedFormId(options?.formId || null);
        setSelectedUserId(options?.userId || null);
    }, []);
    
    const refreshUser = useCallback(() => {
        const loggedInUserId = sessionStorage.getItem('loggedInUserId');
        if (loggedInUserId) {
            // Re-fetch logic to ensure we get latest subscription updates
            const user = storage.getUserById(loggedInUserId);
            if (user) {
                setCurrentUser(user);
            } else {
                handleLogout();
            }
        }
    }, [handleLogout]);

    const renderPage = () => {
        if (loading) {
            return <div className="loading-screen"><p>Loading...</p></div>;
        }

        if (currentUser && page === 'form_details' && selectedFormId) {
            return <FormDetailsPage formId={selectedFormId} user={currentUser} onBack={() => handleNavigate('dashboard')} refreshUser={refreshUser} onLogout={handleLogout} />;
        }
        
        if (currentUser && page === 'dashboard') {
            switch (currentUser.role) {
                case Role.FIRM:
                    return <FirmDashboard user={currentUser} onLogout={handleLogout} refreshUser={refreshUser} onNavigate={handleNavigate}/>;
                case Role.STUDENT:
                    return <StudentDashboard user={currentUser} onLogout={handleLogout} refreshUser={refreshUser} onNavigate={handleNavigate}/>;
                case Role.ADMIN:
                    return <AdminDashboard user={currentUser} onLogout={handleLogout} refreshUser={refreshUser} onNavigate={handleNavigate}/>;
                default:
                    handleLogout();
                    return <WelcomePage onNavigate={handleNavigate} />;
            }
        }

        switch (page) {
            case 'login':
                return <Login onLogin={handleLogin} onNavigate={handleNavigate} role={selectedRole!} />;
            case 'signup':
                return <SignUp onNavigate={handleNavigate} />;
            case 'verify_email':
                 if (!selectedUserId) {
                    // If somehow user lands here without a userId, send them back to welcome
                    return <WelcomePage onNavigate={handleNavigate} />;
                }
                return <VerifyEmailPage userId={selectedUserId} onNavigate={handleNavigate} />;
            case 'welcome':
            default:
                return <WelcomePage onNavigate={handleNavigate} />;
        }
    };

    return (
        <React.Suspense fallback={<div className="loading-screen"><p>Loading...</p></div>}>
            {renderPage()}
        </React.Suspense>
    );
}
