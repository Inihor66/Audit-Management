
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, FormData, AdminNotification, SubscriptionPlan, Role } from '../../types';
import * as storage from '../../services/storageService';
import { SUBSCRIPTION_PLANS, ROLE_CONFIG, EMAILJS_SUBSCRIPTION_CONFIG } from '../../constants';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Modal } from '../../components/Modal';
import ManageSubscription from '../firm/ManageSubscription';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  refreshUser: () => void;
  // FIX: Updated onNavigate prop to accept an options object to match the signature in App.tsx
  onNavigate: (page: string, options?: { role?: Role; formId?: string; }) => void;
}

const AdminDashboard = ({ user, onLogout, refreshUser, onNavigate }: AdminDashboardProps) => {
    const [view, setView] = useState('dashboard'); // dashboard, pre_edit, post_edit, filled, admin_table, profile, manage_subscription, pending_payments
    const [allForms, setAllForms] = useState<FormData[]>([]);
    const [paymentNotifications, setPaymentNotifications] = useState<AdminNotification[]>([]);
    const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    
    const roleClass = user.role.toLowerCase();
    const entriesLeft = user.subscription.allowedEntries === 'infinity' ? 'Unlimited' : user.subscription.allowedEntries - user.subscription.entriesUsed;

    const { adminCode } = user;
    const fetchData = useCallback(() => {
        setPaymentNotifications(storage.getAdminNotifications().filter(n => !n.handled).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        
        if (!adminCode) {
            setAllForms([]);
            return;
        }

        const adminCodeLower = adminCode.trim().toLowerCase();
        setAllForms(
            storage.getForms()
                .filter(f => f.adminCode?.trim().toLowerCase() === adminCodeLower)
                .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
    }, [adminCode]);

    useEffect(() => {
        fetchData();
        refreshUser();
    }, [fetchData, refreshUser]);

    const preEditForms = useMemo(() => allForms.filter(f => !f.isApproved && !f.deleted), [allForms]);
    const postEditForms = useMemo(() => allForms.filter(f => f.isApproved && !f.studentSubmission && !f.deleted), [allForms]);
    const filledForms = useMemo(() => allForms.filter(f => !!f.studentSubmission && !f.deleted), [allForms]);
    
    const openPaymentModal = (notification: AdminNotification) => {
        setSelectedNotification(notification);
        setIsPaymentModalOpen(true);
    };

    const sendUserApprovalEmail = async (firmEmail: string, firmName: string, planName: string) => {
        const config = EMAILJS_SUBSCRIPTION_CONFIG;
        if (!config.SERVICE_ID || !config.TEMPLATE_ID || !config.PUBLIC_KEY) {
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
                        to_email: firmEmail,
                        email: firmEmail,
                        to_name: firmName,
                        company_name: "Audit Managment app Presented by INIHOR",
                        // This 'message' variable corresponds to {{message}} in your EmailJS template
                        message: `Congratulations! Your subscription for the ${planName} plan has been approved and is now active. You now have unlimited form entries.`,
                        content: `Subscription Approved: ${planName}`,
                    }
                }),
            });
            console.log('User approval email sent.');
        } catch (e) {
            console.error('Failed to send user approval email', e);
        }
    };

    const handleConfirmPayment = async (plan: SubscriptionPlan) => {
        if (selectedNotification) {
            setProcessingPayment(true);
            const firmUser = storage.getUserById(selectedNotification.firmId);
            if (firmUser) {
                const startDate = new Date();
                const expiryDate = new Date();
                expiryDate.setMonth(startDate.getMonth() + plan.duration_months);

                firmUser.subscription = {
                    ...firmUser.subscription,
                    status: 'active',
                    plan: plan.key,
                    startDate: startDate.toISOString(),
                    expiryDate: expiryDate.toISOString(),
                    allowedEntries: 'infinity',
                };
                firmUser.pendingPaymentSS = null;
                firmUser.paymentRequestDate = undefined; // Clear auto-unlock timer
                firmUser.pendingPlanKey = undefined;

                firmUser.notifications.push({
                    id: crypto.randomUUID(),
                    message: `Your subscription for the ${plan.name} plan has been activated!`,
                    type: 'success',
                    read: false,
                    createdAt: new Date().toISOString()
                });
                storage.updateUser(firmUser);

                // Send Email to the User confirming approval
                await sendUserApprovalEmail(firmUser.email, firmUser.name, plan.name);
            }
            
            const updatedNotif = {...selectedNotification, handled: true };
            storage.updateAdminNotification(updatedNotif);
            fetchData();
            setIsPaymentModalOpen(false);
            setProcessingPayment(false);
        }
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}${window.location.pathname}?page=signup`;
        navigator.clipboard.writeText(link).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    };

    const renderDashboard = () => (
      <div className="page-content">
          {paymentNotifications.length > 0 && (
              <div className="pending-payments-container">
                  <button onClick={() => setView('pending_payments')} className="pending-payments-button">
                      <span>Pending Payments</span>
                      <span className="pending-count-badge">{paymentNotifications.length}</span>
                  </button>
              </div>
          )}
          <div className="card">
              <h2 className="welcome-banner-title">Admin Control Panel</h2>
              <p className="welcome-banner-text">Manage forms and user subscriptions.</p>
          </div>
          <div className="admin-card-grid">
              <DashboardCard title="Pre-Edit Forms" value={preEditForms.length} onClick={() => setView('pre_edit')} />
              <DashboardCard title="Post-Edit Forms" value={postEditForms.length} onClick={() => setView('post_edit')} />
              <DashboardCard title="Filled Forms" value={filledForms.length} onClick={() => setView('filled')} />
              <DashboardCard title="All Forms" value={allForms.length} onClick={() => setView('admin_table')} />
          </div>
      </div>
    );
    
    const renderTable = (forms: FormData[], title: string) => (
        <div>
            <button onClick={() => setView('dashboard')} className="back-link" style={{marginBottom: '1rem', display: 'inline-block'}}>&larr; Back to Dashboard</button>
            <div className="card">
                <h3 className="table-title">{title}</h3>
                <div className="table-container">
                    <table className="data-table admin-table">
                        <thead>
                            <tr>
                                <th>Firm</th>
                                <th>Location</th>
                                <th>Date</th>
                                <th>Student</th>
                                <th style={{textAlign: 'right'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                           {forms.length > 0 ? forms.map(form => (
                               <tr key={form.id}>
                                   <td style={{fontWeight: 500}}>{form.firmName}</td>
                                   <td>{form.location}</td>
                                   <td>{new Date(form.expectedDate).toLocaleDateString()}</td>
                                   <td>{form.studentSubmission?.studentName || 'N/A'}</td>
                                   <td style={{textAlign: 'right'}}>
                                       {/* FIX: Updated onNavigate call to pass an options object */}
                                       <button onClick={() => onNavigate('form_details', { formId: form.id })} className="table-action-link view">View / Edit</button>
                                   </td>
                               </tr>
                           )) : (
                                <tr>
                                    <td colSpan={5} className="no-data-cell">No forms in this category.</td>
                                </tr>
                           )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderPaymentsSection = () => (
         <div className="card" style={{marginBottom: '1.5rem'}}>
            <h3 className="table-title">Pending Payment Approvals</h3>
            <div className="payment-list">
                {paymentNotifications.length > 0 ? paymentNotifications.map(notif => (
                    <div key={notif.id} className="payment-list-item">
                        <div>
                            <p className="payment-list-item-firm">{notif.firmName}</p>
                            <p className="payment-list-item-date">Submitted on {new Date(notif.createdAt).toLocaleString()}</p>
                        </div>
                        <button onClick={() => openPaymentModal(notif)} className="review-button">Review</button>
                    </div>
                )) : (
                    <p className="no-data-cell" style={{padding: '1rem 0'}}>No pending payment approvals.</p>
                )}
            </div>
         </div>
    );

    const renderAdminTableView = () => (
        <div>
            <button onClick={() => setView('dashboard')} className="back-link" style={{marginBottom: '1rem', display: 'inline-block'}}>&larr; Back to Main Dashboard</button>
            <div className="card">
                <div className="table-header">
                    <h3 className="table-title">All Forms</h3>
                    <div className="toggle-switch-container">
                        <span>Show Terms</span>
                        <label className="toggle-switch">
                            <input type="checkbox" checked={showTerms} onChange={() => setShowTerms(!showTerms)} />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>
                <div className="table-container">
                    <table className="data-table admin-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Firm</th>
                                <th>Location</th>
                                <th>Pre-Edit Payment</th>
                                <th>Post-Edit Payment</th>
                                {showTerms && <th>Pre-Edit T&C</th>}
                                {showTerms && <th>Post-Edit T&C</th>}
                                <th>Status</th>
                                <th style={{textAlign: 'right'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                           {allForms.length > 0 ? allForms.map(form => {
                               const status = form.studentSubmission ? 'Filled' : form.isApproved ? 'Approved' : 'Pending';
                               const statusClass = form.studentSubmission ? 'green' : form.isApproved ? 'blue' : 'yellow';
                               return (
                                   <tr key={form.id}>
                                       <td>{new Date(form.expectedDate).toLocaleDateString()}</td>
                                       <td style={{fontWeight: 500}}>{form.firmName}</td>
                                       <td>{form.location}</td>
                                       <td>{form.feesRange}</td>
                                       <td>{form.postEditFees || 'N/A'}</td>
                                       {showTerms && <td className="terms-cell" title={form.preEditTerms}>{form.preEditTerms}</td>}
                                       {showTerms && <td className="terms-cell" title={form.postEditTerms ?? ''}>{form.postEditTerms || 'N/A'}</td>}
                                       <td><span className={`status-badge ${statusClass}`}>{status}</span></td>
                                       <td style={{textAlign: 'right'}}>
                                           {/* FIX: Updated onNavigate call to pass an options object */}
                                           <button onClick={() => onNavigate('form_details', { formId: form.id })} className="table-action-link view">View / Edit</button>
                                       </td>
                                   </tr>
                               );
                           }) : (
                                <tr>
                                    <td colSpan={showTerms ? 9 : 7} className="no-data-cell">No forms found for your admin code.</td>
                                </tr>
                           )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    
    const renderContent = () => {
        switch(view) {
            case 'pre_edit': return renderTable(preEditForms, 'Pre-Edit Forms');
            case 'post_edit': return renderTable(postEditForms, 'Post-Edit Forms');
            case 'filled': return renderTable(filledForms, 'Filled Forms');
            case 'admin_table': return renderAdminTableView();
            case 'pending_payments':
                return (
                    <div>
                        <button onClick={() => setView('dashboard')} className="back-link admin" style={{marginBottom: '1rem'}}>
                            &larr; Back to Dashboard
                        </button>
                        {renderPaymentsSection()}
                    </div>
                );
            case 'profile':
                return (
                    <div>
                        <button onClick={() => setView('dashboard')} className="back-link" style={{marginBottom: '1rem'}}>
                            &larr; Back to Dashboard
                        </button>
                        <div className="card profile-card">
                            <h3 className="card-title">Admin Profile</h3>
                            <p className="card-content-item"><strong>Name:</strong> {user.name}</p>
                            <p className="card-content-item"><strong>Location:</strong> {user.location}</p>
                            <p className="card-content-item"><strong>Email:</strong> {user.email}</p>
                            <p className="card-content-item"><strong>Admin Code:</strong> <span style={{fontWeight: 600, color: '#15803D'}}>{user.adminCode}</span></p>
                            <div className="card-divider">
                                <p className="card-content-item"><strong>Subscription:</strong> <span style={{textTransform: 'capitalize', fontWeight: 600}}>{user.subscription.status}</span></p>
                                <p className="card-content-item"><strong>Entries Left:</strong> <span style={{fontWeight: 600}}>{entriesLeft}</span></p>
                                <button onClick={() => setView('manage_subscription')} className={`card-button ${roleClass}`}>
                                    Manage Subscription
                                </button>
                            </div>
                            {user.subscription.status === 'active' && (
                                <div className="card-divider">
                                    <h4 className="share-link-title">Share Signup Link</h4>
                                    <p className="share-link-description">Share this link with students to have them sign up.</p>
                                    <div className="share-link-container">
                                        <input type="text" readOnly value={`${window.location.origin}${window.location.pathname}?page=signup`} className="share-link-input" />
                                        <button onClick={handleCopyLink} className="share-link-button">{linkCopied ? 'Copied!' : 'Copy'}</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'manage_subscription':
                return <ManageSubscription user={user} refreshUser={refreshUser} onBack={() => setView('profile')} />;
            case 'dashboard':
            default: return renderDashboard();
        }
    }

    return (
        <DashboardLayout user={user} onLogout={onLogout} onNavigateToProfile={() => setView('profile')}>
            {renderContent()}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Confirm Payment">
                {selectedNotification && (
                    <div className="modal-body">
                        <p style={{fontWeight: 600, marginBottom: '0.5rem'}}>Firm: {selectedNotification.firmName}</p>
                        <p style={{fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem'}}>Please verify the payment screenshot and select the plan to activate.</p>
                        <img src={selectedNotification.ssDataUrl} alt="Payment Screenshot" className="payment-modal-screenshot" />
                        <div className="activate-plan-buttons">
                            {SUBSCRIPTION_PLANS.map(plan => (
                                <button key={plan.key} onClick={() => handleConfirmPayment(plan)} disabled={processingPayment} className="activate-plan-button">
                                    <span className="plan-name">Activate {plan.name} Plan</span>
                                    <span className="plan-details">₹{plan.price} for {plan.duration_months} month(s)</span>
                                </button>
                            ))}
                        </div>
                        {processingPayment && <p style={{marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--admin-color)'}}>Processing and sending email...</p>}
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
};

const DashboardCard = ({ title, value, onClick, highlight = false }: { title: string, value: number | string, onClick: () => void, highlight?: boolean }) => (
    <button onClick={onClick} className={`admin-dashboard-card ${highlight ? 'highlight' : ''}`}>
        <p className="admin-card-title">{title}</p>
        <p className="admin-card-value">{value}</p>
    </button>
);

export default AdminDashboard;
