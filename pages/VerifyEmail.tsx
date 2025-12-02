
import React, { useState, useEffect, useRef } from 'react';
import * as storage from '../services/storageService';
import { User, Role } from '../types';
import { EMAILJS_VERIFY_CONFIG } from '../constants';

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
    const [showInstructions, setShowInstructions] = useState(true);

    // Ref to prevent double-sending in React StrictMode
    const emailSentRef = useRef<string | null>(null);

    // Initial config load: prioritize hardcoded constants if they are set
    const [config, setConfig] = useState(() => {
        return {
            serviceId: EMAILJS_VERIFY_CONFIG.SERVICE_ID,
            templateId: EMAILJS_VERIFY_CONFIG.TEMPLATE_ID,
            publicKey: EMAILJS_VERIFY_CONFIG.PUBLIC_KEY,
        };
    });

    useEffect(() => {
        const foundUser = storage.getUserById(userId);
        if (foundUser) {
            setUser(foundUser);
            if (foundUser.isVerified) {
                setIsVerified(true);
            } else {
                // Logic to send email automatically ONCE
                if (emailSentRef.current !== userId) {
                     // Check if keys exist and ARE NOT placeholders
                     const isValidConfig = 
                        config.serviceId && !config.serviceId.includes('xxxx') &&
                        config.templateId && !config.templateId.includes('xxxx') &&
                        config.publicKey;

                     if (isValidConfig) {
                        emailSentRef.current = userId; // Mark as sent for this ID
                        sendEmail(foundUser, foundUser.verificationCode || 'ERROR');
                     } else {
                        // Silent fail / prompt for config if missing
                        if (!config.serviceId) {
                            setStatus('error');
                            setStatusMessage('EmailJS not configured. Please set your Service ID below.');
                            setShowConfig(true);
                        } else if (config.serviceId.includes('xxxx')) {
                            setStatus('error');
                            setStatusMessage('Invalid Placeholder Keys detected. Please enter real keys below.');
                            setShowConfig(true);
                        }
                     }
                }
            }
        } else {
            setStatus('error');
            setStatusMessage('User not found. Please sign up again.');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]); // Only re-run if userId changes

    const saveConfig = (newConfig: typeof config) => {
        setConfig(newConfig);
        if (user) {
             setStatusMessage('Configuration updated. Click "Send Verification Email" below.');
             setStatus('idle');
             emailSentRef.current = null; // Allow re-sending manually
        }
    };

    const sendEmail = async (currentUser: User, code: string) => {
        if (!config.serviceId || !config.templateId || !config.publicKey) {
            setStatus('error');
            setStatusMessage('Missing EmailJS Configuration. Please set keys in the code or below.');
            setShowConfig(true);
            return;
        }
        
        if (config.serviceId.includes('xxxx') || config.templateId.includes('xxxx')) {
             setStatus('error');
             setStatusMessage('You are using placeholder keys (containing "xxxx"). Please enter valid keys from your EmailJS dashboard.');
             setShowConfig(true);
             return;
        }

        setStatus('sending');
        setStatusMessage('Sending verification email...');
        console.log(`[EmailJS] Sending to: ${currentUser.email} (Role: ${currentUser.role}) with code: ${code}`);

        try {
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: config.serviceId,
                    template_id: config.templateId,
                    user_id: config.publicKey,
                    template_params: {
                        to_email: currentUser.email, // "To Email" in Dashboard
                        email: currentUser.email,    // Backup variable
                        to_name: currentUser.name,
                        
                        // We send the code in multiple variables to match whatever is in your template
                        verification_code: code,
                        code: code,
                        otp: code,
                        company_name: "Audit Managment app Presented by INIHOR", 
                        
                        // Standard message body used by many default templates
                        message: `Your verification code is: ${code}`,
                        content: `Your verification code is: ${code}`,
                    }
                }),
            });

            if (response.ok) {
                setStatus('success');
                setStatusMessage(`Verification code sent to ${currentUser.email}`);
                setShowConfig(false);
            } else {
                const errorText = await response.text();
                console.error('[EmailJS Error]', errorText);
                throw new Error(errorText || 'Failed to send email');
            }
        } catch (err: any) {
            console.error('Email Send Error:', err);
            setStatus('error');
            
            const errorMessage = err.message || '';
            if (errorMessage.includes('The service ID not found')) {
                 setStatusMessage('Error: Service ID not found. Please check the Service ID in the configuration below.');
            } else if (errorMessage.includes('recipients address is empty')) {
                 setStatusMessage(`Error: Recipient Empty. Go to EmailJS Dashboard > Email Template. Set "To Email" field to {{to_email}}`);
            } else {
                 setStatusMessage(`Failed to send email: ${errorMessage.substring(0, 50)}...`);
            }
            setShowConfig(true); 
            // Allow retry
            emailSentRef.current = null;
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
        if (user) {
            emailSentRef.current = user.id; // Mark as attempting
            sendEmail(user, user.verificationCode || 'ERROR');
        }
    };

    if (!user) return <div className="loading-screen"><p>Loading...</p></div>;

    const roleClass = user.role.toLowerCase();

    return (
        <div className="auth-page">
            <div className="auth-form-card" style={{maxWidth: '36rem', margin: '0 auto', textAlign: 'center'}}>
                <h2 className="auth-title">Verify Your Email</h2>
                
                {isVerified ? (
                    <div style={{marginTop: '2rem'}}>
                        <div style={{ margin: '0 auto 1.5rem', color: `var(--${roleClass}-color)`, width: '4rem' }}>
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                        </div>
                        <p style={{fontSize: '1.25rem', fontWeight: 600, color: 'var(--gray-800)'}}>Verified Successfully!</p>
                        <button
                            onClick={() => onNavigate('login', { role: user.role })}
                            className={`submit-button ${roleClass}`}
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
                           <button onClick={handleVerify} className={`submit-button ${roleClass}`} style={{marginTop: '1rem'}}>
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
                                        {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
                                     </button>
                                </div>

                                {showInstructions && (
                                    <div style={{backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#1e3a8a'}}>
                                        <p style={{marginBottom: '0.5rem', fontWeight: 'bold'}}>How to fix "missing code" in emails:</p>
                                        <ol style={{paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                            <li>Go to your EmailJS Dashboard {' > '} Email Templates.</li>
                                            <li>Edit your template (ID: <code>{config.templateId}</code>).</li>
                                            <li>
                                                In the email body, ensure you are using one of these variables:
                                                <br/><code>{`{{message}}`}</code> OR <code>{`{{verification_code}}`}</code> OR <code>{`{{code}}`}</code>.
                                            </li>
                                            <li style={{backgroundColor: '#fef08a', padding: '0.5rem', borderRadius: '0.25rem', color: '#854d0e', fontWeight: 'bold'}}>
                                                ALSO: Set the "To Email" field in the settings to <code>{`{{to_email}}`}</code>.
                                            </li>
                                            <li>Save the template and click "Test & Save" below.</li>
                                        </ol>
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
                                    <button onClick={() => saveConfig(config)} className={`submit-button ${roleClass}`}>
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
