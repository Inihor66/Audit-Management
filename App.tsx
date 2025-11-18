import React, { useState, useEffect, useCallback } from 'react';
import { Role, User } from './types';
import * as storage from './services/storageService';
import { ROLE_CONFIG } from './constants';
import { BriefcaseIcon } from './components/icons/BriefcaseIcon';
import { GraduationCapIcon } from './components/icons/GraduationCapIcon';
import { ShieldCheckIcon } from './components/icons/ShieldCheckIcon';

// Dynamically import pages to keep this file cleaner
const FirmDashboard = React.lazy(() => import('./pages/firm/FirmDashboard'));
const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const SignUp = React.lazy(() => import('./pages/SignUp'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
const ConfirmSubscription = React.lazy(() => import('./pages/ConfirmSubscription'));
const DevReset = React.lazy(() => import('./pages/DevReset'));

const WelcomePage = ({ onNavigate }: { onNavigate: (page: string, role?: Role) => void }) => {
    return (
        <div className="page-center welcome-page">
            <div className="text-center">
                <h1>Welcome</h1>
                <p>Choose your role to get started</p>
            </div>
            <div className="roles-container">
                <RoleButton 
                    role={Role.FIRM} 
                    icon={<BriefcaseIcon />}
                    onClick={() => onNavigate('login', Role.FIRM)}
                />
                <RoleButton 
                    role={Role.STUDENT} 
                    icon={<GraduationCapIcon />}
                    onClick={() => onNavigate('login', Role.STUDENT)}
                />
                <RoleButton 
                    role={Role.ADMIN} 
                    icon={<ShieldCheckIcon />}
                    onClick={() => onNavigate('login', Role.ADMIN)}
                />
            </div>
             {/* The "Sign Up" button was removed from here per user request */}
        </div>
    );
};
if (!role) role = Role.FIRM; // default fallback
const RoleButton = ({ role, icon, onClick }: { role: Role, icon: React.ReactNode, onClick: () => void }) => {
    const config = ROLE_CONFIG[role] ?? { hex: "#000000" };
    const roleColorStyle = { backgroundColor: config.hex };

    return (
        <button
            onClick={onClick}
            className="role-button"
            style={roleColorStyle}
        >
            {icon}
            Login as {config.name}
        </button>
    );
};


export default function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [page, setPage] = useState('welcome'); // welcome, login, signup, dashboard
    const [selectedRole, setSelectedRole] = useState<Role | undefined>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loggedInUserId = sessionStorage.getItem('loggedInUserId');
        if (loggedInUserId) {
            const user = storage.getUserById(loggedInUserId);
            if (user) {
                setCurrentUser(user);
                setPage('dashboard');
            }
        }
        // If the app was opened via a confirmation link, show the confirmation page
        try {
            const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
            if (pathname && pathname.startsWith('/confirm-subscription')) {
                setPage('confirm-subscription');
            }
        } catch (err) {
            // ignore
        }
        setLoading(false);
    }, []);

    const handleLogin = (user: User) => {
        sessionStorage.setItem('loggedInUserId', user.id);
        setCurrentUser(user);
        setPage('dashboard');
    };
    
    const handleLogout = () => {
        sessionStorage.removeItem('loggedInUserId');
        setCurrentUser(null);
        setPage('welcome');
    };

    const handleNavigate = useCallback((newPage: string, role?: Role) => {
        setPage(newPage);
        if (role) {
            setSelectedRole(role);
        }
    }, []);
    
    const refreshUser = () => {
        if(currentUser) {
            const freshUser = storage.getUserById(currentUser.id);
            if (freshUser) {
                setCurrentUser(freshUser);
            }
        }
    };

    const renderPage = () => {
        if (loading) {
            return <div className="page-center"><p>Loading...</p></div>;
        }

        if (currentUser && page === 'dashboard') {
            switch (currentUser.role) {
                case Role.FIRM:
                    return <FirmDashboard user={currentUser} onLogout={handleLogout} refreshUser={refreshUser}/>;
                case Role.STUDENT:
                    return <StudentDashboard user={currentUser} onLogout={handleLogout} refreshUser={refreshUser}/>;
                case Role.ADMIN:
                    return <AdminDashboard user={currentUser} onLogout={handleLogout} refreshUser={refreshUser}/>;
                default:
                    handleLogout();
                    return <WelcomePage onNavigate={handleNavigate} />;
            }
        }

        switch (page) {
            case 'login':
                return <Login onLogin={handleLogin} onNavigate={handleNavigate} role={selectedRole!} />;
            case 'signup':
                return <SignUp onSignUp={handleLogin} onNavigate={handleNavigate} />;
            case 'verify':
                return <VerifyEmail onVerified={handleLogin} onNavigate={handleNavigate} />;
            case 'confirm-subscription':
                return <ConfirmSubscription />;
            case 'dev-reset':
                return <DevReset />;
            case 'welcome':
            default:
                return <WelcomePage onNavigate={handleNavigate} />;
        }
    };

    return (
        <React.Suspense fallback={<div className="page-center"><p>Loading...</p></div>}>
            {renderPage()}
        </React.Suspense>
    );
}
