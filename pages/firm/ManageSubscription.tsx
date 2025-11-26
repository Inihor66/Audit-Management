
import React, { useState } from 'react';
import { User, SubscriptionPlan, Role } from '../../types';
import { SUBSCRIPTION_PLANS, CONTACT_INFO, ROLE_CONFIG } from '../../constants';
import * as storage from '../../services/storageService';
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon';
import { CheckIcon } from '../../components/icons/CheckIcon';

interface ManageSubscriptionProps {
    user: User;
    refreshUser: () => void;
    onBack: () => void;
}

const PaymentFlow = ({ plan, user, onPaymentNotified, onBack }: { plan: SubscriptionPlan, user: User, onPaymentNotified: () => void, onBack: () => void }) => {
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [notified, setNotified] = useState(false);
    const roleClass = user.role.toLowerCase();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshot(reader.result as string);
                setError('');
            };
            reader.onerror = () => {
                setError('Failed to read file.');
            }
            reader.readAsDataURL(file);
        }
    };

    const handleNotifyAdmin = () => {
        if (!screenshot) {
            setError('Please upload a payment screenshot.');
            return;
        }

        // Admin users can auto-approve their own subscriptions.
        if (user.role === Role.ADMIN) {
            const startDate = new Date();
            const expiryDate = new Date();
            expiryDate.setMonth(startDate.getMonth() + plan.duration_months);

            const updatedUser = {
                ...user,
                subscription: {
                    ...user.subscription,
                    status: 'active' as 'active',
                    plan: plan.key,
                    startDate: startDate.toISOString(),
                    expiryDate: expiryDate.toISOString(),
                    allowedEntries: 'infinity' as 'infinity',
                },
                pendingPaymentSS: null,
            };
            storage.updateUser(updatedUser);
            alert(`Admin subscription for the ${plan.name} plan has been activated!`);
            onPaymentNotified();
            return;
        }
        
        // Default flow for Firms: notify admin for manual approval.
        const updatedUser = { 
            ...user, 
            pendingPaymentSS: screenshot,
            subscription: { ...user.subscription, status: 'pending' as 'pending' }
        };
        storage.updateUser(updatedUser);
        
        // Create admin notification
        storage.addAdminNotification(user, screenshot);

        setNotified(true);
    };

    if (notified) {
        return (
             <div className="payment-notified-container">
                <h3 className="payment-notified-title">Screenshot Uploaded!</h3>
                <p className="payment-notified-text">The admin has been notified and will confirm your subscription manually. You will receive an in-app notification upon confirmation.</p>
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
                    disabled={!screenshot} 
                    className="notify-admin-button">
                    {user.role === Role.ADMIN ? 'Activate Subscription' : 'Notify Admin'}
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
