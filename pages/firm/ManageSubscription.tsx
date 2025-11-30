
import React, { useState } from 'react';
import { User, SubscriptionPlan, Role } from '../../types';
import { SUBSCRIPTION_PLANS, CONTACT_INFO, ROLE_CONFIG, EMAILJS_SUBSCRIPTION_CONFIG } from '../../constants';
import * as storage from '../../services/storageService';
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon';
import CheckIcon from '../../components/icons/CheckIcon';

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
    const roleClass = user.role.toLowerCase();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (limit to ~300KB for localStorage/EmailJS safety)
            if (file.size > 300000) {
                setError('File too large. Please upload an image smaller than 300KB.');
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
        const config = EMAILJS_SUBSCRIPTION_CONFIG;
        if (!config.SERVICE_ID || !config.TEMPLATE_ID || !config.PUBLIC_KEY) {
            console.warn('EmailJS not configured, skipping admin email.');
            return;
        }

        try {
            await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: config.SERVICE_ID,
                    template_id: config.TEMPLATE_ID,
                    user_id: config.PUBLIC_KEY,
                    template_params: {
                        // Send to the Super Admin
                        to_email: CONTACT_INFO.email, 
                        email: CONTACT_INFO.email, // Backup
                        to_name: 'Super Admin',
                        from_name: 'Audit Flow System',
                        company_name: "Audit Managment app Presented by INIHOR",
                        reply_to: user.email,
                        
                        message: `ACTION REQUIRED: Payment Verification.
                        
User: ${user.name} (${user.email})
Role: ${user.role}
Plan Requested: ${plan.name} (₹${plan.price})
Time: ${new Date().toLocaleString()}

Please login to the Admin Dashboard to approve this payment. 
NOTE: If not approved within 2 hours, the system will automatically unlock the features for this user.`,
                        
                        content: `User ${user.name} has uploaded a payment screenshot for the ${plan.name} plan.`
                    }
                }),
            });
            console.log('Admin notification email sent successfully.');
        } catch (e) {
            console.error('Failed to send admin notification email', e);
        }
    };

    const sendUserConfirmationEmail = async () => {
        const config = EMAILJS_SUBSCRIPTION_CONFIG;
        // Fallback or check if keys are placeholders
        if (!config.SERVICE_ID || !config.TEMPLATE_ID || !config.PUBLIC_KEY || config.PUBLIC_KEY.includes('xxxx')) {
            console.warn('EmailJS configuration missing or invalid.');
            return;
        }

        try {
            await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: config.SERVICE_ID,
                    template_id: config.TEMPLATE_ID,
                    user_id: config.PUBLIC_KEY,
                    template_params: {
                        to_email: user.email,
                        email: user.email,
                        to_name: user.name,
                        from_name: "Audit Flow Manager",
                        company_name: "Audit Managment app Presented by INIHOR",
                        reply_to: CONTACT_INFO.email,
                        message: `Hello ${user.name},\n\nWe have received your payment screenshot for the ${plan.name} plan.\n\nThe admin team has been notified. If your subscription is not approved within 2 hours, it will be automatically activated.\n\nThank you for choosing us!`,
                        content: `Payment Receipt: ${plan.name} Plan`
                    }
                }),
            });
            console.log('User confirmation email sent successfully.');
        } catch (e) {
            console.error('Failed to send user confirmation email', e);
            alert('Note: Failed to send confirmation email. Please check internet connection or contact support if the issue persists.');
        }
    };

    const handleNotifyAdmin = async () => {
        if (!screenshot) {
            setError('Please upload a payment screenshot.');
            return;
        }

        setSendingEmail(true);

        // Admin users can auto-approve their own subscriptions.
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
        
        // Default flow for Firms: notify admin for manual approval.
        const updatedUser: User = { 
            ...user, 
            pendingPaymentSS: screenshot,
            paymentRequestDate: new Date().toISOString(), // Track time for 2-hour auto-unlock
            pendingPlanKey: plan.key,
            subscription: { ...user.subscription, status: 'pending' as const }
        };
        storage.updateUser(updatedUser);
        
        // Create admin notification in app
        storage.addAdminNotification(user, screenshot);

        // Send Email to Main Admin
        await sendAdminNotificationEmail();

        // Send Confirmation Email to User
        await sendUserConfirmationEmail();

        setSendingEmail(false);
        setNotified(true);
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
                    {sendingEmail ? 'Processing...' : (user.role === Role.ADMIN ? 'Activate Subscription' : 'Notify Admin')}
                </button>
            </div>
        </div>
    );
};

const ManageSubscription = ({ user, refreshUser, onBack }: ManageSubscriptionProps) => {
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

    if (selectedPlan) {
        return <PaymentFlow plan={selectedPlan} user={user} onPaymentNotified={() => { refreshUser(); onBack(); }} onBack={() => setSelectedPlan(null)} />;
    }

    const roleClass = user.role.toLowerCase();
    const { subscription } = user;

    return (
        <div className="subscription-page">
            <div className="subscription-header-new">
                <button onClick={onBack} className={`back-link ${roleClass}`}>&larr; Back to Dashboard</button>
                <h1 className="subscription-title-new">Choose Your Plan</h1>
                <p className="subscription-subtitle-new">Unlock unlimited potential and streamline your workflow.</p>
            </div>

            {subscription.status === 'active' && (
                <div className="subscription-banner active">
                     <p><strong>Current Plan:</strong> <span style={{textTransform: 'capitalize'}}>{subscription.plan?.replace('_', ' ')}</span> | <strong>Expires on:</strong> {subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'N/A'}</p>
                </div>
            )}
             {subscription.status === 'pending' && (
                <div className="subscription-banner pending">
                    <p><strong>Payment Pending Confirmation:</strong> Your subscription is waiting for admin approval.</p>
                </div>
            )}

            <div className="plans-container-new">
                {SUBSCRIPTION_PLANS.map((plan) => {
                    const isPopular = plan.key === 'six_month';
                    return (
                        <div key={plan.key} className={`plan-card-new ${isPopular ? 'popular' : ''}`}>
                            {isPopular && <div className="popular-badge">Most Popular</div>}
                            <div className="plan-header">
                                <h2 className="plan-name-new">{plan.name}</h2>
                                <p className="plan-price-new">
                                    ₹{plan.price}
                                    <span className="plan-duration">/ {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</span>
                                </p>
                                <p className="plan-billing-info">Billed once for the duration.</p>
                            </div>
                            <div className="plan-features">
                                <h3 className="features-title">What's included:</h3>
                                <ul className="feature-list">
                                    <li><CheckIcon className="feature-icon" /> Unlimited Form Entries</li>
                                    <li><CheckIcon className="feature-icon" /> Access to All Features</li>
                                    <li><CheckIcon className="feature-icon" /> Priority Support</li>
                                </ul>
                            </div>
                            <button
                                onClick={() => setSelectedPlan(plan)}
                                className={`plan-button ${roleClass} ${isPopular ? 'popular-button' : ''}`}>
                                Choose Plan
                            </button>
                        </div>
                    );
                })}
            </div>
            
            <div className="free-plan-info-new">
                <h4>Continue with Free Plan</h4>
                <p>Your free plan includes <strong>{ROLE_CONFIG[user.role].freeEntries}</strong> form entries. Great for getting started!</p>
            </div>
        </div>
    );
};

export default ManageSubscription;
