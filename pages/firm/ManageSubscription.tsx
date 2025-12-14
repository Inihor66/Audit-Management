
import React, { useState } from 'react';
import { User, SubscriptionPlan, Role } from '../../types';
import { SUBSCRIPTION_PLANS, CONTACT_INFO, EMAILJS_SUBSCRIPTION_CONFIG } from '../../constants';
import * as storage from '../../services/storageService';
import { CheckIcon } from '../../components/icons/CheckIcon';

// Fixed imports to ../../

const UNIVERSAL_EMAIL_TEMPLATE = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; color: #333;">
  <div style="background-color: #2563EB; padding: 20px; text-align: center;">
    <h2 style="color: white; margin: 0;">{{#if verification_code}}Verify Email{{else}}{{#if payment_screenshot}}Payment Action{{else}}Notification{{/if}}{{/if}}</h2>
  </div>
  <div style="padding: 20px;">
    <p>Hello <strong>{{to_name}}</strong>,</p>
    {{#if verification_code}}
      <p>Verification Code:</p>
      <div style="background-color: #ecfdf5; padding: 15px; font-size: 24px; font-weight: bold; color: #047857; text-align: center; letter-spacing: 5px; margin: 20px 0;">{{verification_code}}</div>
    {{/if}}
    {{#if payment_screenshot}}
      <p>{{content}}</p>
      <div style="margin: 10px 0; border: 1px solid #ddd; padding: 5px;"><img src="{{payment_screenshot}}" alt="Proof" style="width: 100%; display: block;" /></div>
      <div style="text-align: center; margin-top: 20px;"><a href="{{dashboard_link}}" style="background-color: #16A34A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login</a></div>
    {{/if}}
    {{#unless verification_code}}{{#unless payment_screenshot}}
      <p style="white-space: pre-wrap;">{{message}}</p>
    {{/unless}}{{/unless}}
  </div>
  <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666;">{{company_name}}</div>
</div>`;

interface ManageSubscriptionProps {
    user: User;
    refreshUser: () => void;
    onBack: () => void;
}

interface PaymentFlowProps {
    plan: SubscriptionPlan;
    user: User;
    onPaymentNotified: () => void;
    onBack: () => void;
}

// Modern Payment Checkout Component
const PaymentFlow = ({ plan, user, onPaymentNotified, onBack }: PaymentFlowProps) => {
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [error, setError] = useState('');
    const [notified, setNotified] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    
    // Email Config State
    const [emailConfig, setEmailConfig] = useState({
        serviceId: EMAILJS_SUBSCRIPTION_CONFIG.SERVICE_ID,
        templateId: EMAILJS_SUBSCRIPTION_CONFIG.TEMPLATE_ID,
        publicKey: EMAILJS_SUBSCRIPTION_CONFIG.PUBLIC_KEY,
    });
    const [showConfig, setShowConfig] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            if (file.size > 200000) {
                setError('File too large. Please upload < 200KB for email delivery.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshot(reader.result as string);
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };

    const sendAdminNotificationEmail = async () => {
        if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
             // Fallback: If config missing, we might still proceed if user is admin or logic allows, but here we throw to trigger manual config
             throw new Error('Configuration Missing');
        }
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: emailConfig.serviceId,
                template_id: emailConfig.templateId,
                user_id: emailConfig.publicKey,
                template_params: {
                    to_email: CONTACT_INFO.email, 
                    email: CONTACT_INFO.email,
                    to_name: 'Super Admin',
                    from_name: 'Audit Flow System',
                    company_name: "Audit Managment app Presented by INIHOR",
                    reply_to: user.email,
                    payment_screenshot: screenshot,
                    dashboard_link: window.location.origin,
                    user_name: user.name,
                    user_email: user.email,
                    user_role: user.role,
                    plan_name: plan.name,
                    plan_price: plan.price,
                    date: new Date().toLocaleString(),
                    message: `ACTION REQUIRED: Payment Verification for ${user.name}.`,
                    content: `User ${user.name} has uploaded a payment screenshot for the ${plan.name} plan.`
                }
            }),
        });
    };

    const sendUserConfirmationEmail = async () => {
        if (!emailConfig.serviceId) return;
        try {
            await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: emailConfig.serviceId,
                    template_id: emailConfig.templateId,
                    user_id: emailConfig.publicKey,
                    template_params: {
                        to_email: user.email,
                        email: user.email,
                        to_name: user.name,
                        from_name: "Audit Flow Manager",
                        company_name: "Audit Managment app Presented by INIHOR",
                        reply_to: CONTACT_INFO.email,
                        dashboard_link: window.location.origin,
                        message: `Hello ${user.name},\n\nWe have received your payment screenshot for the ${plan.name} plan.\n\nThe admin team has been notified. If your subscription is not approved within 2 hours, it will be automatically activated.\n\nThank you for choosing us!`,
                    }
                }),
            });
        } catch(e) { console.error(e); }
    };

    const handleNotifyAdmin = async () => {
        if (!screenshot) { setError('Please upload a payment screenshot.'); return; }
        setSendingEmail(true);

        if (user.role === Role.ADMIN) {
             // Admin Self-Activation Logic
            const startDate = new Date();
            const expiryDate = new Date();
            expiryDate.setMonth(startDate.getMonth() + plan.duration_months);
            const updatedUser = {
                ...user,
                subscription: {
                    ...user.subscription,
                    status: 'active' as const,
                    plan: plan.key,
                    startDate: startDate.toISOString(),
                    expiryDate: expiryDate.toISOString(),
                    allowedEntries: 'infinity' as const,
                },
                pendingPaymentSS: null,
            };
            storage.updateUser(updatedUser);
            alert(`Subscription activated!`);
            onPaymentNotified();
            setSendingEmail(false);
            return;
        }

        try {
            await sendAdminNotificationEmail();
            const updatedUser: User = { 
                ...user, 
                pendingPaymentSS: screenshot,
                paymentRequestDate: new Date().toISOString(),
                pendingPlanKey: plan.key,
                subscription: { ...user.subscription, status: 'pending' as const }
            };
            storage.updateUser(updatedUser);
            storage.addAdminNotification(user, screenshot);
            await sendUserConfirmationEmail();
            setSendingEmail(false);
            setNotified(true);
        } catch (error) {
            setSendingEmail(false);
            setShowConfig(true);
            setShowInstructions(true);
            setError('Email sending failed. Please configure keys below.');
        }
    };

    if (notified) {
        return (
             <div className="payment-notified-container" style={{maxWidth: '40rem', margin: '4rem auto', textAlign: 'center', background: 'white', padding: '3rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}>
                 <div style={{width: '4rem', height: '4rem', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#059669'}}>
                    <CheckIcon className="w-8 h-8"/>
                 </div>
                <h3 style={{fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem'}}>Payment Submitted!</h3>
                <p style={{color: '#4b5563', marginBottom: '1.5rem'}}>
                    Your screenshot has been sent to admin. 
                    <br/>If not approved within <strong>2 hours</strong>, it will auto-activate.
                </p>
                <button onClick={onPaymentNotified} className="final-notify-btn" style={{maxWidth: '200px'}}>Go to Dashboard</button>
             </div>
        );
    }

    return (
        <div className="subscription-page">
            <button onClick={onBack} className="back-link mb-6">
                 <span>&larr;</span> Back to plans
            </button>
            
            <div className="checkout-layout">
                {/* LEFT: Order Summary */}
                <div className="order-summary-card">
                    <h3 className="summary-title">Order Summary</h3>
                    
                    <div className="summary-row">
                        <span>Plan Name</span>
                        <span style={{fontWeight: 600, color: 'var(--gray-900)'}}>{plan.name}</span>
                    </div>
                    <div className="summary-row">
                        <span>Billing Cycle</span>
                        <span>{plan.duration_months === 1 ? 'Monthly' : plan.duration_months === 6 ? 'Every 6 Months' : 'Yearly'}</span>
                    </div>
                    <div className="summary-row">
                        <span>Features</span>
                        <span className="summary-highlight">Unlimited Entries</span>
                    </div>
                    
                    <div className="summary-row total">
                        <span>Total to Pay</span>
                        <span>₹{plan.price}</span>
                    </div>

                    <div style={{marginTop: '2rem', fontSize: '0.85rem', color: 'var(--gray-500)', lineHeight: '1.5'}}>
                        <p><strong>Note:</strong> This is a one-time payment. Subscription features like "Unlimited Entries" remain unlocked forever for this account once activated.</p>
                    </div>
                </div>

                {/* RIGHT: Payment Actions */}
                <div className="payment-method-card">
                    <div className="payment-step-box">
                        <div className="step-header">
                            <div className="step-number">1</div>
                            <span className="step-title">Pay via UPI</span>
                        </div>
                        <div className="upi-box">
                            <p style={{margin: 0, color: 'var(--gray-500)', fontSize: '0.9rem'}}>Scan QR or use UPI ID</p>
                            <div className="upi-code">{CONTACT_INFO.upi}</div>
                            <div className="payment-btn-group">
                                <button onClick={() => window.open(`upi://pay?pa=${CONTACT_INFO.upi}&pn=AuditFlow&am=${plan.price}`, '_blank')} className="action-btn upi">
                                    Open UPI App
                                </button>
                                <a href={CONTACT_INFO.whatsapp} target="_blank" rel="noopener noreferrer" className="action-btn whatsapp">
                                    WhatsApp Us
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="payment-step-box">
                        <div className="step-header">
                            <div className="step-number">2</div>
                            <span className="step-title">Upload Screenshot</span>
                        </div>
                        
                        <div className="upload-zone">
                            <input type="file" accept="image/*" onChange={handleFileChange} />
                            <div className="upload-content">
                                <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <p className="upload-placeholder">Click to upload payment proof</p>
                                {fileName && <p className="file-name-preview">{fileName}</p>}
                            </div>
                        </div>
                        
                        {screenshot && (
                            <div className="screenshot-preview-container">
                                <img src={screenshot} alt="Preview" />
                            </div>
                        )}
                        {error && <p className="error-message mt-2">{error}</p>}
                    </div>

                    <button 
                        onClick={handleNotifyAdmin} 
                        disabled={!screenshot || sendingEmail} 
                        className="final-notify-btn"
                    >
                        {sendingEmail ? 'Processing...' : 'Verify Payment & Activate'}
                    </button>
                </div>
            </div>

            {/* Error / Manual Config Fallback */}
            {showConfig && (
                <div style={{marginTop: '2rem', background: '#fff', padding: '2rem', borderRadius: '1rem', border: '1px solid #fee2e2'}}>
                    <h3 style={{color: '#b91c1c', marginBottom: '1rem'}}>Email Configuration Required</h3>
                    <p style={{fontSize: '0.9rem', marginBottom: '1rem'}}>The automated email failed (likely due to missing API keys). Please enter your EmailJS credentials manually to proceed.</p>
                     
                    {showInstructions && (
                        <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', fontFamily: 'monospace'}}>
                           Copy Universal Template Code:
                           <textarea readOnly value={UNIVERSAL_EMAIL_TEMPLATE} style={{width: '100%', height: '60px', marginTop: '0.5rem', fontSize: '0.7rem'}}/>
                        </div>
                    )}

                    <div style={{display: 'grid', gap: '1rem', maxWidth: '30rem'}}>
                        <input type="text" className="form-input" placeholder="Service ID" value={emailConfig.serviceId} onChange={e => setEmailConfig({...emailConfig, serviceId: e.target.value})} />
                        <input type="text" className="form-input" placeholder="Template ID" value={emailConfig.templateId} onChange={e => setEmailConfig({...emailConfig, templateId: e.target.value})} />
                        <input type="text" className="form-input" placeholder="Public Key" value={emailConfig.publicKey} onChange={e => setEmailConfig({...emailConfig, publicKey: e.target.value})} />
                        <button onClick={handleNotifyAdmin} className="submit-button firm">Retry Activation</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Main Component
const ManageSubscription = ({ user, refreshUser, onBack }: ManageSubscriptionProps) => {
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

    if (selectedPlan) {
        return (
            <PaymentFlow 
                plan={selectedPlan} 
                user={user} 
                onPaymentNotified={() => {
                    setSelectedPlan(null);
                    refreshUser();
                    onBack();
                }}
                onBack={() => setSelectedPlan(null)}
            />
        );
    }

    return (
        <div className="subscription-page">
            {/* Top Status Bar */}
            <div className="subscription-status-bar">
                <div className="status-bar-info">
                    <h2>Current Subscription Status</h2>
                    <p>You have used <strong>{user.subscription.entriesUsed}</strong> out of <strong>{user.subscription.allowedEntries === 'infinity' ? 'Unlimited' : user.subscription.allowedEntries}</strong> entries.</p>
                </div>
                <div className="current-plan-tag">
                    {user.subscription.plan ? user.subscription.plan.toUpperCase() + ' PLAN' : 'FREE PLAN'}
                </div>
            </div>

            <div className="subscription-header-modern">
                <h1>Upgrade Your Experience</h1>
                <p>Unlock <strong>Unlimited Audit Entries</strong> and scale your firm without limits. Choose the plan that fits your growth.</p>
            </div>

            <div className="pricing-grid">
                {SUBSCRIPTION_PLANS.map((plan) => {
                    const isPopular = plan.key === 'six_month';
                    return (
                        <div key={plan.key} className={`pricing-card ${isPopular ? 'popular' : ''}`}>
                            {isPopular && <div className="popular-ribbon">Most Popular</div>}
                            
                            <div className="pricing-header">
                                <h3>{plan.name} Plan</h3>
                                <div className="pricing-price">
                                    <span className="currency">₹</span>
                                    <span className="amount">{plan.price}</span>
                                </div>
                                <span className="duration">Valid for {plan.duration_months} months</span>
                            </div>

                            <hr style={{border: 'none', borderTop: '1px solid var(--gray-100)', margin: '1.5rem 0'}}/>

                            <div className="pricing-features">
                                <ul className="feature-list">
                                    <li><CheckIcon className="feature-icon"/> <strong>Unlimited</strong> Audit Entries</li>
                                    <li><CheckIcon className="feature-icon"/> Premium Support</li>
                                    <li><CheckIcon className="feature-icon"/> {plan.duration_months === 12 ? 'Yearly' : 'Regular'} Compliance Updates</li>
                                    <li><CheckIcon className="feature-icon"/> Lifetime Account Unlock</li>
                                </ul>
                            </div>

                            <button 
                                onClick={() => setSelectedPlan(plan)}
                                className={`pricing-btn ${isPopular ? 'highlight' : 'primary'}`}
                            >
                                Select {plan.name}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            <div style={{textAlign: 'center', marginTop: '4rem', color: 'var(--gray-500)', fontSize: '0.9rem'}}>
                <p>Need a custom enterprise plan? <a href={CONTACT_INFO.whatsapp} target="_blank" rel="noreferrer" style={{color: 'var(--firm-color)', fontWeight: 600}}>Contact Sales</a></p>
            </div>
        </div>
    );
};

export default ManageSubscription;

