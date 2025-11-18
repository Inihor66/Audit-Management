import React, { useState, useEffect, useCallback } from 'react';
import Loader from './components/Loader';
import { Role, User } from './types';
import * as storage from './services/storageService';
import { ROLE_CONFIG } from './constants';
import { BriefcaseIcon, GraduationCapIcon, ShieldCheckIcon } from './components/icons';

const WelcomePage = ({ onNavigate }: { onNavigate: (page: string, role?: Role) => void }) => {
  const RoleButton = ({ role = Role.FIRM, icon, onClick }: { role?: Role, icon: React.ReactNode, onClick: () => void }) => {
    const config = ROLE_CONFIG[role] ?? { hex: "#000", name: "Unknown" };
    return (
      <button onClick={onClick} style={{ backgroundColor: config.hex }}>
        {icon} Login as {config.name}
      </button>
    );
  };

  return (
    <div className="page-center welcome-page">
      <h1>Welcome</h1>
      <div>
        <RoleButton role={Role.FIRM} icon={<BriefcaseIcon />} onClick={() => onNavigate('login', Role.FIRM)} />
        <RoleButton role={Role.STUDENT} icon={<GraduationCapIcon />} onClick={() => onNavigate('login', Role.STUDENT)} />
        <RoleButton role={Role.ADMIN} icon={<ShieldCheckIcon />} onClick={() => onNavigate('login', Role.ADMIN)} />
      </div>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState('welcome');
  const [selectedRole, setSelectedRole] = useState<Role | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedInUserId = sessionStorage.getItem('loggedInUserId');
    if (loggedInUserId) {
      const user = storage.getUserById(loggedInUserId);
      if (user) { setCurrentUser(user); setPage('dashboard'); }
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
    if (role) setSelectedRole(role);
  }, []);

  const refreshUser = useCallback(() => {
    if (currentUser) {
      const fresh = storage.getUserById(currentUser.id);
      if (fresh) setCurrentUser(fresh);
    }
  }, [currentUser]);

  const renderPage = () => {
    if (loading) return <Loader />;

    if (currentUser && page === 'dashboard') {
      switch (currentUser.role) {
        case Role.FIRM: return <div>Firm Dashboard</div>;
        case Role.STUDENT: return <div>Student Dashboard</div>;
        case Role.ADMIN: return <div>Admin Dashboard</div>;
        default: handleLogout(); return <WelcomePage onNavigate={handleNavigate} />;
      }
    }

    switch (page) {
      case 'login': return <div>Login Page - Role: {selectedRole ?? Role.FIRM}</div>;
      case 'signup': return <div>Sign Up Page</div>;
      case 'verify': return <div>Verify Email Page</div>;
      case 'confirm-subscription': return <div>Confirm Subscription Page</div>;
      case 'welcome':
      default: return <WelcomePage onNavigate={handleNavigate} />;
    }
  };

  return <React.Suspense fallback={<Loader />}>{renderPage()}</React.Suspense>;
}
