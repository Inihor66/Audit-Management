import React from 'react';
import { User, Role } from '../../types';

interface ProfilePageProps {
    user: User;
    onBack: () => void;
    onNavigate: (view: string) => void;
}

const getRoleButtonClass = (role: Role) => {
    switch (role) {
        case Role.FIRM: return 'btn-firm';
        case Role.ADMIN: return 'btn-admin';
        default: return 'btn-secondary';
    }
}

const ProfilePage = ({ user, onBack, onNavigate }: ProfilePageProps) => {
    const { subscription } = user;
    const entriesLeft = subscription.allowedEntries === 'infinity' 
        ? 'Unlimited' 
        : subscription.allowedEntries - subscription.entriesUsed;
    const roleButtonClass = getRoleButtonClass(user.role);

    const handleResendVerification = () => {
        try {
            // Only for firm/admin
            if (user.role === Role.FIRM || user.role === Role.ADMIN) {
                // regenerate and "send"
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const storage = require('../../services/storageService');
                storage.generateEmailVerificationCode(user.id);
                alert('Verification code resent to your email.');
            }
        } catch (err) {
            alert('Failed to resend verification code.');
        }
    }

    return (
        <div className="container" style={{maxWidth: '48rem'}}>
            <button onClick={onBack} className="header-action-btn" style={{marginBottom: '1rem'}}>&larr; Back to Dashboard</button>
            <div className="card">
                <h2 className="card-title">My Profile</h2>
                
                <div className="profile-details">
                    <p><strong>Name:</strong> {user.name}</p>
                    {user.location && <p><strong>Location:</strong> {user.location}</p>}
                    <p><strong>Email:</strong> {user.email}</p>
                    {(user.role === Role.FIRM || user.role === Role.ADMIN) && (
                        <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'} { !user.emailVerified && <button onClick={handleResendVerification} className="btn btn-secondary" style={{marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}>Resend Code</button> }</p>
                    )}
                    {user.role === Role.ADMIN && <p><strong>Admin Code:</strong> {user.adminCode}</p>}
                </div>

                <div className="subscription-details">
                    <h3 className="card-title" style={{fontSize: '1.125rem', marginTop: '2rem'}}>Subscription Details</h3>
                    <p><strong>Status:</strong> <span className="capitalize font-semibold">{subscription.status}</span></p>
                    {subscription.status === 'active' && (
                        <>
                           <p><strong>Current Plan:</strong> <span className="capitalize">{subscription.plan?.replace('_', ' ')}</span></p>
                           <p><strong>Expires on:</strong> {subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString() : 'N/A'}</p>
                        </>
                    )}
                    <p><strong>Entries Left:</strong> <span className="font-semibold">{entriesLeft}</span></p>
                    <button onClick={() => onNavigate('manage_subscription')} className={`btn ${roleButtonClass}`} style={{marginTop: '1.5rem', width: 'auto'}}>
                        Manage Subscription
                    </button>
                </div>
            </div>
            {/* Fix: Removed 'jsx' prop from style tag to resolve TypeScript error. */}
            <style>{`
                .profile-details p, .subscription-details p {
                    margin: 0.5rem 0;
                    color: var(--color-text-secondary);
                }
                .subscription-details {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--color-border);
                }
            `}</style>
        </div>
    )
};

export default ProfilePage;