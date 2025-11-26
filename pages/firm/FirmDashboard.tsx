
import React, { useState, useEffect, useMemo } from 'react';
import { User, FormData, Role } from '../../types';
import * as storage from '../../services/storageService';
import { DashboardLayout } from '../../components/DashboardLayout';
import { PlusIcon } from '../../components/icons/PlusIcon';
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
  const entriesLeft = user.subscription.allowedEntries === 'infinity' ? 'Unlimited' : user.subscription.allowedEntries - user.subscription.entriesUsed;
  const canCreateForm = user.subscription.allowedEntries === 'infinity' || user.subscription.entriesUsed < user.subscription.allowedEntries;

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

  if (view === 'form_editor') {
    return <AuditForm user={user} onSuccess={handleFormSuccess} onCancel={() => { setView('dashboard'); setFormToEdit(null); }} initialData={formToEdit || undefined} />;
  }

  if (view === 'manage_subscription') {
      return <ManageSubscription user={user} refreshUser={refreshUser} onBack={() => setView('dashboard')} />;
  }

  return (
    <DashboardLayout user={user} onLogout={onLogout}>
        <div className="card">
            <div className="dashboard-header-bar">
                <div className="dashboard-header-bar-left">
                    <h2 className="dashboard-title">My Audit Forms</h2>
                    <p className="dashboard-subtitle">
                        Entries left: <span className={`entries-count ${entriesLeft === 'Unlimited' || (typeof entriesLeft === 'number' && entriesLeft > 10) ? 'green' : 'red'}`}>{entriesLeft}</span>
                    </p>
                </div>
                <div className="dashboard-header-bar-right">
                    <button onClick={() => setView('manage_subscription')} className="manage-subscription-button">Manage Subscription</button>
                    <button onClick={() => openFormEditor()} disabled={!canCreateForm} className={`create-button ${roleClass}`} title={!canCreateForm ? 'Entry limit reached' : 'Create new audit form'}>
                        <PlusIcon className="icon" /> Create Form
                    </button>
                </div>
            </div>

            <div className="table-header">
                <input 
                    type="text"
                    placeholder="Search by location, admin code, student..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="table-search-input firm"
                />
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Location</th>
                            <th>Date</th>
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
                                <td>{form.studentSubmission?.studentName || 'N/A'}</td>
                                <td style={{textAlign: 'right'}}>
                                    <button onClick={() => onNavigate('form_details', { formId: form.id })} className="table-action-link view">View</button>
                                    <button onClick={() => openFormEditor(form)} className="table-action-link edit" disabled={!!form.studentSubmission}>Edit</button>
                                    <button onClick={() => openDeleteModal(form)} className="table-action-link delete">Delete</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="no-data-cell">No forms found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
            <div>
                <p>Are you sure you want to delete the form for audit at <strong>{formToDelete?.location}</strong>?</p>
                <p>This action cannot be undone.</p>
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
