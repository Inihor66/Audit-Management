import React, { useState, useEffect, useCallback } from 'react';
import { Role, User } from './types';
import * as storage from './services/storageService';
import { ROLE_CONFIG } from './constants';
import { BriefcaseIcon } from './components/icons/BriefcaseIcon';
import { GraduationCapIcon } from './components/icons/GraduationCapIcon';
import { ShieldCheckIcon } from './components/icons/ShieldCheckIcon';

// Lazy load pages
const FirmDashboard = React.lazy(() => import('./pages/firm/FirmDashboard'));
const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const SignUp = React.lazy(() => import('./pages/SignUp'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
const ConfirmSubscription = React.lazy(() => import('./pages/ConfirmSubscription'));
const DevReset = React.lazy(() => import('./pages/DevReset'));

// Loader
const Loader = () => <div className="page-center"><p>Loading...</p></div>;

// (Removed EMAIL button completely)

// Role Button
const RoleButton = ({ role = Role.FIRM, icon, onClick }) => {
    const config = ROLE_CONFIG[role] ?? { hex: "#000000", name: "Unknown" };
    const roleColorStyle = { backgroundColor: config.hex };

    return (
        <button
            onClick={onClick}
            className="role-button"
            style={roleColorStyle}
        >
            {icon} Login as {config.name}
        </button>
    );
};

// Welcome Page (❌ WITHOUT the Send Test Email button)
const WelcomePage = ({ onNavigate }) => (
    <div className="page-center welcome-page">
        <div className="text-center">
            <h1>Welcome</h1>
            <p>Choose your role to get started</p>
        </div>

        <div className="roles-container">
            <RoleButton role={Role.FIRM} icon={<BriefcaseIcon />} onClick={() => onNavigate('login', Role.FIRM)} />
            <RoleButton role={Role.STUDENT} icon={<GraduationCapIcon />} onClick={() => onNavigate('login', Role.STUDENT)} />
            <RoleButton role={Role.ADMIN} icon={<ShieldCheckIcon />} onClick={() => onNavigate('login', Role.ADMIN)} />
        </div>
    </div>
);

export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [page, setPage] = useState('welcome');
    const [selectedRole, setSelectedRole] = useState();
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

        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        if (pathname && pathname.startsWith('/confirm-subscription')) {
            setPage('confirm-subscription');
        }

        setLoading(false);
    }, []);

    const handleLogin = (user) => {
        sessionStorage.setItem('loggedInUserId', user.id);
        setCurrentUser(user);
        setPage('dashboard');
    };

    const handleLogout = () => {
        sessionStorage.removeItem('loggedInUserId');
        setCurrentUser(null);
        setPage('welcome');
    };

    const handleNavigate = useCallback((newPage, role) => {
        setPage(newPage);
        if (role) setSelectedRole(role);
    }, []);

    const refreshUser = useCallback(() => {
        if (currentUser) {
            const freshUser = storage.getUserById(currentUser.id);
            if (freshUser) setCurrentUser(freshUser);
        }
    }, [currentUser]);

    const renderPage = () => {
        if (loading) return <Loader />;

        if (currentUser && page === 'dashboard') {
            switch (currentUser.role) {
                case Role.FIRM:
                    return <FirmDashboard user={currentUser} onLogout={handleLogout} refreshUser={refreshUser} />;
                case Role.STUDENT:
                    return <StudentDashboard user={currentUser} onLogout={handleLogout} refreshUser={refreshUser} />;
                case Role.ADMIN:
                    return <AdminDashboard user={currentUser} onLogout={handleLogout} refreshUser={refreshUser} />;
                default:
                    handleLogout();
                    return <WelcomePage onNavigate={handleNavigate} />;
            }
        }

        switch (page) {
            case 'login':
                return <Login onLogin={handleLogin} onNavigate={handleNavigate} role={selectedRole ?? Role.FIRM} />;
            case 'signup':
                return <SignUp onSignUp={handleLogin} onNavigate={handleNavigate} role={selectedRole ?? Role.FIRM} />;
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

    return <React.Suspense fallback={<Loader />}>{renderPage()}</React.Suspense>;
}
