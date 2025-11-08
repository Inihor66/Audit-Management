import React, { useState, useEffect, useMemo } from 'react';
import { User, FormData } from '../../types';
import * as storage from '../../services/storageService';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Modal } from '../../components/Modal';
import AuditForm from './AuditForm';
import ManageSubscription from './ManageSubscription';
import ProfilePage from './ProfilePage';
import { PlusIcon } from '../../components/icons/PlusIcon';

interface FirmDashboardProps {
  user: User;
  onLogout: () => void;
  refreshUser: () => void;
}

const FirmDashboard = ({ user, onLogout, refreshUser }: FirmDashboardProps) => {
  const [view, setView] = useState('dashboard'); // dashboard, create_form, edit_form, manage_subscription, profile
  const [forms, setForms] = useState<FormData[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
  
  const handleFormSaved = () => {
    fetchForms();
    refreshUser();
    setView('dashboard');
    setSelectedForm(null);
  };

  const openDetailModal = (form: FormData) => {
    setSelectedForm(form);
    setIsDetailModalOpen(true);
  };
  
  const openDeleteModal = (form: FormData) => {
    setSelectedForm(form);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteForm = () => {
    if (selectedForm) {
      const updatedForm = { ...selectedForm, deleted: true };
      const userToUpdate = { ...user };
      if (!selectedForm.deletedCounted) {
          updatedForm.deletedCounted = true;
          if (userToUpdate.subscription.allowedEntries !== 'infinity') {
            userToUpdate.subscription.entriesUsed += 1;
          }
      }
      
      storage.updateForm(updatedForm);
      storage.updateUser(userToUpdate);
      
      fetchForms();
      refreshUser();
      setIsDeleteModalOpen(false);
      setSelectedForm(null);
    }
  };

  const filteredForms = useMemo(() => {
    if (!searchTerm) return forms;
    const lowercasedTerm = searchTerm.toLowerCase();
    return forms.filter(form => 
        form.location.toLowerCase().includes(lowercasedTerm) ||
        form.firmName.toLowerCase().includes(lowercasedTerm) ||
        (form.firmFeesRange || '').toLowerCase().includes(lowercasedTerm) ||
        (form.adminFeesRange || '').toLowerCase().includes(lowercasedTerm) ||
        form.adminCode.join(', ').toLowerCase().includes(lowercasedTerm) ||
        new Date(form.expectedDate).toLocaleDateString().includes(searchTerm)
    );
  }, [forms, searchTerm]);

  // --- View Rendering Logic ---
  
  if (view === 'profile') {
    return <ProfilePage user={user} onBack={() => setView('dashboard')} onNavigate={setView} />
  }

  if (view === 'manage_subscription') {
    return <ManageSubscription user={user} refreshUser={refreshUser} onBack={() => setView('profile')} />;
  }
  
  if (view === 'create_form' || view === 'edit_form') {
    return <AuditForm user={user} onFormSaved={handleFormSaved} onCancel={() => setView('dashboard')} existingForm={selectedForm} />;
  }

  return (
    <DashboardLayout user={user} onLogout={onLogout} onNavigateToProfile={() => setView('profile')}>
      <div className="card">
        <div className="page-header">
            <h2 className="card-title">Welcome back, {user.name}!</h2>
            <button
                onClick={() => canCreateForm ? setView('create_form') : alert('Entry limit reached. Please purchase a subscription.')}
                disabled={!canCreateForm}
                className="btn btn-firm btn-icon"
            >
                <PlusIcon />
                <span>{canCreateForm ? 'Create New Form' : 'Limit Reached'}</span>
            </button>
        </div>
        <p className="text-gray-600 mt-1">Here's an overview of your audit forms.</p>
      </div>

      <div className="card" style={{marginTop: '1.5rem'}}>
        <div className="page-header">
            {filteredForms.length > 0 && <h3 className="card-title">My Audit Forms</h3>}
            <input 
              type="text"
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{maxWidth: '320px'}}
            />
        </div>
        <div className="table-container">
          <table className="table">
              <thead>
                  <tr>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Payment</th>
                      <th>Reminder</th>
                      <th>Status</th>
                      <th style={{textAlign: 'right'}}>Actions</th>
                  </tr>
              </thead>
              <tbody>
                  {filteredForms.length > 0 ? filteredForms.map(form => (
                      <tr key={form.id}>
                          <td>{new Date(form.expectedDate).toLocaleDateString()}</td>
                          <td>{form.location}</td>
                          <td className="capitalize">{form.paymentTerm.replace('_', ' ')}</td>
                          <td>
                              <span className={`status-badge ${form.paymentReminder ? 'status-badge-on' : 'status-badge-off'}`}>
                                  {form.paymentReminder ? 'On' : 'Off'}
                              </span>
                          </td>
                          <td>
                             <span className={`status-badge ${form.isApproved ? 'status-badge-approved' : 'status-badge-pending'}`}>
                                 {form.isApproved ? 'Approved' : 'Pending'}
                             </span>
                          </td>
                          <td style={{textAlign: 'right'}}>
                              <button onClick={() => openDetailModal(form)} className="table-action-link view">View</button>
                              <button onClick={() => openDeleteModal(form)} className="table-action-link delete">Delete</button>
                          </td>
                      </tr>
                  )) : (
                      <tr>
                          <td colSpan={6} className="text-center" style={{padding: '2.5rem'}}>No forms found.</td>
                      </tr>
                  )}
              </tbody>
          </table>
        </div>
      </div>
      
      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Form Details">
          {selectedForm && (
              <div style={{fontSize: '0.875rem', lineHeight: '1.5'}}>
                  <p><strong>Firm Name:</strong> {selectedForm.firmName}</p>
                  <p><strong>Location:</strong> {selectedForm.location}</p>
                  <p><strong>Expected Date:</strong> {new Date(selectedForm.expectedDate).toLocaleDateString()}</p>
                  <p><strong>Admin Code(s):</strong> {selectedForm.adminCode.join(', ')}</p>
                  <p><strong>Fees (Your entry):</strong> {selectedForm.firmFeesRange}</p>
                  <p><strong>Admin Edited Fees:</strong> {selectedForm.adminFeesRange ?? 'Not set'}</p>
                  <p><strong>Payment Term:</strong> <span className="capitalize">{selectedForm.paymentTerm.replace('_', ' ')}</span></p>
                  <p><strong>Reminder:</strong> {selectedForm.paymentReminder ? 'Yes' : 'No'}</p>
                  <p><strong>Status:</strong> {selectedForm.isApproved ? 'Approved by Admin' : 'Pending Approval'}</p>
                  {selectedForm.studentSubmission && <div style={{paddingTop: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--color-border)'}}>
                      <h4 className="font-semibold">Student Submission</h4>
                      <p><strong>Student:</strong> {selectedForm.studentSubmission.studentName}</p>
                      <p><strong>Remarks:</strong> {selectedForm.studentSubmission.remarks}</p>
                      <p><strong>Submitted At:</strong> {new Date(selectedForm.studentSubmission.submittedAt).toLocaleString()}</p>
                  </div>}
              </div>
          )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
          <p>Are you sure you want to delete this form? This action cannot be undone. This will count towards your free entry limit.</p>
          <div style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'}}>
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary" style={{width: 'auto'}}>Cancel</button>
              <button onClick={handleDeleteForm} className="btn btn-danger" style={{width: 'auto'}}>Delete</button>
          </div>
      </Modal>
    </DashboardLayout>
  );
};
export default FirmDashboard;