import { useState, useEffect, useMemo, useCallback } from 'react';
import { User, FormData, AdminNotification, Role } from '../../types';
import * as storage from '../../services/storageService';
import { SUBSCRIPTION_PLANS } from '../../constants';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Modal } from '../../components/Modal';
import ManageSubscription from '../firm/ManageSubscription';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  refreshUser: () => void;
  onNavigate: (page: string, options?: { role?: Role; formId?: string; }) => void;
}

const AdminDashboard = ({ user, onLogout, refreshUser, onNavigate }: AdminDashboardProps) => {
    const [view, setView] = useState('dashboard'); // dashboard, pre_edit, post_edit, filled, admin_table, profile, manage_subscription, pending_payments
    const [allForms, setAllForms] = useState<FormData[]>([]);
    const [paymentNotifications, setPaymentNotifications] = useState<AdminNotification[]>([]);
    const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    // State for payment processing
    const [processingPayment, setProcessingPayment] = useState(false);
    
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

    // Computed Lists
    const pendingForms = useMemo(() => allForms.filter(f => !f.isApproved), [allForms]);
    const approvedForms = useMemo(() => allForms.filter(f => f.isApproved && !f.studentSubmission), [allForms]);
    const filledForms = useMemo(() => allForms.filter(f => !!f.studentSubmission), [allForms]);

    // Payment Handling
    const handleOpenPaymentModal = (notification: AdminNotification) => {
        setSelectedNotification(notification);
        setIsPaymentModalOpen(true);
    };

    const handleApprovePayment = async (approve: boolean) => {
        if (!selectedNotification) return;

        setProcessingPayment(true);
        const firmId = selectedNotification.firmId;
        const firmUser = storage.getUserById(firmId);

        if (firmUser) {
            if (approve && firmUser.pendingPlanKey) {
                // Activate Plan
                 const planDetails = SUBSCRIPTION_PLANS.find(p => p.key === firmUser.pendingPlanKey);
                 if (planDetails) {
                    const startDate = new Date();
                    const expiryDate = new Date();
                    expiryDate.setMonth(startDate.getMonth() + planDetails.duration_months);

                    const updatedFirm = {
                        ...firmUser,
                        subscription: {
                            ...firmUser.subscription,
                            status: 'active' as const,
                            plan: firmUser.pendingPlanKey,
                            startDate: startDate.toISOString(),
                            expiryDate: expiryDate.toISOString(),
                            allowedEntries: 'infinity' as const,
                        },
                        pendingPaymentSS: null,
                        pendingPlanKey: undefined,
                        paymentRequestDate: undefined,
                        notifications: [
                            ...firmUser.notifications,
                            {
                                id: storage.generateId(),
                                message: `Your ${planDetails.name} subscription has been approved by Admin!`,
                                type: 'success' as const,
                                read: false,
                                createdAt: new Date().toISOString()
                            }
                        ]
                    };
                    storage.updateUser(updatedFirm);
                 }
            } else if (!approve) {
                 // Reject Plan
                 const updatedFirm = {
                        ...firmUser,
                         pendingPaymentSS: null,
                         pendingPlanKey: undefined,
                         paymentRequestDate: undefined,
                         notifications: [
                            ...firmUser.notifications,
                            {
                                id: storage.generateId(),
                                message: `Your subscription request was rejected. Please contact admin.`,
                                type: 'warning' as const,
                                read: false,
                                createdAt: new Date().toISOString()
                            }
                        ]
                 };
                 storage.updateUser(updatedFirm);
            }
        }

        // Mark notification handled
        storage.updateAdminNotification({ ...selectedNotification, handled: true });
        
        setIsPaymentModalOpen(false);
        setSelectedNotification(null);
        setProcessingPayment(false);
        fetchData();
        refreshUser();
    };

    const renderTable = (data: FormData[], title: string, emptyMsg: string) => (
         <div className="card">
            <h3 className="table-title">{title}</h3>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Firm</th>
                            <th>Location</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th style={{textAlign: 'right'}}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map(form => (
                             <tr key={form.id}>
                                <td>{form.firmName}</td>
                                <td>{form.location}</td>
                                <td>{new Date(form.expectedDate).toLocaleDateString()}</td>
                                <td>
                                     <span className={`status-badge ${form.isApproved ? (form.studentSubmission ? 'green' : 'blue') : 'yellow'}`}>
                                        {form.isApproved ? (form.studentSubmission ? 'Filled' : 'Open') : 'Pending'}
                                    </span>
                                </td>
                                <td style={{textAlign: 'right'}}>
                                    <button onClick={() => onNavigate('form_details', { formId: form.id })} className="table-action-link view">View/Edit</button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="no-data-cell">{emptyMsg}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
         </div>
    );

    const renderDashboard = () => (
        <div className="admin-dashboard-content">
             <div className="dashboard-welcome-banner" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
                 <div className="dashboard-welcome-content">
                    <h1 className="dashboard-welcome-title">Admin Dashboard</h1>
                    <p className="dashboard-welcome-text">Code: <strong>{adminCode}</strong> | Manage firms, payments, and audits.</p>
                </div>
             </div>

             <div className="firm-stats-grid">
                <div className="stat-card" onClick={() => setView('pending_payments')} style={{cursor: 'pointer'}}>
                    <div className="stat-label">Pending Payments</div>
                    <div className="stat-value">{paymentNotifications.length}</div>
                    <div className="stat-desc">{paymentNotifications.length > 0 ? 'Action Required' : 'All clear'}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Forms</div>
                    <div className="stat-value">{allForms.length}</div>
                </div>
                 <div className="stat-card">
                    <div className="stat-label">Filled Forms</div>
                    <div className="stat-value">{filledForms.length}</div>
                </div>
             </div>
             
            <div className="tabs-container" style={{marginTop: '2rem'}}>
                <nav className="tabs-nav">
                     <button onClick={() => setView('dashboard')} className={`tab-button ${view === 'dashboard' ? 'active' : ''}`}>Overview</button>
                     <button onClick={() => setView('pre_edit')} className={`tab-button ${view === 'pre_edit' ? 'active' : ''}`}>Pending Approval ({pendingForms.length})</button>
                     <button onClick={() => setView('post_edit')} className={`tab-button ${view === 'post_edit' ? 'active' : ''}`}>Open / Approved ({approvedForms.length})</button>
                     <button onClick={() => setView('filled')} className={`tab-button ${view === 'filled' ? 'active' : ''}`}>Filled ({filledForms.length})</button>
                </nav>
            </div>
            
            {view === 'dashboard' && (
                <div style={{marginTop: '1.5rem'}}>
                    {paymentNotifications.length > 0 && (
                        <div className="card" style={{marginBottom: '2rem', border: '1px solid #fcd34d'}}>
                            <div className="card-header" style={{backgroundColor: '#fffbeb'}}>
                                <h3 style={{margin: 0, color: '#92400e'}}>Urgent: Pending Payment Verifications</h3>
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Firm Name</th>
                                            <th>Date</th>
                                            <th style={{textAlign: 'right'}}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentNotifications.map(n => (
                                            <tr key={n.id}>
                                                <td>{n.firmName}</td>
                                                <td>{new Date(n.createdAt).toLocaleDateString()}</td>
                                                <td style={{textAlign: 'right'}}>
                                                    <button onClick={() => handleOpenPaymentModal(n)} className="table-action-link view">Verify</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {renderTable(allForms.slice(0, 5), 'Recent Activity', 'No forms found.')}
                </div>
            )}
            
            {view === 'pre_edit' && renderTable(pendingForms, 'Pending Forms (Pre-Edit)', 'No pending forms.')}
            {view === 'post_edit' && renderTable(approvedForms, 'Approved Forms (Post-Edit)', 'No approved forms.')}
            {view === 'filled' && renderTable(filledForms, 'Filled Forms', 'No filled forms.')}
            {view === 'pending_payments' && (
                 <div className="card">
                     <button onClick={() => setView('dashboard')} className="back-link">&larr; Back</button>
                     <h3 className="table-title">Payment Verifications</h3>
                     <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Firm Name</th>
                                    <th>Date</th>
                                    <th style={{textAlign: 'right'}}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentNotifications.length > 0 ? paymentNotifications.map(n => (
                                    <tr key={n.id}>
                                        <td>{n.firmName}</td>
                                        <td>{new Date(n.createdAt).toLocaleDateString()}</td>
                                        <td style={{textAlign: 'right'}}>
                                            <button onClick={() => handleOpenPaymentModal(n)} className="table-action-link view">Verify</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="no-data-cell">No pending payments.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>
            )}
        </div>
    );
    
    // Admin Profile View
    const renderProfile = () => (
        <div className="max-w-4xl mx-auto">
             <button onClick={() => setView('dashboard')} className="back-link mb-4">← Back to Dashboard</button>
             <div className="profile-container-grid">
                  <div className="profile-sidebar">
                      <div className="profile-identity-card">
                          <div className="identity-banner admin"></div>
                           <div className="identity-avatar admin">{user.name.charAt(0).toUpperCase()}</div>
                           <div className="identity-info">
                                <h2>{user.name}</h2>
                                <span className="user-role-badge admin">Admin Account</span>
                           </div>
                           <div className="profile-sidebar-actions">
                                <button onClick={onLogout} className="sidebar-action-btn logout">Log Out</button>
                           </div>
                      </div>
                  </div>
                  <div className="profile-main">
                       <div className="profile-section-card">
                           <h3 className="section-title">Admin Details</h3>
                           <div className="details-grid-modern">
                                <div className="detail-box">
                                    <label>Name</label>
                                    <p>{user.name}</p>
                                </div>
                                <div className="detail-box">
                                    <label>Email</label>
                                    <p>{user.email}</p>
                                </div>
                                <div className="detail-box">
                                    <label>Admin Code</label>
                                    <p className="font-mono">{user.adminCode}</p>
                                </div>
                           </div>
                       </div>
                       
                        <div className="profile-section-card">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="section-title mb-0">My Subscription</h3>
                                <span className={`status-badge ${user.subscription.status === 'active' ? 'green' : 'yellow'}`}>
                                    {user.subscription.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                             <div className="usage-container">
                                <div className="usage-header">
                                    <span className="plan-name">{user.subscription.plan ? user.subscription.plan + ' Plan' : 'Free Plan'}</span>
                                    <span className="usage-text">{user.subscription.entriesUsed} / {user.subscription.allowedEntries === 'infinity' ? '∞' : user.subscription.allowedEntries} Entries</span>
                                </div>
                             </div>
                             <div className="mt-4 flex justify-end">
                                <button onClick={() => setView('manage_subscription')} className="upgrade-btn-small">Upgrade Plan</button>
                             </div>
                        </div>
                  </div>
             </div>
        </div>
    );

    const renderContent = () => {
        if (view === 'profile') return renderProfile();
        if (view === 'manage_subscription') return <ManageSubscription user={user} refreshUser={refreshUser} onBack={() => setView('profile')} />;
        return renderDashboard();
    };

    return (
        <DashboardLayout user={user} onLogout={onLogout} onNavigateToProfile={() => setView('profile')}>
             {renderContent()}

             {/* Payment Verification Modal */}
             <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Verify Payment">
                 <div>
                     {selectedNotification && (
                         <>
                            <p><strong>Firm:</strong> {selectedNotification.firmName}</p>
                            <p className="mb-4">Please verify the screenshot below:</p>
                            <div style={{border: '1px solid #e5e7eb', padding: '0.5rem', marginBottom: '1rem', borderRadius: '0.375rem', maxHeight: '300px', overflowY: 'auto'}}>
                                 <img src={selectedNotification.ssDataUrl} alt="Payment Proof" style={{width: '100%', display: 'block'}} />
                            </div>
                            <div className="form-actions">
                                <button onClick={() => handleApprovePayment(false)} className="form-button cancel" disabled={processingPayment}>Reject</button>
                                <button onClick={() => handleApprovePayment(true)} className="form-button submit admin" disabled={processingPayment}>
                                    {processingPayment ? 'Processing...' : 'Approve Payment'}
                                </button>
                            </div>
                         </>
                     )}
                 </div>
             </Modal>
        </DashboardLayout>
    );
};

export default AdminDashboard;
