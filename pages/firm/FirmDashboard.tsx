
import { useState, useEffect, useMemo } from 'react';
import { User, FormData, Role } from '../../types';
import * as storage from '../../services/storageService';
import { DashboardLayout } from '../../components/DashboardLayout';
import { PlusIcon } from '../../components/icons/PlusIcon';
import { BriefcaseIcon } from '../../components/icons/BriefcaseIcon';
import { Modal } from '../../components/Modal';
import AuditForm from './AuditForm';
import ManageSubscription from './ManageSubscription';

interface FirmDashboardProps {
  user: User;
  onLogout: () => void;
  refreshUser: () => void;
  onNavigate: (page: string, options?: { role?: Role; formId?: string; }) => void;
}

const FirmDashboard = ({ user, onLogout, refreshUser, onNavigate }: FirmDashboardProps) => {
  const [view, setView] = useState('dashboard'); // dashboard, form_editor, manage_subscription, profile
  const [forms, setForms] = useState<FormData[]>([]);
  const [formToDelete, setFormToDelete] = useState<FormData | null>(null);
  const [formToEdit, setFormToEdit] = useState<FormData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats calculations
  const entriesLeft = user.subscription.allowedEntries === 'infinity' ? 'Unlimited' : user.subscription.allowedEntries - user.subscription.entriesUsed;
  const canCreateForm = user.subscription.allowedEntries === 'infinity' || user.subscription.entriesUsed < user.subscription.allowedEntries;
  
  // Check if subscription is expired but unlimited features are still active
  const isUnlimitedButExpired = user.subscription.status === 'inactive' && user.subscription.allowedEntries === 'infinity';

  const totalForms = forms.length;
  const activeForms = forms.filter(f => f.isApproved && !f.studentSubmission).length;
  const filledForms = forms.filter(f => !!f.studentSubmission).length;

  const fetchForms = () => {
    const allForms = storage.getForms();
    setForms(allForms.filter(f => f.createdByUserId === user.id && !f.deleted).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => {
    fetchForms();
    refreshUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleFormSuccess = () => {
    fetchForms();
    refreshUser();
    setView('dashboard');
    setFormToEdit(null);
  };

  const openFormEditor = (form?: FormData) => {
    if (form) {
        setFormToEdit(form);
    } else {
        if (!canCreateForm) {
            alert('Entry limit reached. Please purchase a subscription.');
            return;
        }
        setFormToEdit(null);
    }
    setView('form_editor');
  };
  
  const openDeleteModal = (form: FormData) => {
    setFormToDelete(form);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteForm = () => {
    if (formToDelete) {
      const updatedForm = { ...formToDelete, deleted: true };
      
      const userToUpdate = { ...user };
      // Count entry on deletion only if it hasn't been counted on approval yet
      if (!formToDelete.entryCounted) {
          updatedForm.entryCounted = true;
          if (userToUpdate.subscription.allowedEntries !== 'infinity') {
            userToUpdate.subscription.entriesUsed += 1;
          }
      }
      
      storage.updateForm(updatedForm);
      storage.updateUser(userToUpdate);
      
      fetchForms();
      refreshUser();
      setIsDeleteModalOpen(false);
      setFormToDelete(null);
    }
  };

  const filteredForms = useMemo(() => {
    if (!searchTerm) return forms;
    return forms.filter(form => 
        form.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.adminCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (form.studentSubmission?.studentName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [forms, searchTerm]);

  // --- Render Functions ---

  const renderProfile = () => {
    // Calculate percentage for usage bar
    const total = user.subscription.allowedEntries === 'infinity' ? 100 : user.subscription.allowedEntries;
    const used = user.subscription.entriesUsed;
    const percentage = user.subscription.allowedEntries === 'infinity' ? 100 : Math.min(100, (used / total) * 100);
    const isInfinity = user.subscription.allowedEntries === 'infinity';

    return (
    <div className="max-w-4xl mx-auto">
        <button onClick={() => setView('dashboard')} className="back-link firm mb-4">← Back to Dashboard</button>
        
        <div className="profile-container-grid">
            {/* Left Sidebar: Identity */}
            <div className="profile-sidebar">
                <div className="profile-identity-card">
                    <div className="identity-banner firm"></div>
                    <div className="identity-avatar firm">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="identity-info">
                        <h2>{user.name}</h2>
                        <span className="user-role-badge firm">Firm Account</span>
                    </div>
                    <div className="identity-stats">
                        <div className="id-stat">
                            <strong>{totalForms}</strong>
                            <span>Total Audits</span>
                        </div>
                        <div className="id-stat">
                            <strong>{filledForms}</strong>
                            <span>Completed</span>
                        </div>
                    </div>
                </div>
                
                <div className="profile-sidebar-actions">
                    <button onClick={onLogout} className="sidebar-action-btn logout">
                        Log Out
                    </button>
                </div>
            </div>

            {/* Right Content: Details */}
            <div className="profile-main">
                <div className="profile-section-card">
                    <h3 className="section-title">Firm Details</h3>
                    <div className="details-grid-modern">
                         <div className="detail-box">
                            <label>Firm Name</label>
                            <p>{user.name}</p>
                         </div>
                         <div className="detail-box">
                            <label>Location</label>
                            <p>{user.location || 'Not set'}</p>
                         </div>
                         <div className="detail-box">
                            <label>Email Address</label>
                            <p>{user.email}</p>
                         </div>
                         <div className="detail-box">
                            <label>System ID</label>
                            <p className="font-mono text-gray-500 text-sm">{user.id.slice(0, 8)}...</p>
                         </div>
                    </div>
                </div>

                <div className="profile-section-card">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="section-title mb-0">Subscription & Usage</h3>
                        <span className={`status-badge ${user.subscription.status === 'active' || isUnlimitedButExpired ? 'green' : 'yellow'}`}>
                            {user.subscription.status === 'active' ? 'ACTIVE' : (isUnlimitedButExpired ? 'UNLOCKED' : 'INACTIVE')}
                        </span>
                    </div>

                    <div className="usage-container">
                        <div className="usage-header">
                            <span className="plan-name">
                                {isUnlimitedButExpired ? 'Legacy (Unlocked)' : (user.subscription.plan ? user.subscription.plan.replace('_', ' ') + ' Plan' : 'Free Plan')}
                            </span>
                            <span className="usage-text">
                                {used} / {isInfinity ? '∞' : total} Entries Used
                            </span>
                        </div>
                        <div className="usage-bar-bg">
                            <div 
                                className={`usage-bar-fill ${isInfinity ? 'infinity-gradient' : ''}`} 
                                style={{width: `${percentage}%`}}
                            ></div>
                        </div>
                        <p className="expiry-text">
                            {user.subscription.expiryDate 
                                ? `Valid until ${new Date(user.subscription.expiryDate).toLocaleDateString()}` 
                                : 'No expiration date'}
                        </p>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button onClick={() => setView('manage_subscription')} className="upgrade-btn-small">
                            {user.subscription.plan === 'yearly' ? 'Manage Plan' : 'Upgrade Plan'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )};

  const renderDashboard = () => (
    <div className="firm-dashboard-content">
        {/* Modern Gradient Banner */}
        <div className="dashboard-welcome-banner">
            <div className="banner-shape one"></div>
            <div className="banner-shape two"></div>
            <div className="dashboard-welcome-content">
                <h1 className="dashboard-welcome-title">Welcome back, {user.name}</h1>
                <p className="dashboard-welcome-text">Manage your audit forms, track student submissions, and streamline your workflow all in one place.</p>
            </div>
        </div>
        
        {/* Stats Grid - Overlapping the banner */}
        <div className="firm-stats-grid">
            <div className="stat-card">
                <div className="stat-label">Total Forms</div>
                <div className="stat-value">{totalForms}</div>
                <div className="stat-icon-container">
                    <BriefcaseIcon className="w-8 h-8" />
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-label">Active / Open</div>
                <div className="stat-value">{activeForms}</div>
                <div className="stat-desc">Waiting for students</div>
                <div className="stat-icon-container">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{filledForms}</div>
                <div className="stat-desc">Forms filled by students</div>
                <div className="stat-icon-container">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
            <div className="stat-card highlight">
                <div className="stat-label text-firm-600">Entries Left</div>
                <div className="stat-value text-firm-600">{entriesLeft}</div>
                <button onClick={() => setView('manage_subscription')} className="text-xs font-semibold text-firm-600 hover:underline mt-2 text-left">
                    Upgrade Plan &rarr;
                </button>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="card">
            <div className="dashboard-action-bar">
                <h2 className="dashboard-title">My Audit Forms</h2>
                
                <div className="action-bar-right">
                    <input 
                        type="text"
                        placeholder="Search forms..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="table-search-input firm"
                    />
                    <button 
                        onClick={() => openFormEditor()} 
                        disabled={!canCreateForm} 
                        className="create-new-form-button" 
                        title={!canCreateForm ? 'Entry limit reached' : 'Create new audit form'}
                    >
                        <PlusIcon className="w-4 h-4" /> 
                        Create Form
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Location</th>
                            <th>Expected Date</th>
                            <th>Status</th>
                            <th>Student</th>
                            <th style={{textAlign: 'right'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredForms.length > 0 ? filteredForms.map(form => (
                            <tr key={form.id}>
                                <td>{form.location}</td>
                                <td>{new Date(form.expectedDate).toLocaleDateString()}</td>
                                <td>
                                    <span className={`status-badge ${form.isApproved ? (form.studentSubmission ? 'green' : 'blue') : 'yellow'}`}>
                                        {form.isApproved ? (form.studentSubmission ? 'Filled' : 'Approved') : 'Pending'}
                                    </span>
                                </td>
                                <td>{form.studentSubmission?.studentName || <span className="text-gray-400 italic">None</span>}</td>
                                <td style={{textAlign: 'right'}}>
                                    <button onClick={() => onNavigate('form_details', { formId: form.id })} className="table-action-link view">View</button>
                                    <button onClick={() => openFormEditor(form)} className="table-action-link edit" disabled={!!form.studentSubmission}>Edit</button>
                                    <button onClick={() => openDeleteModal(form)} className="table-action-link delete">Delete</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="no-data-cell">
                                    {searchTerm ? 'No forms match your search.' : 'No audit forms created yet.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

  const renderContent = () => {
      switch (view) {
          case 'form_editor':
              return <AuditForm user={user} onSuccess={handleFormSuccess} onCancel={() => { setView('dashboard'); setFormToEdit(null); }} initialData={formToEdit || undefined} />;
          case 'manage_subscription':
              return <ManageSubscription user={user} refreshUser={refreshUser} onBack={() => setView('dashboard')} />;
          case 'profile':
              return renderProfile();
          case 'dashboard':
          default:
              return renderDashboard();
      }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} onNavigateToProfile={() => setView('profile')}>
        {renderContent()}

        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
            <div>
                <p>Are you sure you want to delete the form for audit at <strong>{formToDelete?.location}</strong>?</p>
                <p className="text-red-600 text-sm mt-2">Note: Deleting a form does not refund your entry count if it was already approved.</p>
                <div className="form-actions" style={{marginTop: '1.5rem'}}>
                    <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="form-button cancel">Cancel</button>
                    <button type="button" onClick={handleDeleteForm} className="form-button delete">Delete Form</button>
                </div>
            </div>
        </Modal>
    </DashboardLayout>
  );
};

export default FirmDashboard;
