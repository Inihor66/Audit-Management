
import React, { useState, useEffect, useCallback } from 'react';
import { Role, User } from './types';
import * as storage from './services/storageService';
import { BriefcaseIcon } from './components/icons/BriefcaseIcon';
import { GraduationCapIcon } from './components/icons/GraduationCapIcon';
import { ShieldCheckIcon } from './components/icons/ShieldCheckIcon';

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
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="nav-brand">
                    <div className="nav-logo-icon">
                        <BriefcaseIcon />
                    </div>
                    <span className="nav-logo-text">AuditFlow</span>
                </div>
                <button onClick={() => onNavigate('signup')} className="nav-cta-button">
                    Create Account
                </button>
            </nav>

            <main className="landing-main">
                <div className="hero-content">
                    <div className="hero-badge">The #1 Platform for CAs</div>
                    <h1 className="hero-title">
                        Audit Management <br />
                        <span className="text-gradient">Reimagined.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Connect CA Firms with dedicated articleship students. Streamline assignments, track progress, and manage secure payments in one professional dashboard.
                    </p>
                    
                    <div className="role-selection-area">
                        <p className="role-select-label">Select your portal to login:</p>
                        <div className="landing-role-grid">
                            <button onClick={() => onNavigate('login', { role: Role.FIRM })} className="landing-role-card firm">
                                <div className="role-icon-wrapper firm">
                                    <BriefcaseIcon />
                                </div>
                                <div className="role-card-content">
                                    <h3>CA Firm</h3>
                                    <p>Post audits & hire students</p>
                                </div>
                                <div className="arrow-icon">&rarr;</div>
                            </button>

                            <button onClick={() => onNavigate('login', { role: Role.STUDENT })} className="landing-role-card student">
                                <div className="role-icon-wrapper student">
                                    <GraduationCapIcon />
                                </div>
                                <div className="role-card-content">
                                    <h3>Student</h3>
                                    <p>Find work & submit reports</p>
                                </div>
                                <div className="arrow-icon">&rarr;</div>
                            </button>

                            <button onClick={() => onNavigate('login', { role: Role.ADMIN })} className="landing-role-card admin">
                                <div className="role-icon-wrapper admin">
                                    <ShieldCheckIcon />
                                </div>
                                <div className="role-card-content">
                                    <h3>Admin</h3>
                                    <p>System controls</p>
                                </div>
                                <div className="arrow-icon">&rarr;</div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="visual-background-shape one"></div>
                    <div className="visual-background-shape two"></div>
                    
                    <div className="app-preview-card">
                        <div className="preview-header">
                            <div className="preview-dot red"></div>
                            <div className="preview-dot yellow"></div>
                            <div className="preview-dot green"></div>
                        </div>
                        <div className="preview-body">
                            <div className="preview-sidebar">
                                <div className="preview-line w-full"></div>
                                <div className="preview-line w-70"></div>
                                <div className="preview-line w-80"></div>
                            </div>
                            <div className="preview-main">
                                <div className="preview-hero-box"></div>
                                <div className="preview-row">
                                    <div className="preview-card-sm"></div>
                                    <div className="preview-card-sm"></div>
                                </div>
                                <div className="preview-list">
                                    <div className="preview-list-item"></div>
                                    <div className="preview-list-item"></div>
                                    <div className="preview-list-item"></div>
                                </div>
                            </div>
                        </div>
                        {/* Floating Badge */}
                        <div className="floating-badge">
                            <div className="badge-icon"><ShieldCheckIcon /></div>
                            <div>
                                <div className="badge-title">Verified</div>
                                <div className="badge-sub">Secure Platform</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            <footer className="landing-footer">
                <p>&copy; {new Date().getFullYear()} Audit Flow Manager. All rights reserved.</p>
                <div className="footer-links">
                    <span>Privacy Policy</span>
                    <span>Terms of Service</span>
                    <span>Contact Support</span>
                </div>
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
