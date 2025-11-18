import React, { useState, useEffect } from 'react';
import * as storage from '../services/storageService';
import { Role, User } from '../types';
import { ROLE_CONFIG } from '../constants';

interface VerifyEmailProps {
  onVerified: (user: User) => void;
  onNavigate: (page: string, role?: Role) => void;
}

const VerifyEmail = ({ onVerified, onNavigate }: VerifyEmailProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem('pendingVerificationUserId');
    setPendingUserId(id);

    if (id) {
      const u = storage.getUserById(id);
      setUser(u || null);
      setInfo(`A verification code was sent to ${u?.email}. Enter it below to verify.`);
    } else {
      setInfo('No pending verification found. You can sign up or go back to login.');
    }
  }, []);

  const handleVerify = () => {
    setError('');
    if (!pendingUserId) {
      setError('No pending verification user.');
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code sent to your email.');
      return;
    }

    try {
      const ok = storage.verifyEmailCode(pendingUserId, code.trim());
      if (!ok) {
        setError('Invalid or expired code.');
        return;
      }
      const verifiedUser = storage.getUserById(pendingUserId);
      if (verifiedUser) {
        sessionStorage.removeItem('pendingVerificationUserId');
        sessionStorage.removeItem('pendingVerificationRole');
        onVerified(verifiedUser);
      } else {
        setError('Verified but user not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    }
  };

  const handleResend = () => {
    setError('');
    if (!pendingUserId) {
      setError('No pending verification user.');
      return;
    }
    try {
      storage.resendEmailVerificationCode(pendingUserId);
      setInfo('Verification code resent to your email.');
    } catch (err: any) {
      setError(err.message || 'Resend failed.');
    }
  };

  const getRoleFromSession = (): Role | undefined => {
    const roleStr = sessionStorage.getItem('pendingVerificationRole');
    if (roleStr === 'FIRM') return Role.FIRM;
    if (roleStr === 'STUDENT') return Role.STUDENT;
    if (roleStr === 'ADMIN') return Role.ADMIN;
    return undefined;
  };

  const role = getRoleFromSession();

  return (
    <div className="page-center">
      <div className="auth-form-card">
        <h2>Verify your email</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>{info}</p>

        {user && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--color-bg-light)', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>{user.name}</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
              {user.email} — <span style={{ fontWeight: 700 }}>{ROLE_CONFIG[user.role].name}</span>
            </p>
          </div>
        )}

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Verification Code</label>
          <input className="form-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter 6-digit code" />
          {error && <p className="form-error">{error}</p>}

          <button onClick={handleResend} className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>Resend Code</button>
          <button onClick={handleVerify} className="btn btn-firm" style={{ width: '100%', marginTop: '0.5rem' }}>Verify & Continue</button>
        </div>

        <div className="auth-links" style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button onClick={() => onNavigate('login', role)} style={{ background: 'none', border: 'none', color: 'var(--color-firm)', cursor: 'pointer' }}>
            Have an account? Login
          </button>
          <br />
          <button onClick={() => onNavigate('welcome')} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            Back to role selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
