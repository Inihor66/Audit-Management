
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
            {/* Animated Background Elements */}
            <div className="bg-shape shape-1"></div>
            <div className="bg-shape shape-2"></div>
            <div className="bg-shape shape-3"></div>

            {/* Navbar */}
            <nav className="landing-navbar">
                <div className="logo-container">
                    <div className="logo-icon">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <span className="logo-text">AuditFlow</span>
                </div>
                <button onClick={() => onNavigate('signup')} className="nav-signup-btn">
                    Create Account
                </button>
            </nav>
            
            <div className="welcome-container">
                <div className="welcome-header">
                    <span className="welcome-badge">The #1 Platform for CA Firms & Students</span>
                    <h1 className="welcome-title">Streamline Your <br/><span className="gradient-text">Audit Workflow</span></h1>
                    <p className="welcome-subtitle">
                        Connect firms with talented students, manage assignments, and track payments in one secure, professional dashboard.
                    </p>
                </div>

                <div className="role-selection-area">
                    <p className="role-select-label">Select your portal to login</p>
                    <div className="welcome-role-grid">
                        {/* Firm Button */}
                        <button 
                            onClick={() => onNavigate('login', { role: Role.FIRM })} 
                            className="welcome-role-card firm"
                        >
                            <div className="card-icon firm">
                                <BuildingIcon className="w-6 h-6" />
                            </div>
                            <div className="card-content">
                                <h3>CA Firm</h3>
                                <p>Post work & manage audits</p>
                            </div>
                            <div className="card-arrow">&rarr;</div>
                        </button>

                        {/* Student Button */}
                        <button 
                            onClick={() => onNavigate('login', { role: Role.STUDENT })} 
                            className="welcome-role-card student"
                        >
                            <div className="card-icon student">
                                <GraduationCapIcon className="w-6 h-6" />
                            </div>
                            <div className="card-content">
                                <h3>Student</h3>
                                <p>Find articleship & audits</p>
                            </div>
                            <div className="card-arrow">&rarr;</div>
                        </button>

                        {/* Admin Button */}
                        <button 
                            onClick={() => onNavigate('login', { role: Role.ADMIN })} 
                            className="welcome-role-card admin"
                        >
                            <div className="card-icon admin">
                                <BriefcaseIcon className="w-6 h-6" />
                            </div>
                            <div className="card-content">
                                <h3>Admin</h3>
                                <p>System administration</p>
                            </div>
                            <div className="card-arrow">&rarr;</div>
                        </button>
                    </div>
                </div>
            </div>
            
            <footer className="landing-footer">
                <p>&copy; {new Date().getFullYear()} Audit Flow Manager. Secure. Efficient. Reliable.</p>
                <div className="footer-links">
                    <button className="text-link">Privacy Policy</button>
                    <button className="text-link">Terms of Service</button>
                    <button className="text-link">Support</button>
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
        const formIdFromUrl = urlParams.get('formId');
        const roleFromUrl = urlParams.get('role');

        const loggedInUserId = sessionStorage.getItem('loggedInUserId');
        let user: User | undefined;

        if (loggedInUserId) {
            user = storage.getUserById(loggedInUserId);
            if (user) {
                setCurrentUser(user);
            }
        }

        // DEEP LINK LOGIC: Handle direct links to specific forms (e.g., Shareable links)
        if (pageFromUrl === 'form_details' && formIdFromUrl) {
            // Remove params from URL to clean it up, but keep internal state
            window.history.replaceState({}, document.title, window.location.pathname);
            
            if (user) {
                // User is already logged in, go directly to form
                setPage('form_details');
                setSelectedFormId(formIdFromUrl);
            } else {
                // User NOT logged in. Store intended destination and redirect to login.
                sessionStorage.setItem('pendingFormId', formIdFromUrl);
                
                // If the link explicitly specifies a role (e.g. STUDENT), default to that login page
                if (roleFromUrl === Role.STUDENT) {
                    setSelectedRole(Role.STUDENT);
                } else {
                    // Default to Student login for shareable links if not specified, 
                    // as these are usually shared with students.
                    setSelectedRole(Role.STUDENT);
                }
                setPage('login');
            }
            setLoading(false);
            return;
        }

        // Handle Signup Page Direct Link
        if (pageFromUrl === 'signup') {
            window.history.replaceState({}, document.title, window.location.pathname);
            setPage('signup');
            setLoading(false);
            return;
        }

        // Normal Session Restoration
        if (user) {
            setPage('dashboard');
        }

        setLoading(false);
    }, []);

    const handleLogin = useCallback((user: User) => {
        sessionStorage.setItem('loggedInUserId', user.id);
        setCurrentUser(user);

        // Check for pending Deep Link (Shareable Link redirection)
        const pendingFormId = sessionStorage.getItem('pendingFormId');
        if (pendingFormId) {
            sessionStorage.removeItem('pendingFormId'); // Clear it
            setSelectedFormId(pendingFormId);
            setPage('form_details');
        } else {
            setPage('dashboard');
        }
    }, []);
    
    const handleLogout = useCallback(() => {
        sessionStorage.removeItem('loggedInUserId');
        sessionStorage.removeItem('pendingFormId');
        setCurrentUser(null);
        setPage('welcome');
        setSelectedFormId(null);
        setSelectedUserId(null);
    }, []);

    const handleNavigate = useCallback((newPage: string, options?: { role?: Role; formId?: string; userId?: string }) => {
        setPage(newPage);
        if (options?.role) setSelectedRole(options.role);
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
            // FIXED: Removed onNavigate prop which caused type error
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

