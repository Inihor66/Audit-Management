
import { useState, useEffect, useMemo } from 'react';
import { User, FormData, Role } from '../../types';
import * as storage from '../../services/storageService';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Modal } from '../../components/Modal';

// Fixed imports to ../../

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  refreshUser: () => void;
  onNavigate: (page: string, options?: { role?: Role; formId?: string; }) => void;
}

const StudentDashboard = ({ user, onLogout, onNavigate }: StudentDashboardProps) => {
    const [view, setView] = useState<'available' | 'reports'>('available');
    const [forms, setForms] = useState<FormData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [formToDelete, setFormToDelete] = useState<FormData | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const fetchForms = () => {
        const allForms = storage.getForms();
        setForms(allForms.filter(f => !f.deleted).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    useEffect(() => {
        fetchForms();
    }, []);

    const availableWork = useMemo(() => {
        const filtered = forms.filter(f => f.isApproved && !f.studentSubmission);
        if (!searchTerm) return filtered;
        return filtered.filter(form => 
            form.firmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            form.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            form.adminCode.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [forms, searchTerm]);
    
    const myReports = useMemo(() => {
        const filtered = forms.filter(f => f.studentSubmission?.studentId === user.id);
        if (!searchTerm) return filtered;
        return filtered.filter(form => 
            form.firmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            form.location.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [forms, searchTerm]);
    
    const openDeleteModal = (form: FormData) => {
        setFormToDelete(form);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteSubmission = () => {
        if (formToDelete) {
            const updatedForm = { ...formToDelete, studentSubmission: null };
            storage.updateForm(updatedForm);
            fetchForms();
            alert('Submission deleted successfully.');
            setIsDeleteModalOpen(false);
            setFormToDelete(null);
        }
    };

    const renderTable = (data: FormData[]) => (
        <div className="table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Firm Name</th>
                        <th>Location</th>
                        <th>Expected Date</th>
                        <th>Payment</th>
                        <th style={{textAlign: 'right'}}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? data.map(form => {
                        const canDelete = view === 'reports' && new Date(form.expectedDate) > new Date();
                        return (
                        <tr key={form.id}>
                            <td style={{fontWeight: 500}}>{form.firmName}</td>
                            <td>{form.location}</td>
                            <td>{new Date(form.expectedDate).toLocaleDateString()}</td>
                            <td>{form.feesRange}</td>
                            <td style={{textAlign: 'right'}}>
                                <button onClick={() => onNavigate('form_details', { formId: form.id })} className="table-action-link student">
                                    {view === 'available' ? 'Apply' : 'View'}
                                </button>
                                {view === 'reports' && (
                                    <button
                                        onClick={() => openDeleteModal(form)}
                                        disabled={!canDelete}
                                        className="table-action-link delete"
                                        title={canDelete ? "Delete submission" : "Cannot delete submission for past work"}
                                    >
                                        Delete
                                    </button>
                                )}
                            </td>
                        </tr>
                    )}) : (
                        <tr>
                            <td colSpan={5} className="no-data-cell">
                                {view === 'available' ? 'No available work at the moment.' : 'You have not submitted any reports.'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <DashboardLayout user={user} onLogout={onLogout}>
            <div className="card">
                <div className="tabs-container">
                    <nav className="tabs-nav" aria-label="Tabs">
                        <button onClick={() => setView('available')} className={`tab-button ${view === 'available' ? 'active' : ''}`}>
                            Available Work
                        </button>
                        <button onClick={() => setView('reports')} className={`tab-button ${view === 'reports' ? 'active' : ''}`}>
                            My Reports
                        </button>
                    </nav>
                </div>

                <div className="tab-content">
                  <div className="table-header">
                      <h3 className="table-title">{view === 'available' ? 'Available Work' : 'My Reports'}</h3>
                      <input 
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="table-search-input student"
                      />
                  </div>
                  {view === 'available' ? renderTable(availableWork) : renderTable(myReports)}
                </div>
            </div>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
                <div>
                    <p>Are you sure you want to delete your submission for the audit at <strong>{formToDelete?.location}</strong>?</p>
                    <p>This will make the work available to other students again.</p>
                    <div className="form-actions" style={{marginTop: '1.5rem'}}>
                        <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="form-button cancel">Cancel</button>
                        <button type="button" onClick={handleDeleteSubmission} className="form-button delete">Delete Submission</button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default StudentDashboard;

