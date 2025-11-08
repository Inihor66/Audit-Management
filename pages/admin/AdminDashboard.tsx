import React, { useState, useEffect, useMemo } from 'react';
import { User, FormData, AdminNotification, SubscriptionPlan } from '../../types';
import * as storage from '../../services/storageService';
import { SUBSCRIPTION_PLANS } from '../../constants';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Modal } from '../../components/Modal';
import ProfilePage from '../firm/ProfilePage';
import ManageSubscription from '../firm/ManageSubscription';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  refreshUser: () => void;
}

const AdminDashboard = ({ user, onLogout, refreshUser }: AdminDashboardProps) => {
    const [view, setView] = useState('dashboard'); // dashboard, all_forms, pre_edit, post_edit, filled, payments, profile, manage_subscription
    const [allForms, setAllForms] = useState<FormData[]>([]);
    const [paymentNotifications, setPaymentNotifications] = useState<AdminNotification[]>([]);
    const [selectedForm, setSelectedForm] = useState<FormData | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editableForm, setEditableForm] = useState<Partial<Omit<FormData, 'adminCode'> & { adminCode?: string }>>({});

    const fetchData = () => {
        const allFormsFromStorage = storage.getForms();
        // Admins only see forms submitted with their code
        const relevantForms = allFormsFromStorage.filter(form => user.adminCode && Array.isArray(form.adminCode) && form.adminCode.includes(user.adminCode));
        setAllForms(relevantForms.sort((a,b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()));
        setPaymentNotifications(storage.getAdminNotifications().filter(n => !n.handled).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    useEffect(() => {
        fetchData();
        refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const preEditForms = useMemo(() => allForms.filter(f => !f.isApproved && !f.deleted), [allForms]);
    const postEditForms = useMemo(() => allForms.filter(f => f.isApproved && !f.studentSubmission && !f.deleted), [allForms]);
    const filledForms = useMemo(() => allForms.filter(f => !!f.studentSubmission && !f.deleted), [allForms]);
    
    const openFormModal = (form: FormData) => {
        setSelectedForm(form);
        // Convert adminCode array to string for editing
        setEditableForm({ 
            ...form, 
            adminCode: Array.isArray(form.adminCode) ? form.adminCode.join(', ') : form.adminCode,
            // ensure adminFeesRange is available for editing (may be null)
            adminFeesRange: form.adminFeesRange ?? '',
        });
        setIsFormModalOpen(true);
    };
    
    const handleUpdateAndApprove = (approve: boolean) => {
         if (selectedForm && editableForm.adminCode !== undefined) {
            const adminCodes = typeof editableForm.adminCode === 'string'
                ? editableForm.adminCode.split(',').map(c => c.trim()).filter(Boolean)
                : selectedForm.adminCode;
            
            const updatedForm = { 
                ...selectedForm,
                // Only map the editable bits we expect: adminCode and adminFeesRange
                adminCode: adminCodes,
                adminFeesRange: (editableForm.adminFeesRange === '' ? null : (editableForm.adminFeesRange as string)) ?? selectedForm.adminFeesRange ?? null,
                isApproved: approve ? true : selectedForm.isApproved,
            } as FormData;
            storage.updateForm(updatedForm);
            fetchData();
            setIsFormModalOpen(false);
        }
    }


    const openPaymentModal = (notification: AdminNotification) => {
        setSelectedNotification(notification);
        setIsPaymentModalOpen(true);
    };

    const handleConfirmPayment = (plan: SubscriptionPlan) => {
        if (selectedNotification) {
            const userToUpdate = storage.getUserById(selectedNotification.firmId);
            if (userToUpdate) {
                const startDate = new Date();
                const expiryDate = new Date();
                expiryDate.setMonth(startDate.getMonth() + plan.duration_months);

                userToUpdate.subscription = {
                    ...userToUpdate.subscription,
                    status: 'active',
                    plan: plan.key,
                    startDate: startDate.toISOString(),
                    expiryDate: expiryDate.toISOString(),
                    allowedEntries: 'infinity',
                };
                userToUpdate.pendingPaymentSS = null;
                userToUpdate.notifications.push({
                    id: crypto.randomUUID(),
                    message: `Your subscription for the ${plan.name} plan has been activated!`,
                    type: 'success',
                    read: false,
                    createdAt: new Date().toISOString()
                });
                storage.updateUser(userToUpdate);
            }
            
            const updatedNotif = {...selectedNotification, handled: true };
            storage.updateAdminNotification(updatedNotif);
            fetchData();
            setIsPaymentModalOpen(false);
        }
    };


    if (view === 'profile') {
        return <ProfilePage user={user} onBack={() => setView('dashboard')} onNavigate={setView} />
    }

    if (view === 'manage_subscription') {
        return <ManageSubscription user={user} refreshUser={refreshUser} onBack={() => setView('profile')} />;
    }

    const renderDashboard = () => (
      <div className="space-y-6">
          <div className="card">
              <h2 className="card-title">Admin Dashboard</h2>
              <p>Manage forms and user subscriptions. Your admin code is: <strong>{user.adminCode || 'Not set'}</strong></p>
          </div>
          <div className="dashboard-cards-grid">
              <DashboardCard title="Dashboard" value={allForms.filter(f => !f.deleted).length} onClick={() => setView('all_forms')} />
              <DashboardCard title="Pre-Edit Forms" value={preEditForms.length} onClick={() => setView('pre_edit')} />
              <DashboardCard title="Post-Edit (Live) Forms" value={postEditForms.length} onClick={() => setView('post_edit')} />
              <DashboardCard title="Filled Forms" value={filledForms.length} onClick={() => setView('filled')} />
          </div>
          <style>{`.dashboard-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }`}</style>
      </div>
    );

    const renderAllFormsDashboard = () => (
        <div>
            <div className="page-header">
                <div>
                    <h3 className="card-title">All Forms Dashboard</h3>
                    <p className="text-gray-500 mt-1">A complete overview of all forms in the system.</p>
                </div>
                <div>
                    <button onClick={() => setView('dashboard')} className="btn btn-secondary" style={{width: 'auto', marginRight: '1rem'}}>&larr; Back</button>
                    <button onClick={() => setView('payments')} className="btn btn-admin" style={{width: 'auto'}}>
                        View Pending Payments ({paymentNotifications.length})
                    </button>
                </div>
            </div>
            <div className="card" style={{marginTop: '1.5rem'}}>
                <div className="table-container">
                    <table className="table">
                        <thead className="admin-table-header">
                            <tr>
                                <th>Firm</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Last Updated</th>
                                <th style={{textAlign: 'right'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                           {allForms.filter(f => !f.deleted).length > 0 ? allForms.filter(f => !f.deleted).map(form => (
                               <tr key={form.id}>
                                   <td className="font-semibold">{form.firmName}</td>
                                   <td>{form.location}</td>
                                   <td>
                                        <span className={`status-badge ${
                                            form.studentSubmission ? 'status-badge-success' : form.isApproved ? 'status-badge-approved' : 'status-badge-pending'
                                        }`}>
                                            {form.studentSubmission ? 'Filled' : form.isApproved ? 'Approved' : 'Pending'}
                                        </span>
                                   </td>
                                   <td>{new Date(form.updatedAt || form.createdAt).toLocaleString()}</td>
                                   <td style={{textAlign: 'right'}}>
                                       <button onClick={() => openFormModal(form)} className="table-action-link view">View / Edit</button>
                                   </td>
                               </tr>
                           )) : (
                                <tr>
                                    <td colSpan={5} className="text-center" style={{padding: '2.5rem'}}>No forms found.</td>
                                </tr>
                           )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    
    const renderTable = (forms: FormData[], title: string) => {
        // Determine which fee column to show based on current view
        const feeHeader = view === 'pre_edit' ? 'Pre-Edit Fees' : view === 'post_edit' ? 'Post-Edit Fees' : 'Fees';
        return (
            <div>
                <button onClick={() => setView('dashboard')} className="header-action-btn mb-4">&larr; Back to Dashboard</button>
                <div className="card">
                    <h3 className="card-title">{title}</h3>
                    <div className="table-container">
                        <table className="table">
                            <thead className="admin-table-header">
                                <tr>
                                    <th>Firm</th>
                                    <th>Location</th>
                                    <th>{feeHeader}</th>
                                    <th>Date</th>
                                    <th>Student</th>
                                    <th>Last Updated</th>
                                    <th style={{textAlign: 'right'}}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                               {forms.length > 0 ? forms.map(form => (
                                   <tr key={form.id}>
                                       <td className="font-semibold">{form.firmName}</td>
                                       <td>{form.location}</td>
                                       <td>
                                           {view === 'pre_edit' && (
                                               // Pre-edit view: show firm-entered fees
                                               <div><small>Firm: </small><strong>{form.firmFeesRange}</strong></div>
                                           )}
                                           {view === 'post_edit' && (
                                               // Post-edit view: show admin-edited fees (fall back to 'N/A' if not set)
                                               <div><small>Admin: </small><strong>{form.adminFeesRange ?? 'N/A'}</strong></div>
                                           )}
                                           {view !== 'pre_edit' && view !== 'post_edit' && (
                                               // Other views: show both
                                               <div>
                                                   <div><small>Firm: </small><strong>{form.firmFeesRange}</strong></div>
                                                   <div><small>Admin: </small><strong>{form.adminFeesRange ?? 'N/A'}</strong></div>
                                               </div>
                                           )}
                                       </td>
                                       <td>{new Date(form.expectedDate).toLocaleDateString()}</td>
                                       <td>{form.studentSubmission?.studentName || 'N/A'}</td>
                                       <td>{new Date(form.updatedAt || form.createdAt).toLocaleString()}</td>
                                       <td style={{textAlign: 'right'}}>
                                           <button onClick={() => openFormModal(form)} className="table-action-link view">View / Edit</button>
                                       </td>
                                   </tr>
                               )) : (
                                    <tr>
                                        <td colSpan={7} className="text-center" style={{padding: '2.5rem'}}>No forms in this category.</td>
                                    </tr>
                               )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderPayments = () => (
         <div>
            <button onClick={() => setView('dashboard')} className="header-action-btn mb-4">&larr; Back to Dashboard</button>
            <div className="card">
                <h3 className="card-title">Pending Payment Approvals</h3>
                <div className="space-y-4">
                    {paymentNotifications.length > 0 ? paymentNotifications.map(notif => (
                        <div key={notif.id} className="payment-notification-item">
                            <div>
                                <p className="font-semibold">{notif.firmName}</p>
                                <p className="text-sm text-gray-500">Submitted on {new Date(notif.createdAt).toLocaleString()}</p>
                            </div>
                            <button onClick={() => openPaymentModal(notif)} className="btn btn-admin" style={{width: 'auto'}}>Review</button>
                        </div>
                    )) : (
                        <p className="text-center" style={{padding: '2.5rem'}}>No pending payment approvals.</p>
                    )}
                </div>
                 <style>{`.payment-notification-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid var(--color-border); border-radius: 0.5rem; }`}</style>
            </div>
         </div>
    );
    
    const renderContent = () => {
        switch(view) {
            case 'all_forms': return renderAllFormsDashboard();
            case 'pre_edit': return renderTable(preEditForms, 'Pre-Edit Forms');
            case 'post_edit': return renderTable(postEditForms, 'Post-Edit (Live) Forms');
            case 'filled': return renderTable(filledForms, 'Filled Forms');
            case 'payments': return renderPayments();
            case 'dashboard':
            default: return renderDashboard();
        }
    }

    return (
        <DashboardLayout user={user} onLogout={onLogout} onNavigateToProfile={() => setView('profile')}>
            {renderContent()}

            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title="Manage Form">
                {selectedForm && (
 <div className="space-y-4" style={{maxHeight: '70vh', overflowY: 'auto', paddingRight: '1rem'}}>
    {/* --- Show complete firm-filled form (read-only) --- */}
    <div className="form-group">
        <label>Firm Name</label>
        <input type="text" value={selectedForm.firmName} readOnly className="form-input" />
    </div>
    <div className="form-group">
        <label>Location</label>
        <input type="text" value={selectedForm.location} readOnly className="form-input" />
    </div>
    <div className="form-group">
        <label>Expected Date</label>
        <input type="date" value={new Date(selectedForm.expectedDate).toISOString().split('T')[0]} readOnly className="form-input" />
    </div>
    <div className="form-group">
        <label>Payment Term</label>
        <input type="text" value={selectedForm.paymentTerm.replace('_', ' ')} readOnly className="form-input" />
    </div>
    <div className="form-group">
        <label>Payment Reminder</label>
        <input type="text" value={selectedForm.paymentReminder ? 'Enabled' : 'Disabled'} readOnly className="form-input" />
    </div>
    <div className="form-group">
        <label>Firm Entered Fees (pre-edit)</label>
        <input type="text" value={selectedForm.firmFeesRange} readOnly className="form-input" />
    </div>
    {selectedForm.studentSubmission && (
        <div className="form-group" style={{paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)'}}>
            <h4 style={{margin: '0 0 0.5rem 0', fontSize: '0.95rem'}}>Student Submission</h4>
            <div className="form-group">
                <label>Student Name</label>
                <input type="text" value={selectedForm.studentSubmission.studentName} readOnly className="form-input" />
            </div>
            <div className="form-group">
                <label>Student Email</label>
                <input type="email" value={selectedForm.studentSubmission.studentEmail} readOnly className="form-input" />
            </div>
            <div className="form-group">
                <label>Phone</label>
                <input type="text" value={selectedForm.studentSubmission.studentPhone ?? 'N/A'} readOnly className="form-input" />
            </div>
            <div className="form-group">
                <label>Aadhar</label>
                <input type="text" value={selectedForm.studentSubmission.studentAadhar ?? 'N/A'} readOnly className="form-input" />
            </div>
            <div className="form-group">
                <label>Remarks</label>
                <textarea rows={4} value={selectedForm.studentSubmission.remarks ?? 'No remarks provided.'} readOnly className="form-textarea" />
            </div>
            <div className="form-group">
                <label>Submitted At</label>
                <input type="text" value={new Date(selectedForm.studentSubmission.submittedAt).toLocaleString()} readOnly className="form-input" />
            </div>
        </div>
    )}

    {/* --- Admin editable fields --- */}
    <div style={{paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)'}} />
    <div className="form-group">
        <label>Admin Edited Fees (post-edit)</label>
        <input
            type="text"
            value={(editableForm.adminFeesRange as string) ?? ''}
            onChange={e => setEditableForm(f => ({...f, adminFeesRange: e.target.value}))}
            placeholder="e.g., 6000-8000"
            className="form-input"
        />
    </div>
    <div className="form-group">
        <label>Admin Code(s)</label>
        <input
            type="text"
            value={String(editableForm.adminCode ?? '')}
            onChange={e => setEditableForm(f => ({...f, adminCode: e.target.value}))}
            placeholder="Comma-separated admin codes"
            className="form-input"
        />
    </div>
 
                         <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)'}}>
                             <button onClick={() => setIsFormModalOpen(false)} className="btn btn-secondary" style={{width: 'auto'}}>Cancel</button>
                             <button onClick={() => handleUpdateAndApprove(false)} className="btn" style={{backgroundColor: 'var(--color-info)', width: 'auto'}}>Save Changes</button>
                             {!selectedForm.isApproved && <button onClick={() => handleUpdateAndApprove(true)} className="btn btn-admin" style={{width: 'auto'}}>Save & Approve</button>}
                         </div>
                      </div>
                 )}
             </Modal>

            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Confirm Payment">
                {selectedNotification && (
                    <div>
                        <p className="font-semibold mb-2">User: {selectedNotification.firmName}</p>
                        <p className="text-sm text-gray-600 mb-4">Please verify the payment screenshot and select the plan to activate.</p>
                        <img src={selectedNotification.ssDataUrl} alt="Payment Screenshot" style={{maxHeight: '20rem', width: 'auto', margin: '0 auto', borderRadius: '0.375rem', border: '1px solid var(--color-border)'}}/>
                        <div style={{marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                            {SUBSCRIPTION_PLANS.map(plan => (
                                <button key={plan.key} onClick={() => handleConfirmPayment(plan)} className="payment-confirm-btn">
                                    <span className="font-semibold">Activate {plan.name} Plan</span>
                                    <span className="text-sm text-gray-500 block">₹{plan.price} for {plan.duration_months} month(s)</span>
                                </button>
                            ))}
                        </div>
                        <style>{`.payment-confirm-btn { width: 100%; text-align: left; padding: 0.75rem; border: 1px solid var(--color-border); border-radius: 0.375rem; cursor: pointer; } .payment-confirm-btn:hover { background-color: var(--color-bg-light); }`}</style>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
};

const DashboardCard = ({ title, value, onClick, highlight = false }: { title: string, value: number, onClick: () => void, highlight?: boolean }) => (
    <button onClick={onClick} className={`dashboard-card ${highlight ? 'highlight' : ''}`}>
        <p>{title}</p>
        <span>{value}</span>
        <style>{`
            .dashboard-card { text-align: left; transition: all 0.2s; transform: translateY(0); padding: 1.5rem; border-radius: 0.5rem; background-color: var(--color-bg-white); box-shadow: var(--shadow); border: none; cursor: pointer; }
            .dashboard-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
            .dashboard-card p { font-size: 0.875rem; font-weight: 500; color: var(--color-text-light); margin: 0; }
            .dashboard-card span { font-size: 1.875rem; font-weight: 700; color: var(--color-text-primary); }
            .dashboard-card.highlight { background-color: #fef9c3; }
        `}</style>
    </button>
);

export default AdminDashboard;