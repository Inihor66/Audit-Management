import React, { useState } from 'react';
import { Role, User } from '../types';
import * as storage from '../services/storageService';
import { ROLE_CONFIG } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigate: (page: string, role?: Role) => void;
  role: Role;
}

const Login = ({ onLogin, onNavigate, role }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const config = ROLE_CONFIG[role] ?? { freeEntries: 0, hex: "#000000" };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const users = storage.getUsers();
      const user = users.find(u => u.role === role && u.email.toLowerCase() === email.toLowerCase());
      
      // NOTE: In a real app, passwords would be hashed. This is a simulation.
      if (user && user.passwordHash === password) {
        // For Firm/Admin require email to be verified before allowing login.
        if ((user.role === Role.FIRM || user.role === Role.ADMIN) && !user.emailVerified) {
          setError('Email not verified. Please verify your email via the verification page (Sign up flow) before logging in.');
          return;
        }
        onLogin(user);
      } else {
        setError('Invalid email or password.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    }
  };

  const getRoleButtonClass = () => {
      switch (role) {
          case Role.FIRM: return 'btn-firm';
          case Role.STUDENT: return 'btn-student';
          case Role.ADMIN: return 'btn-admin';
          default: return '';
      }
  }

  return (
    <div className="page-center">
      <div className="auth-form-container">
        <div className="auth-form-card">
          <h2>
            Login as a {config.name}
          </h2>
          {/* Standard login form (verification handled during signup -> verify page) */}
           <form onSubmit={handleSubmit}>
             <div className="form-group">
               <label htmlFor="email">Email address</label>
               <input
                 id="email"
                 name="email"
                 type="email"
                 autoComplete="email"
                 required
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="form-input"
               />
             </div>

             <div className="form-group">
               <label htmlFor="password">Password</label>
               <input
                 id="password"
                 name="password"
                 type="password"
                 autoComplete="current-password"
                 required
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="form-input"
               />
             </div>

             {error && <p className="form-error">{error}</p>}

             <div style={{marginTop: '2rem'}}>
               <button
                 type="submit"
                 className={`btn ${getRoleButtonClass()}`}
               >
                 Log in
               </button>
             </div>
           </form>
          
          {/* Auth links: Sign up, and Back to role selection */}
          <div className="auth-links" style={{marginTop: '1rem'}}>
            <button onClick={() => onNavigate('signup', role)} className="btn btn-secondary" style={{background: 'none', color: 'var(--color-firm)'}}>
              Don't have an account? Sign up
            </button>
            <button onClick={() => onNavigate('welcome')} className="btn btn-secondary" style={{background: 'none', color: 'var(--color-text-secondary)'}}>
              Back to role selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
