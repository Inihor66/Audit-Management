
import React, { useState } from 'react';
import { User, SubscriptionPlan, Role } from '../../types';
import { SUBSCRIPTION_PLANS, CONTACT_INFO, ROLE_CONFIG, EMAILJS_SUBSCRIPTION_CONFIG } from '../../constants';
import * as storage from '../../services/storageService';
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon';
import { CheckIcon } from '../../components/icons/CheckIcon';

// Universal Email Template Code
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

const PaymentFlow = ({ plan, user, onPaymentNotified, onBack }: PaymentFlowProps) => {
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [notified, setNotified] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    
    // Email Config State for fallback/manual entry
    const [emailConfig, setEmailConfig] = useState({
        serviceId: EMAILJS_SUBSCRIPTION_CONFIG.SERVICE_ID,
        templateId: EMAILJS_SUBSCRIPTION_CONFIG.TEMPLATE_ID,
        publicKey: EMAILJS_SUBSCRIPTION_CONFIG.PUBLIC_KEY,
    });
    const [showConfig, setShowConfig] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    const roleClass = user.role.toLowerCase();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (limit to ~200KB for EmailJS best results)
            if (file.size > 200000) {
                setError('File too large. Please upload an image smaller than 200KB for email delivery.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshot(reader.result as string);
                setError('');
            };
            reader.onerror = () => {
                setError('Failed to read file.');
            };
            reader.readAsDataURL(file);
        }
    };

    const sendAdminNotificationEmail = async () => {
        if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
            console.warn('EmailJS not configured, skipping admin email.');
            throw new Error('Configuration Missing');
        }

        try {
            await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: emailConfig.serviceId,
                    template_id: emailConfig.templateId,
                    user_id: emailConfig.publicKey,
                    template_params: {
                        // Routing
                        to_email: CONTACT_INFO.email, 
                        email: CONTACT_INFO.email, // Backup
                        to_name: 'Super Admin',
                        from_name: 'Audit Flow System',
                        company_name: "Audit Managment app Presented by INIHOR",
                        reply_to: user.email,
                        
                        // Data for Universal Template
                        payment_screenshot: screenshot, // Triggers "Payment Action" view
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
            console.log('Admin notification email sent successfully.');
        } catch (e) {
            console.error('Failed to send admin notification email', e);
            throw e;
        }
    };

    const sendUserConfirmationEmail = async () => {
        if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
            return;
        }

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
                        
                        // No screenshot or verification code -> Triggers Generic Message view
                        message: `Hello ${user.name},\n\nWe have received your payment screenshot for the ${plan.name} plan.\n\nThe admin team has been notified. If your subscription is not approved within 2 hours, it will be automatically activated.\n\nThank you for choosing us!`,
                    }
                }),
            });
            console.log('User confirmation email sent successfully.');
        } catch (e) {
            console.error('Failed to send user confirmation email', e);
        }
    };

    const handleNotifyAdmin = async () => {
        if (!screenshot) {
            setError('Please upload a payment screenshot.');
            return;
        }

        setSendingEmail(true);

        if (user.role === Role.ADMIN) {
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
            alert(`Admin subscription for the ${plan.name} plan has been activated!`);
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
            console.error("Payment notification failed:", error);
            setSendingEmail(false);
            setShowConfig(true);
            setShowInstructions(true); // Auto-show instructions on failure
            setError('Failed to send email. Please configure EmailJS below.');
        }
    };

    const handleTestAndSaveConfig = async () => {
        if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
            setError('Please fill in all email configuration fields.');
            return;
        }
        setError('');
        handleNotifyAdmin();
    };

    if (notified) {
        return (
             <div className="payment-notified-container">
                <h3 className="payment-notified-title">Screenshot Uploaded!</h3>
                <p className="payment-notified-text">The admin has been notified at <strong>{CONTACT_INFO.email}</strong>.</p>
                <div style={{backgroundColor: '#ecfdf5', padding: '1rem', borderRadius: '0.5rem', margin: '1rem 0', fontSize: '0.875rem', color: '#065f46'}}>
                    <strong>Note:</strong> If the admin does not manually confirm within <strong>2 hours</strong>, your subscription will be automatically activated.
                    <br/><br/>
                    A confirmation email has also been sent to <strong>{user.email}</strong>.
                </div>
                <button onClick={onPaymentNotified} className="payment-notified-button">Go to Dashboard</button>
             </div>
        );
    }

    return (
        <div className="payment-flow">
            <button onClick={onBack} className={`back-link ${roleClass}`}>&larr; Back to plans</button>
            <h2 className="payment-flow-title">Complete Your Subscription</h2>
            <p className="payment-flow-subtitle">You have selected the <strong style={{fontWeight: 600}}>{plan.name}</strong> plan for <strong style={{fontWeight: 600}}>₹{plan.price}</strong>.</p>
            
            <div className="payment-step">
                <h3 className="payment-step-title">Step 1: Make Payment</h3>
                <p className="payment-step-text">Please pay the subscription amount to the following UPI ID:</p>
                <p className="upi-id">{CONTACT_INFO.upi}</p>
                <div className="payment-actions">
                    <button onClick={() => window.open(`upi://pay?pa=${CONTACT_INFO.upi}&pn=AuditFlow&am=${plan.price}`, '_blank')} className="payment-action-button upi">Open UPI App</button>
                    <a href={CONTACT_INFO.whatsapp} target="_blank" rel="noopener noreferrer" className="payment-action-button whatsapp" aria-label="Contact on WhatsApp">
                        <WhatsAppIcon className="icon" />
                    </a>
                </div>
            </div>

            <div className="payment-step">
                <h3 className="payment-step-title">Step 2: Upload Payment Screenshot</h3>
                <p className="payment-step-text">After successful payment, upload a screenshot to verify.</p>
                <input type="file" accept="image/*" onChange={handleFileChange} className="file-input"/>
                {screenshot && <img src={screenshot} alt="Payment screenshot preview" className="screenshot-preview" />}
                {error && <p className="error-message" style={{marginTop: '0.5rem'}}>{error}</p>}
            </div>

            <div className="notify-admin-button-container">
                <button 
                    onClick={handleNotifyAdmin} 
                    disabled={!screenshot || sendingEmail} 
                    className="notify-admin-button">
                    {sendingEmail ? 'Processing...' : (user.role === Role.ADMIN ? 'Activate Subscription' : 'Test & Notify Admin')}
                </button>
            </div>

            {/* Email Config Form - Shows only if email fails */}
            {showConfig && (
                <div style={{marginTop: '1.5rem', padding: '1.5rem', border: '1px solid var(--gray-300)', borderRadius: '0.5rem', backgroundColor: 'var(--gray-50)', textAlign: 'left'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                         <h4 style={{margin: '0', fontSize: '1rem', fontWeight: 600}}>Configure Email Provider</h4>
                         <button onClick={() => setShowInstructions(!showInstructions)} style={{fontSize: '0.875rem', color: 'var(--indigo-600)', textDecoration: 'underline'}}>
                            {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
                         </button>
                    </div>

                    {showInstructions && (
                        <div style={{backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#1e3a8a'}}>
                            <p style={{marginBottom: '0.5rem', fontWeight: 'bold'}}>One Template to Rule Them All:</p>
                            <p style={{marginBottom: '0.5rem'}}>Copy the code below into your EmailJS template (Source Code mode). It handles verification codes, payment screenshots, and notifications in one.</p>
                            <textarea 
                                readOnly 
                                style={{width: '100%', height: '100px', fontSize: '0.75rem', fontFamily: 'monospace', padding: '0.5rem', border: '1px solid #93c5fd', borderRadius: '0.25rem', whiteSpace: 'pre'}}
                                value={UNIVERSAL_EMAIL_TEMPLATE}
                            />
                            <p style={{marginTop: '0.5rem', fontSize: '0.75rem'}}><strong>IMPORTANT:</strong> Set "To Email" in settings to <code>{`{{to_email}}`}</code>.</p>
                        </div>
                    )}

                    <div className="form-group" style={{marginBottom: '0.75rem'}}>
                        <label className="form-label">Service ID</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            value={emailConfig.serviceId} 
                            onChange={(e) => setEmailConfig({...emailConfig, serviceId: e.target.value})}
                            placeholder="service_xxxxx"
                        />
                    </div>
                    <div className="form-group" style={{marginBottom: '0.75rem'}}>
                        <label className="form-label">Template ID</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            value={emailConfig.templateId} 
                            onChange={(e) => setEmailConfig({...emailConfig, templateId: e.target.value})}
                            placeholder="template_xxxxx"
                        />
                    </div>
                    <div className="form-group" style={{marginBottom: '1rem'}}>
                        <label className="form-label">Public Key</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            value={emailConfig.publicKey} 
                            onChange={(e) => setEmailConfig({...emailConfig, publicKey: e.target.value})}
                            placeholder="user_xxxxx"
                        />
                    </div>
                    <div style={{display: 'flex', gap: '1rem'}}>
                        <button onClick={handleTestAndSaveConfig} className={`submit-button ${roleClass}`}>
                            Test & Notify Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Main Component
const ManageSubscription = ({ user, refreshUser, onBack }: ManageSubscriptionProps) => {
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const roleClass = user.role.toLowerCase();

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
            <div className="subscription-header-new">
                <button onClick={onBack} className={`back-link ${roleClass}`}>&larr; Back to Dashboard</button>
                <h1 className="subscription-title-new">Upgrade Your Plan</h1>
                <p className="subscription-subtitle-new">
                    Get unlimited entries and scale your audit management effortlessly.
                    <br/>
                    <span style={{fontSize: '0.9rem', color: 'var(--firm-color)', fontWeight: 600}}>
                        Special Offer: Once unlocked, unlimited features remain active forever for this account!
                    </span>
                </p>
            </div>

            <div className="plans-container-new">
                {SUBSCRIPTION_PLANS.map((plan) => {
                    const isPopular = plan.key === 'six_month';
                    return (
                        <div key={plan.key} className={`plan-card-new ${isPopular ? 'popular' : ''}`}>
                            {isPopular && <div className="popular-badge">Most Popular</div>}
                            <div className="plan-header">
                                <h3 className="plan-name-new">{plan.name}</h3>
                                <div className="plan-price-new">
                                    <span>₹{plan.price}</span>
                                    <span className="plan-duration">/ {plan.duration_months} mo</span>
                                </div>
                                <div className="plan-billing-info">Billed once</div>
                            </div>
                            
                            <div className="plan-features">
                                <h4 className="features-title">What's included:</h4>
                                <ul className="feature-list">
                                    <li><CheckIcon className="feature-icon"/> Unlimited Form Entries</li>
                                    <li><CheckIcon className="feature-icon"/> Priority Support</li>
                                    <li><CheckIcon className="feature-icon"/> Lifetime Feature Unlock</li>
                                </ul>
                            </div>

                            <button 
                                onClick={() => setSelectedPlan(plan)}
                                className={`plan-button ${isPopular ? 'popular-button' : roleClass}`}
                            >
                                Choose {plan.name}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="free-plan-info-new">
                <h4>Currently on: Free Plan</h4>
                <p>You have used {user.subscription.entriesUsed} out of {ROLE_CONFIG[user.role].freeEntries} free entries.</p>
            </div>
        </div>
    );
};

export default ManageSubscription;
