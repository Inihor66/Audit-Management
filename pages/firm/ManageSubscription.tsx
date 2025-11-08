import React, { useState } from 'react';
import { User, SubscriptionPlan, Role } from '../../types';
import { SUBSCRIPTION_PLANS, CONTACT_INFO, ROLE_CONFIG } from '../../constants';
import * as storage from '../../services/storageService';
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon';

interface ManageSubscriptionProps {
    user: User;
    refreshUser: () => void;
    onBack: () => void;
}

const getRoleButtonClass = (role: Role) => {
    switch (role) {
        case Role.FIRM: return 'btn-firm';
        case Role.ADMIN: return 'btn-admin';
        default: return 'btn-secondary';
    }
}

const PaymentFlow = ({ plan, user, onPaymentNotified, onBack }: { plan: SubscriptionPlan, user: User, onPaymentNotified: () => void, onBack: () => void }) => {
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [notified, setNotified] = useState(false);
    const roleButtonClass = getRoleButtonClass(user.role);

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
        
        const updatedUser = { ...user, pendingPaymentSS: screenshot };
        storage.updateUser(updatedUser);
        storage.addAdminNotification(user, screenshot);
        setNotified(true);
    };

    if (notified) {
        return (
             <div className="card text-center">
                <h3 style={{color: 'var(--color-success)', fontSize: '1.25rem', fontWeight: '700'}}>Screenshot Uploaded!</h3>
                <p style={{marginTop: '0.5rem'}}>The admin has been notified and will confirm your subscription manually. You will receive an in-app notification upon confirmation.</p>
                <button onClick={onPaymentNotified} className="btn" style={{backgroundColor: 'var(--color-success)', marginTop: '1.5rem', width: 'auto'}}>Go Back</button>
             </div>
        );
    }

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="header-action-btn">&larr; Back to plans</button>
            <h2 className="card-title">Complete Your Subscription</h2>
            <p>You have selected the <strong className="font-semibold">{plan.name}</strong> plan for <strong className="font-semibold">₹{plan.price}</strong>.</p>
            
            <div className="card">
                <h3 className="card-title" style={{fontSize: '1.125rem'}}>Step 1: Make Payment</h3>
                <p>Please pay the subscription amount to the following UPI ID:</p>
                <p className="upi-id">{CONTACT_INFO.upi}</p>
                <div className="payment-actions">
                    <button onClick={() => window.open(`upi://pay?pa=${CONTACT_INFO.upi}&pn=AuditFlow&am=${plan.price}`, '_blank')} className={`btn ${roleButtonClass}`}>Open UPI App</button>
                    <a href={CONTACT_INFO.whatsapp} target="_blank" rel="noopener noreferrer" className="btn" style={{backgroundColor: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <WhatsAppIcon className="w-5 h-5" />
                        <span>Help</span>
                    </a>
                </div>
            </div>

            <div className="card">
                <h3 className="card-title" style={{fontSize: '1.125rem'}}>Step 2: Upload Payment Screenshot</h3>
                <p className="mb-4">After successful payment, upload a screenshot to verify.</p>
                <input type="file" accept="image/*" onChange={handleFileChange} className="form-input" />
                {screenshot && <img src={screenshot} alt="Payment screenshot preview" className="screenshot-preview" />}
                {error && <p className="form-error">{error}</p>}
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <button onClick={handleNotifyAdmin} disabled={!screenshot} className={`btn ${roleButtonClass}`}>
                    Notify Admin
                </button>
            </div>
             {/* Fix: Removed 'jsx' prop from style tag to resolve TypeScript error. */}
             <style>{`
                .upi-id { font-family: monospace; background-color: #e5e7eb; padding: 0.75rem; border-radius: 0.375rem; margin: 1rem 0; text-align: center; }
                .payment-actions { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1rem; }
                .payment-actions .btn { width: auto; }
                .screenshot-preview { margin-top: 1rem; max-height: 15rem; border-radius: 0.375rem; border: 1px solid var(--color-border); }
             `}</style>
        </div>
    );
};

const ManageSubscription = ({ user, refreshUser, onBack }: ManageSubscriptionProps) => {
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const roleButtonClass = getRoleButtonClass(user.role);

    const PageWrapper = ({children}: {children: React.ReactNode}) => (
        <div className="container" style={{maxWidth: '64rem', paddingTop: '2rem'}}>
            {children}
        </div>
    );


    if (selectedPlan) {
        return <PageWrapper><PaymentFlow plan={selectedPlan} user={user} onPaymentNotified={() => { refreshUser(); onBack(); }} onBack={() => setSelectedPlan(null)} /></PageWrapper>;
    }

    const { subscription } = user;

    return (
        <PageWrapper>
            <div className="card">
                <div className="page-header">
                    <div>
                        <h2 className="card-title">Manage Subscription</h2>
                        <p className="text-gray-500 mt-1">Choose a plan that works for you.</p>
                    </div>
                    <button onClick={onBack} className="header-action-btn">&larr; Back to Profile</button>
                </div>

                {subscription.status === 'active' && (
                    <div className="notification success">
                        <p><strong>Current Plan:</strong> {subscription.plan?.replace('_', ' ')}</p>
                        <p><strong>Expires on:</strong> {subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                )}
                 {user.pendingPaymentSS && (
                    <div className="notification warning">
                        <p><strong>Payment Pending Confirmation:</strong> Your subscription is waiting for admin approval.</p>
                    </div>
                )}

                <div className="plans-grid">
                    {SUBSCRIPTION_PLANS.map(plan => (
                        <div key={plan.key} className="plan-card">
                            <div>
                                <h3>{plan.name}</h3>
                                <p className="price">₹{plan.price}</p>
                                <p className="description">Unlimited form entries for {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}.</p>
                            </div>
                            <button onClick={() => setSelectedPlan(plan)} className={`btn ${roleButtonClass}`}>
                                Choose Plan
                            </button>
                        </div>
                    ))}
                </div>
                <div className="free-plan-info">
                    <h4 className="font-semibold text-gray-700">Free Plan</h4>
                    <p>Your free plan includes <strong>{ROLE_CONFIG[user.role].freeEntries}</strong> form entries. Deleted forms are counted towards this limit.</p>
                </div>
            </div>
            {/* Fix: Removed 'jsx' prop from style tag to resolve TypeScript error. */}
            <style>{`
                .notification { padding: 1rem; margin-bottom: 1.5rem; border-left-width: 4px; border-radius: 0.25rem; }
                .notification.success { background-color: #f0fdf4; color: #15803d; border-color: #4ade80; }
                .notification.warning { background-color: #fffbeb; color: #b45309; border-color: #facc15; }
                .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; text-align: center; }
                .plan-card { border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s; }
                .plan-card:hover { box-shadow: var(--shadow-lg); border-color: var(--color-firm); }
                .plan-card h3 { font-size: 1.25rem; font-weight: 600; }
                .plan-card .price { font-size: 1.875rem; font-weight: 700; margin: 1rem 0; }
                .plan-card .description { color: var(--color-text-light); }
                .plan-card .btn { margin-top: 1.5rem; }
                .free-plan-info { margin-top: 2rem; padding: 1rem; background-color: var(--color-bg-light); border-radius: 0.5rem; text-align: center; }
            `}</style>
        </PageWrapper>
    );
};

export default ManageSubscription;