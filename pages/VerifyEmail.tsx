
import React, { useState, useEffect } from 'react';
import * as storage from '../services/storageService';
import { User, Role } from '../types';

// --- CONFIGURATION: PASTE YOUR EMAILJS KEYS HERE ---
// API KEY, SERVICE ID, aur TEMPLATE ID yahan insert karein.
// Get these from https://dashboard.emailjs.com/admin
const DEFAULT_SERVICE_ID = 'service_6gek9hs';  // Example: 'service_823...'
const DEFAULT_TEMPLATE_ID = 'template_j1jaezf'; // Example: 'template_321...'
const DEFAULT_PUBLIC_KEY = 'WPvTVBEQwlGTWJFZq';  // Example: 'user_123...'
// --------------------------------------------------

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
    const [config, setConfig] = useState({
        serviceId: localStorage.getItem('emailjs_service_id') || (DEFAULT_SERVICE_ID !== 'YOUR_SERVICE_ID_HERE' ? DEFAULT_SERVICE_ID : ''),
        templateId: localStorage.getItem('emailjs_template_id') || (DEFAULT_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID_HERE' ? DEFAULT_TEMPLATE_ID : ''),
        publicKey: localStorage.getItem('emailjs_public_key') || (DEFAULT_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY_HERE' ? DEFAULT_PUBLIC_KEY : ''),
    });

    useEffect(() => {
        const foundUser = storage.getUserById(userId);
        if (foundUser) {
            setUser(foundUser);
            if (foundUser.isVerified) {
                setIsVerified(true);
            } else {
                // If we have keys, try to send automatically
                if (config.serviceId && config.templateId && config.publicKey) {
                    sendEmail(foundUser, foundUser.verificationCode || 'ERROR');
                } else {
                    setStatus('idle');
                    setStatusMessage('Please configure EmailJS keys below to send actual emails.');
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
        localStorage.setItem('emailjs_service_id', newConfig.serviceId);
        localStorage.setItem('emailjs_template_id', newConfig.templateId);
        localStorage.setItem('emailjs_public_key', newConfig.publicKey);
        setConfig(newConfig);
        setShowConfig(false);
        if (user) {
            sendEmail(user, user.verificationCode || 'ERROR');
        }
    };

    const sendEmail = async (currentUser: User, code: string) => {
        if (!config.serviceId || !config.templateId || !config.publicKey) {
            setStatus('error');
            setStatusMessage('Missing EmailJS Configuration. Please set keys below.');
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
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to send email');
            }
        } catch (err) {
            console.error('Email Send Error:', err);
            setStatus('error');
            setStatusMessage('Failed to send email. Check your keys or network connection.');
            setShowConfig(true); // Show config on error to allow fixing keys
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
                            <div style={{
                                marginTop: '1.5rem', 
                                padding: '1rem', 
                                borderRadius: '0.5rem',
                                backgroundColor: status === 'error' ? '#fee2e2' : status === 'success' ? '#dcfce7' : '#f3f4f6',
                                color: status === 'error' ? '#b91c1c' : status === 'success' ? '#15803d' : '#4b5563'
                            }}>
                                {statusMessage}
                            </div>
                        )}

                        <div style={{marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem'}}>
                            <button onClick={handleResend} style={{color: 'var(--indigo-600)', textDecoration: 'underline'}} disabled={status === 'sending'}>
                                Resend Email
                            </button>
                            <button onClick={() => setShowConfig(!showConfig)} style={{color: 'var(--gray-500)', fontSize: '0.875rem'}}>
                                {showConfig ? 'Hide Config' : 'Configure Email Provider'}
                            </button>
                        </div>

                        {/* Runtime Configuration Form */}
                        {showConfig && (
                            <div style={{marginTop: '1.5rem', padding: '1.5rem', border: '1px solid var(--gray-300)', borderRadius: '0.5rem', backgroundColor: 'var(--gray-50)', textAlign: 'left'}}>
                                <h4 style={{margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600}}>EmailJS Configuration</h4>
                                <p style={{fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '1rem'}}>
                                    Enter your public keys from <a href="https://dashboard.emailjs.com/" target="_blank" rel="noreferrer">EmailJS Dashboard</a> to enable sending on this deployment.
                                </p>
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
                                <button onClick={() => saveConfig(config)} className="submit-button admin">
                                    Save & Send Email
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
