
import React, { useState, useEffect, useMemo } from 'react';
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

  const roleClass = user.role.toLowerCase();
  
  // Stats calculations
  const entriesLeft = user.subscription.allowedEntries === 'infinity' ? 'Unlimited' : user.subscription.allowedEntries - user.subscription.entriesUsed;
  const canCreateForm = user.subscription.allowedEntries === 'infinity' || user.subscription.entriesUsed < user.subscription.allowedEntries;
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

  const renderProfile = () => (
    <div className="max-w-4xl mx-auto">
        <button onClick={() => setView('dashboard')} className="back-link firm mb-4">← Back to Dashboard</button>
        <div className="card profile-card">
            <div className="profile-header">
                <div className="profile-avatar-placeholder firm">
                   {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                    <h2 className="profile-name">{user.name}</h2>
                    <p className="profile-role">Firm Account</p>
                </div>
            </div>
            
            <div className="profile-details-grid">
                <div className="detail-item">
                    <label>Firm Name</label>
                    <p>{user.name}</p>
                </div>
                <div className="detail-item">
                    <label>Location</label>
                    <p>{user.location || 'Not set'}</p>
                </div>
                <div className="detail-item">
                    <label>Email</label>
                    <p>{user.email}</p>
                </div>
                <div className="detail-item">
                    <label>Account ID</label>
                    <p className="font-mono text-sm">{user.id.slice(0, 8)}...</p>
                </div>
            </div>

            <div className="card-divider"></div>
            
            <div className="subscription-section mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Subscription Status</h3>
                    <span className={`status-badge ${user.subscription.status === 'active' ? 'green' : 'yellow'}`}>
                        {user.subscription.status.toUpperCase()}
                    </span>
                </div>
                
                <div className="sub-details-container">
                    <div className="detail-item">
                        <label>Current Plan</label>
                        <p className="capitalize font-semibold text-firm-600">
                            {user.subscription.plan ? user.subscription.plan.replace('_', ' ') : 'Free Plan'}
                        </p>
                    </div>
                    <div className="detail-item">
                        <label>Entries Used</label>
                        <p>{user.subscription.entriesUsed}</p>
                    </div>
                    <div className="detail-item">
                        <label>Entry Allowance</label>
                        <p>{user.subscription.allowedEntries === 'infinity' ? 'Unlimited' : user.subscription.allowedEntries}</p>
                    </div>
                    <div className="detail-item">
                        <label>Expiry Date</label>
                        <p>{user.subscription.expiryDate ? new Date(user.subscription.expiryDate).toLocaleDateString() : 'No Expiry'}</p>
                    </div>
                </div>

                <div className="mt-6 flex gap-4">
                    <button onClick={() => setView('manage_subscription')} className="card-button firm w-auto px-6">
                        Manage Subscription
                    </button>
                </div>
            </div>
        </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="firm-dashboard-content">
        {/* Welcome & Stats */}
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user.name}</h1>
            <p className="text-gray-600 mb-6">Here is an overview of your audit activities.</p>
            
            <div className="firm-stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Forms</div>
                    <div className="stat-value">{totalForms}</div>
                    <div className="stat-icon-container bg-blue-100 text-blue-600">
                        <BriefcaseIcon className="w-6 h-6" />
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Active / Open</div>
                    <div className="stat-value">{activeForms}</div>
                    <div className="stat-desc">Waiting for students</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Completed</div>
                    <div className="stat-value">{filledForms}</div>
                    <div className="stat-desc">Forms filled by students</div>
                </div>
                <div className="stat-card highlight">
                    <div className="stat-label">Entries Left</div>
                    <div className="stat-value text-firm-600">{entriesLeft}</div>
                    <button onClick={() => setView('manage_subscription')} className="text-xs font-semibold text-firm-600 hover:underline mt-1">
                        Upgrade Plan &rarr;
                    </button>
                </div>
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
                                <td style={{fontWeight: 500}}>{form.location}</td>
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
