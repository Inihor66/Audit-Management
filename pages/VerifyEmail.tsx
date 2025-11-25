
import React, { useState, useEffect } from 'react';
import * as storage from '../services/storageService';
import { User, Role } from '../types';

interface VerifyEmailPageProps {
    userId: string;
    onNavigate: (page: string, options?: { role?: Role }) => void;
}

const VerifyEmailPage = ({ userId, onNavigate }: VerifyEmailPageProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [verificationCodeInput, setVerificationCodeInput] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [error, setError] = useState('');
    const [emailContent, setEmailContent] = useState('');
    const [emailStatus, setEmailStatus] = useState<'sending' | 'sent'>('sending');

    useEffect(() => {
        const foundUser = storage.getUserById(userId);
        if (foundUser) {
            setUser(foundUser);
            if (foundUser.isVerified) {
                setIsVerified(true);
            } else {
                // Generate email content locally for reliability
                const code = foundUser.verificationCode || 'ERROR';
                const content = `Hi ${foundUser.name},

Your verification code for Audit Flow Manager is: ${code}

Please enter this code in the verification page to activate your account.

Best regards,
Audit Flow Manager Team`;
                setEmailContent(content);
                
                // Simulate network delay
                const timer = setTimeout(() => {
                    setEmailStatus('sent');
                }, 1500);
                return () => clearTimeout(timer);
            }
        } else {
            setError('User not found. You may need to sign up again.');
        }
    }, [userId]);

    const handleVerify = () => {
        setError('');
        if (user && user.verificationCode) {
            if (verificationCodeInput === user.verificationCode) {
                const updatedUser = { ...user, isVerified: true, verificationCode: undefined };
                storage.updateUser(updatedUser);
                setIsVerified(true);
            } else {
                setError('Invalid verification code. Please try again.');
            }
        } else {
             setError('Verification code error. Please contact support.');
        }
    };

    const handleOpenMailClient = () => {
        if (!user || !emailContent) return;
        const subject = encodeURIComponent("Verify Your Account - Audit Flow Manager");
        const body = encodeURIComponent(emailContent);
        // Opens the user's default mail client with the email draft
        window.location.href = `mailto:${user.email}?subject=${subject}&body=${body}`;
    };

    if (error && !user) {
        return (
            <div className="auth-page">
                <div className="auth-form-card" style={{maxWidth: '32rem', margin: '0 auto'}}>
                    <h2 className="auth-title">Error</h2>
                    <p className="error-message">{error}</p>
                    <button onClick={() => onNavigate('signup')} className="submit-button firm" style={{marginTop: '1rem'}}>Go to Sign Up</button>
                </div>
            </div>
        );
    }

    if (!user) {
        return <div className="loading-screen"><p>Loading...</p></div>;
    }

    return (
        <div className="auth-page">
            <div className="auth-form-card" style={{maxWidth: '36rem', margin: '0 auto', textAlign: 'center'}}>
                <h2 className="auth-title">Verify Your Email</h2>
                {isVerified ? (
                    <>
                        <div style={{ margin: '1.5rem 0', color: 'var(--admin-color)', display: 'flex', justifyContent: 'center' }}>
                             <svg xmlns="http://www.w3.org/2000/svg" style={{width: '4rem', height: '4rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                        </div>
                        <p style={{fontSize: '1.125rem', fontWeight: 600, color: 'var(--gray-800)'}}>
                            Verified Successfully!
                        </p>
                        <p style={{color: 'var(--gray-600)', marginTop: '0.5rem'}}>
                            Your email <strong>{user.email}</strong> has been verified.
                        </p>
                        <button
                            onClick={() => onNavigate('login', { role: user.role })}
                            className={`submit-button ${user.role.toLowerCase()}`}
                            style={{marginTop: '1.5rem'}}
                        >
                            Continue to Login
                        </button>
                    </>
                ) : (
                    <>
                         <p style={{color: 'var(--gray-600)', marginTop: '1rem'}}>
                            We've sent a verification code to <strong>{user.email}</strong>.
                        </p>

                        {emailStatus === 'sending' ? (
                             <div className="email-preview-body-loading" style={{marginTop: '1.5rem', minHeight: '10rem'}}>
                                <p>Sending email...</p>
                            </div>
                        ) : (
                            <div>
                                <div className="form-group" style={{marginTop: '2rem', textAlign: 'left'}}>
                                   <label htmlFor="verificationCode" className="form-label" style={{textAlign: 'center', display: 'block', marginBottom: '0.5rem'}}>Enter Verification Code</label>
                                   <input
                                        id="verificationCode"
                                        name="verificationCode"
                                        type="text"
                                        value={verificationCodeInput}
                                        onChange={(e) => setVerificationCodeInput(e.target.value)}
                                        className="form-input"
                                        style={{textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', fontWeight: 'bold'}}
                                        maxLength={6}
                                        placeholder="000000"
                                   />
                                </div>

                                {error && <p className="error-message" style={{marginTop: '1rem'}}>{error}</p>}
                                
                                <button onClick={handleVerify} className={`submit-button ${user.role.toLowerCase()}`} style={{marginTop: '1.5rem'}}>
                                    Verify Account
                                </button>
                                
                                <div style={{marginTop: '2.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem'}}>
                                    <p style={{fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1rem'}}>
                                        Can't find the email?
                                    </p>
                                    
                                    <button 
                                        type="button" 
                                        onClick={handleOpenMailClient}
                                        style={{color: 'var(--indigo-600)', fontWeight: 500, fontSize: '0.875rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer'}}
                                    >
                                        Open Default Mail App
                                    </button>
                                    
                                    <div className="email-preview-container" style={{marginTop: '1rem', textAlign: 'left'}}>
                                         <div className="email-preview-header">
                                            <span style={{fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', letterSpacing: '0.05em'}}>Simulation Preview</span>
                                        </div>
                                        <div className="email-preview-body" style={{fontFamily: 'monospace', fontSize: '0.875rem'}}>
                                            {emailContent}
                                        </div>
                                        <div className="simulation-notice">
                                            <p><strong>Note:</strong> Since this is a demo app without a backend server, we simulate email sending. You can copy the code above.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
