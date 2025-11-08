import React, { useState, useEffect } from 'react';
import * as storage from '../services/storageService';
import { User, Role } from '../types';
import { ROLE_CONFIG } from '../constants';

interface VerifyEmailProps {
  onVerified: (user: User) => void;
  onNavigate: (page: string, role?: any) => void;
}

const VerifyEmail = ({ onVerified, onNavigate }: VerifyEmailProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // First check if URL has userId/code (magic link from email)
    const params = new URLSearchParams(window.location.search);
    const urlUserId = params.get('userId');
    const urlCode = params.get('code');

    if (urlUserId) {
      // persist pending user id so verification works as usual
      sessionStorage.setItem('pendingVerificationUserId', urlUserId);
      setPendingUserId(urlUserId);
      const u = storage.getUserById(urlUserId);
      setUser(u || null);
      setInfo(`A verification code was sent to ${u?.email}. Enter it below to verify.`);
      // If code present in URL, attempt auto-verify
      if (urlCode && /^\d{6}$/.test(urlCode)) {
        try {
          const ok = storage.verifyEmailCode(urlUserId, urlCode);
          if (ok) {
            const verifiedUser = storage.getUserById(urlUserId);
            sessionStorage.removeItem('pendingVerificationUserId');
            sessionStorage.removeItem('pendingVerificationRole');
            if (verifiedUser) onVerified(verifiedUser);
            return;
          } else {
            setInfo('The provided code is invalid or expired. Please request a new code.');
          }
        } catch (err) {
          console.error(err);
          setInfo('Auto verification failed. Please enter the code manually.');
        }
      }
      return;
    }

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
        setError('Invalid or expired code. Please resend if needed.');
        return;
      }
      const verifiedUser = storage.getUserById(pendingUserId);
      if (verifiedUser) {
        // Clear pending keys
        sessionStorage.removeItem('pendingVerificationUserId');
        sessionStorage.removeItem('pendingVerificationRole');
        // Log user in via App handler — this will set loggedInUserId and route to dashboard
        onVerified(verifiedUser);
      } else {
        setError('Verified but user not found. Please contact support.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resend failed.');
    }
  };

  return (
    <div className="page-center">
      <div className="auth-form-container">
        <div className="auth-form-card" style={{maxWidth: '28rem'}}>
          <h2 className="text-center">Verify your email</h2>
          <p style={{color: 'var(--color-text-secondary)', marginTop: '0.5rem'}}>{info}</p>

          {user && (
            <div style={{marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--color-bg-light)', borderRadius: '0.5rem'}}>
              <p style={{margin: 0, fontWeight: 600}}>{user.name}</p>
              <p style={{margin: 0, fontSize: '0.875rem', color: 'var(--color-text-light)'}}>{user.email} — <span style={{fontWeight: 700}}>{ROLE_CONFIG[user.role].name}</span></p>
            </div>
          )}

          <div style={{marginTop: '1rem'}}>
            <div className="form-group">
              <label>Verification Code</label>
              <input className="form-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter 6-digit code" />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end'}}>
              <button onClick={handleResend} className="btn btn-secondary" style={{width: 'auto'}}>Resend Code</button>
              <button onClick={handleVerify} className="btn btn-firm" style={{width: 'auto'}}>Verify & Continue</button>
            </div>

            <div className="auth-links" style={{marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center'}}>
              <button
                onClick={() => {
                  // read pending role (set during signup) to pre-select correct login role
                  const roleStr = sessionStorage.getItem('pendingVerificationRole') as Role | null;
                  const roleArg = roleStr ? (roleStr as Role) : undefined;
                  onNavigate('login', roleArg);
                }}
                style={{background: 'none', border: 'none', color: 'var(--color-firm)', cursor: 'pointer'}}
              >
                Have an account? Login
              </button>
              <button onClick={() => onNavigate('welcome')} style={{background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer'}}>Back to role selection</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
