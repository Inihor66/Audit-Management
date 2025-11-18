import React, { useState } from 'react';
import { Role, User } from '../types';
import * as storage from '../services/storageService';
import { ROLE_CONFIG } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigate: (page: string, role?: Role) => void;
  role?: Role; // optional, will get from sessionStorage if undefined
}

const Login = ({ onLogin, onNavigate, role: initialRole }: LoginProps) => {
  const getRoleFromSession = (): Role => {
    if (initialRole) return initialRole;
    const roleStr = sessionStorage.getItem('pendingVerificationRole');
    if (roleStr === 'FIRM') return Role.FIRM;
    if (roleStr === 'STUDENT') return Role.STUDENT;
    if (roleStr === 'ADMIN') return Role.ADMIN;
    return Role.FIRM; // default fallback
  };

  const role = getRoleFromSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const config = ROLE_CONFIG[role] ?? { hex: "#000000", name: 'User' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const users = storage.getUsers();
      const user = users.find(u => u.role === role && u.email.toLowerCase() === email.toLowerCase());

      if (user && user.passwordHash === password) {
        if ((user.role === Role.FIRM || user.role === Role.ADMIN) && !user.emailVerified) {
          setError('Email not verified. Please verify it via the verification page.');
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
  };

  return (
    <div className="page-center">
      <div className="auth-form-container">
        <div className="auth-form-card">
          <h2>Login as {config.name}</h2>

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

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <button type="submit" className={`btn ${getRoleButtonClass()}`}>
                Log in
              </button>
            </div>
          </form>

          <div className="auth-links" style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              onClick={() => onNavigate('signup', role)}
              style={{ background: 'none', border: 'none', color: 'var(--color-firm)', cursor: 'pointer', marginBottom: '0.5rem' }}
            >
              Don't have an account? Sign up
            </button>
            <br />
            <button
              onClick={() => onNavigate('welcome')}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
            >
              Back to role selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
