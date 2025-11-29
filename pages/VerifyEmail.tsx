
import React, { useState, useEffect } from 'react';
import * as storage from '../services/storageService';
import { User, Role } from '../types';

// ==============================================================================
// ⬇️⬇️⬇️ PASTE YOUR EMAILJS KEYS INSIDE THE QUOTES BELOW ⬇️⬇️⬇️
// ==============================================================================
const DEFAULT_SERVICE_ID = 'service_krtq6yi';   // Replace with your Service ID
const DEFAULT_TEMPLATE_ID = 'template_9kfh2fh'; // Replace with your Template ID
const DEFAULT_PUBLIC_KEY = 'ZXEQmcCT1ogbLL32A'; // Replace with your Public Key
// ==============================================================================

interface VerifyEmailPageProps {
    userId: string;
    onNavigate: (page: string, options?: { role?: Role }) => void;
}

const VerifyEmailPage = ({ userId, onNavigate }: VerifyEmailPageProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [verificationCodeInput, setVerificationCodeInput] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    
    // Config State
    const [showConfig, setShowConfig] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    // Initial config load: prioritize hardcoded constants if they are set (and not the default placeholders if possible)
    const [config, setConfig] = useState(() => {
        return {
            serviceId: DEFAULT_SERVICE_ID,
            templateId: DEFAULT_TEMPLATE_ID,
            publicKey: DEFAULT_PUBLIC_KEY,
        };
    });

    useEffect(() => {
        const foundUser = storage.getUserById(userId);
        if (foundUser) {
            setUser(foundUser);
            if (foundUser.isVerified) {
                setIsVerified(true);
            } else {
                // Try to send email automatically if keys look valid (basic check)
                if (config.serviceId && config.templateId && config.publicKey) {
                    // Slight delay to allow UI to mount before sending
                    setTimeout(() => {
                         if (status === 'idle') {
                            sendEmail(foundUser, foundUser.verificationCode || 'ERROR');
                         }
                    }, 500);
                } else {
                    setStatus('error');
                    setStatusMessage('EmailJS not configured. Please check your keys below.');
                    setShowConfig(true);
                }
            }
        } else {
            setStatus('error');
            setStatusMessage('User not found. Please sign up again.');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const saveConfig = (newConfig: typeof config) => {
        // We update state, but we don't persist to localStorage to avoid confusion with hardcoded keys.
        // Users should update the code for permanent changes.
        setConfig(newConfig);
        
        if (user) {
             setStatusMessage('Configuration updated. Click "Send Verification Email" below.');
             setStatus('idle');
        }
    };

    const sendEmail = async (currentUser: User, code: string) => {
        if (!config.serviceId || !config.templateId || !config.publicKey) {
            setStatus('error');
            setStatusMessage('Missing EmailJS Configuration. Please set keys in the code or below.');
            setShowConfig(true);
            return;
        }

        setStatus('sending');
        setStatusMessage('Sending verification email...');

        try {
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: config.serviceId,
                    template_id: config.templateId,
                    user_id: config.publicKey,
                    template_params: {
                        to_email: currentUser.email,
                        to_name: currentUser.name,
                        verification_code: code,
                        message: `Your verification code is: ${code}`
                    }
                }),
            });

            if (response.ok) {
                setStatus('success');
                setStatusMessage(`Verification code sent to ${currentUser.email}`);
                setShowConfig(false);
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to send email');
            }
        } catch (err) {
            console.error('Email Send Error:', err);
            setStatus('error');
            setStatusMessage(`Failed to send email. Check your keys.`);
            setShowConfig(true); 
        }
    };

    const handleVerify = () => {
        if (user && user.verificationCode) {
            if (verificationCodeInput === user.verificationCode) {
                const updatedUser = { ...user, isVerified: true, verificationCode: undefined };
                storage.updateUser(updatedUser);
                setIsVerified(true);
            } else {
                setStatus('error');
                setStatusMessage('Invalid code. Please try again.');
            }
        }
    };

    const handleResend = () => {
        if (user) sendEmail(user, user.verificationCode || 'ERROR');
    };

    if (!user) return <div className="loading-screen"><p>Loading...</p></div>;

    return (
        <div className="auth-page">
            <div className="auth-form-card" style={{maxWidth: '36rem', margin: '0 auto', textAlign: 'center'}}>
                <h2 className="auth-title">Verify Your Email</h2>
                
                {isVerified ? (
                    <div style={{marginTop: '2rem'}}>
                        <div style={{ margin: '0 auto 1.5rem', color: 'var(--admin-color)', width: '4rem' }}>
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                        </div>
                        <p style={{fontSize: '1.25rem', fontWeight: 600, color: 'var(--gray-800)'}}>Verified Successfully!</p>
                        <button
                            onClick={() => onNavigate('login', { role: user.role })}
                            className={`submit-button ${user.role.toLowerCase()}`}
                            style={{marginTop: '1.5rem'}}
                        >
                            Continue to Login
                        </button>
                    </div>
                ) : (
                    <>
                        <p style={{color: 'var(--gray-600)', marginTop: '1rem'}}>
                            Enter the code sent to <strong>{user.email}</strong>
                        </p>

                        <div style={{marginTop: '2rem'}}>
                             <input
                                type="text"
                                value={verificationCodeInput}
                                onChange={(e) => setVerificationCodeInput(e.target.value)}
                                className="form-input"
                                style={{textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', fontWeight: 'bold', maxWidth: '12rem', margin: '0 auto'}}
                                maxLength={6}
                                placeholder="000000"
                           />
                           <button onClick={handleVerify} className={`submit-button ${user.role.toLowerCase()}`} style={{marginTop: '1rem'}}>
                                Verify Code
                           </button>
                        </div>

                        {/* Status Message Area */}
                        {(statusMessage || status !== 'idle') && (
                            <div className={`error-alert`} style={{
                                backgroundColor: status === 'error' ? '#fee2e2' : status === 'success' ? '#dcfce7' : '#f3f4f6',
                                borderColor: status === 'error' ? '#f87171' : status === 'success' ? '#86efac' : '#e5e7eb',
                                color: status === 'error' ? '#b91c1c' : status === 'success' ? '#15803d' : '#4b5563',
                                marginTop: '1.5rem',
                                padding: '1rem',
                                borderRadius: '0.375rem',
                                borderStyle: 'solid',
                                borderWidth: '1px',
                                textAlign: 'left'
                            }}>
                                <strong>Status:</strong> {statusMessage}
                            </div>
                        )}

                        <div style={{marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem'}}>
                            <button onClick={handleResend} style={{color: 'var(--indigo-600)', textDecoration: 'underline'}} disabled={status === 'sending'}>
                                {status === 'sending' ? 'Sending...' : 'Send Verification Email'}
                            </button>
                            <button onClick={() => setShowConfig(!showConfig)} style={{color: 'var(--gray-500)', fontSize: '0.875rem'}}>
                                {showConfig ? 'Hide Config' : 'Configure Email Provider'}
                            </button>
                        </div>

                        {/* Runtime Configuration Form */}
                        {showConfig && (
                            <div style={{marginTop: '1.5rem', padding: '1.5rem', border: '1px solid var(--gray-300)', borderRadius: '0.5rem', backgroundColor: 'var(--gray-50)', textAlign: 'left'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                                     <h4 style={{margin: '0', fontSize: '1rem', fontWeight: 600}}>EmailJS Configuration</h4>
                                     <button onClick={() => setShowInstructions(!showInstructions)} style={{fontSize: '0.875rem', color: 'var(--indigo-600)', textDecoration: 'underline'}}>
                                        {showInstructions ? 'Hide Instructions' : 'How does this work?'}
                                     </button>
                                </div>

                                {showInstructions && (
                                    <div style={{backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#1e3a8a'}}>
                                        <p style={{marginBottom: '0.5rem', fontWeight: 'bold'}}>To send real emails:</p>
                                        <ol style={{paddingLeft: '1.25rem', margin: 0}}>
                                            <li>Create an account at <a href="https://emailjs.com/" target="_blank" rel="noreferrer" style={{textDecoration: 'underline'}}>emailjs.com</a>.</li>
                                            <li>Add an <strong>Email Service</strong> (e.g., Gmail). Copy the <strong>Service ID</strong>.</li>
                                            <li>Create an <strong>Email Template</strong>. Copy the <strong>Template ID</strong>.</li>
                                            <li style={{marginTop: '0.25rem'}}>
                                                Add these variables to your template content:
                                                <br/><code>{`{{to_name}}`}</code> and <code>{`{{verification_code}}`}</code>
                                            </li>
                                            <li style={{marginTop: '0.25rem'}}>Go to <strong>Account &gt; General</strong> to copy your <strong>Public Key</strong>.</li>
                                        </ol>
                                        <p style={{marginTop: '0.5rem', fontStyle: 'italic'}}>Note: For permanent configuration, update the <code>DEFAULT_</code> constants in this file code.</p>
                                    </div>
                                )}

                                <div className="form-group" style={{marginBottom: '0.75rem'}}>
                                    <label className="form-label">Service ID</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={config.serviceId} 
                                        onChange={(e) => setConfig({...config, serviceId: e.target.value})}
                                        placeholder="service_xxxxx"
                                    />
                                </div>
                                <div className="form-group" style={{marginBottom: '0.75rem'}}>
                                    <label className="form-label">Template ID</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={config.templateId} 
                                        onChange={(e) => setConfig({...config, templateId: e.target.value})}
                                        placeholder="template_xxxxx"
                                    />
                                </div>
                                <div className="form-group" style={{marginBottom: '1rem'}}>
                                    <label className="form-label">Public Key</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={config.publicKey} 
                                        onChange={(e) => setConfig({...config, publicKey: e.target.value})}
                                        placeholder="user_xxxxx"
                                    />
                                </div>
                                <div style={{display: 'flex', gap: '1rem'}}>
                                    <button onClick={() => saveConfig(config)} className={`submit-button ${user.role.toLowerCase()}`}>
                                        Test & Save (Session Only)
                                    </button>
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
