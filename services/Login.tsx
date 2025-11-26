import React, { useState } from 'react';
import { Role, User } from '../types';
import * as storage from '../services/storageService';
import { ROLE_CONFIG } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigate: (page: string, options?: { role?: Role }) => void;
  role: Role;
}

const Login = ({ onLogin, onNavigate, role }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const config = ROLE_CONFIG[role];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const users = storage.getUsers();
      const user = users.find(u => u.role === role && u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
        // NOTE: In a real app, passwords would be hashed. This is a simulation.
        // Verification check is removed as all users are now auto-verified.
        if (user.passwordHash === password) {
          onLogin(user);
        } else {
          setError('Invalid email or password.');
        }
      } else {
        setError('Invalid email or password.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2 className="auth-title">
          Login as a {config.name}
        </h2>
      </div>

      <div className="auth-form-container">
        <div className="auth-form-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
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
              <label htmlFor="password" className="form-label">
                Password
              </label>
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

            {error && <p className="error-message">{error}</p>}

            <div>
              <button
                type="submit"
                className={`submit-button ${role.toLowerCase()}`}
              >
                Log in
              </button>
            </div>
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line-container">
              <div className="auth-divider-line" />
            </div>
            <div className="auth-divider-text-container">
              <span className="auth-divider-text">Or</span>
            </div>
          </div>

          <div className="auth-footer">
            <button onClick={() => onNavigate('signup')} className="auth-footer-link">
              Create a new account
            </button>
            <button onClick={() => onNavigate('welcome')} className="auth-footer-link">
              Back to role selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
