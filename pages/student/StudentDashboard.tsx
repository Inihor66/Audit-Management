import React, { useState, useEffect, useMemo } from 'react';
import { User, FormData } from '../../types';
import * as storage from '../../services/storageService';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Modal } from '../../components/Modal';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  refreshUser: () => void;
}

const ReportDetailPage = ({ form, user, onBack, onWithdraw }: { form: FormData; user: User; onBack: () => void; onWithdraw: () => void; }) => {
    return (
        <DashboardLayout user={user} onLogout={() => {}}>
            <div className="container" style={{maxWidth: '48rem'}}>
                 <button onClick={onBack} className="header-action-btn" style={{marginBottom: '1rem'}}>&larr; Back to Reports</button>
                 <div className="card">
                     <div className="page-header">
                        <h2 className="card-title">Report Details</h2>
                        <button onClick={onWithdraw} className="btn btn-danger" style={{width: 'auto'}}>Withdraw Application</button>
                     </div>

                     <div className="detail-section">
                        <h4 className="font-semibold text-base text-gray-800">Audit Information</h4>
                        <p><strong>Firm Name:</strong> {form.firmName}</p>
                        <p><strong>Location:</strong> {form.location}</p>
                        <p><strong>Expected Date:</strong> {new Date(form.expectedDate).toLocaleDateString()}</p>
                        {/* FIX: Consistently handle adminCode as an array of strings to avoid potential runtime rendering issues. */}
                        <p><strong>Admin Code:</strong> {form.adminCode.join(', ')}</p>
                        <p><strong>Fees:</strong> {form.adminFeesRange ?? form.firmFeesRange}</p>
                     </div>

                    {form.studentSubmission && (
                        <div className="detail-section submission-section" style={{marginTop: '1.5rem'}}>
                            <h4 className="font-semibold text-base text-gray-800">Your Submission</h4>
                            <p><strong>Name:</strong> {form.studentSubmission.studentName}</p>
                            <p><strong>Email:</strong> {form.studentSubmission.studentEmail}</p>
                            <p><strong>Phone:</strong> {form.studentSubmission.studentPhone || 'N/A'}</p>
                            <p><strong>Aadhar:</strong> {form.studentSubmission.studentAadhar || 'N/A'}</p>
                            <p><strong>Remarks:</strong> {form.studentSubmission.remarks || 'No remarks provided.'}</p>
                            <p className="text-xs text-gray-500 mt-1">Submitted on: {new Date(form.studentSubmission.submittedAt).toLocaleString()}</p>
                        </div>
                    )}
                 </div>
            </div>
        </DashboardLayout>
    );
};


const StudentDashboard = ({ user, onLogout }: StudentDashboardProps) => {
    const [view, setView] = useState<'available' | 'reports' | 'report_detail'>('available');
    const [forms, setForms] = useState<FormData[]>([]);
    const [selectedForm, setSelectedForm] = useState<FormData | null>(null);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [applicationData, setApplicationData] = useState({
        studentName: '',
        studentEmail: '',
        studentPhone: '',
        studentAadhar: '',
        remarks: '',
    });

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
            // FIX: Correctly search within the adminCode array. The previous code had a redundant check that caused a TypeScript error because adminCode is always an array.
            form.adminCode.join(', ').toLowerCase().includes(searchTerm.toLowerCase())
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

    const openApplyModal = (form: FormData) => {
        setSelectedForm(form);
        setApplicationData({
            studentName: user.name,
            studentEmail: user.email,
            studentPhone: user.phone || '',
            studentAadhar: user.aadhar || '',
            remarks: '',
        });
        setIsApplyModalOpen(true);
    };

    const handleFormSubmit = () => {
        if (!selectedForm) return;

        const submission = {
            studentId: user.id,
            studentName: applicationData.studentName,
            studentEmail: applicationData.studentEmail,
            studentPhone: applicationData.studentPhone,
            studentAadhar: applicationData.studentAadhar,
            remarks: applicationData.remarks,
            submittedAt: new Date().toISOString(),
        };

        const updatedForm = { ...selectedForm, studentSubmission: submission };
        storage.updateForm(updatedForm);
        
        fetchForms();
        setIsApplyModalOpen(false);
        setSelectedForm(null);
        alert('Form submitted successfully!');
    };
    
    const handleApplicationDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setApplicationData(prev => ({ ...prev, [name]: value }));
    };

    const openWithdrawModal = (form: FormData) => {
        setSelectedForm(form);
        setIsWithdrawModalOpen(true);
    };

    const handleWithdraw = () => {
        if (!selectedForm) return;

        const formDate = new Date(selectedForm.expectedDate);
        const today = new Date();
        today.setHours(0,0,0,0); // Compare dates only

        if (formDate >= today) {
            const updatedForm = { ...selectedForm, studentSubmission: null };
            storage.updateForm(updatedForm);
            fetchForms();
            alert('Your application has been withdrawn. The form is now available for other students.');
        } else {
            alert('Cannot withdraw from a past-dated audit.');
        }
        
        setIsWithdrawModalOpen(false);
        setSelectedForm(null);
        setView('reports');
    };
    
    const openReportDetail = (form: FormData) => {
        setSelectedForm(form);
        setView('report_detail');
    }

    const getStudentVisibleFees = (form: FormData) => {
        // Students should see the admin-edited (post-edit) fees if present; otherwise show firm-entered fees
        return form.adminFeesRange ?? form.firmFeesRange;
    };

    const renderTable = (data: FormData[]) => (
        <div className="table-container">
            <table className="table">
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
                    {data.length > 0 ? data.map(form => (
                        <tr key={form.id}>
                            <td className="font-semibold">{form.firmName}</td>
                            <td>{form.location}</td>
                            <td>{new Date(form.expectedDate).toLocaleDateString()}</td>
                            <td>{getStudentVisibleFees(form)}</td>
                            <td style={{textAlign: 'right'}}>
                                {view === 'available' ? (
                                    <button onClick={() => openApplyModal(form)} className="table-action-link" style={{color: 'var(--color-student)'}}>Apply</button>
                                ) : (
                                    <>
                                        <button onClick={() => openReportDetail(form)} className="table-action-link view">View</button>
                                        <button onClick={() => openWithdrawModal(form)} className="table-action-link delete">Delete</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} className="text-center" style={{padding: '2.5rem'}}>
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
                <div className="tabs-nav">
                    <button onClick={() => setView('available')} className={`tab-btn ${view === 'available' ? 'active' : ''}`}>
                        Available Work
                    </button>
                    <button onClick={() => setView('reports')} className={`tab-btn ${view === 'reports' ? 'active' : ''}`}>
                        My Reports
                    </button>
                </div>

                <div className="mt-6">
                  <div className="page-header">
                      <h3 className="card-title capitalize">{view === 'available' ? 'Available Work' : 'My Reports'}</h3>
                      <input 
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input"
                        style={{maxWidth: '320px'}}
                      />
                  </div>
                  {view === 'available' ? renderTable(availableWork) : renderTable(myReports)}
                </div>
            </div>

            {/* Apply Modal */}
            <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Work Details & Apply">
                {selectedForm && (
                    <div className="space-y-4">
                        <div className="detail-section">
                            <h4 className="font-semibold text-base text-gray-800">Audit Information</h4>
                            <p><strong>Firm Name:</strong> {selectedForm.firmName}</p>
                            <p><strong>Location:</strong> {selectedForm.location}</p>
                            <p><strong>Expected Date:</strong> {new Date(selectedForm.expectedDate).toLocaleDateString()}</p>
                            {/* FIX: Consistently handle adminCode as an array of strings to avoid potential runtime rendering issues. */}
                            <p><strong>Admin Code:</strong> {selectedForm.adminCode.join(', ')}</p>
                            <p><strong>Fees:</strong> {getStudentVisibleFees(selectedForm)}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-base text-gray-800 mb-2">Submit Your Application</h4>
                            <div className="form-group">
                                <label htmlFor="studentName">Your Name</label>
                                <input type="text" id="studentName" name="studentName" value={applicationData.studentName} onChange={handleApplicationDataChange} className="form-input" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="studentEmail">Email</label>
                                <input type="email" id="studentEmail" name="studentEmail" value={applicationData.studentEmail} onChange={handleApplicationDataChange} className="form-input" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="studentPhone">Phone</label>
                                <input type="tel" id="studentPhone" name="studentPhone" value={applicationData.studentPhone} onChange={handleApplicationDataChange} className="form-input" required />
                            </div>
                             <div className="form-group">
                                <label htmlFor="studentAadhar">Aadhar Number</label>
                                <input type="text" id="studentAadhar" name="studentAadhar" value={applicationData.studentAadhar} onChange={handleApplicationDataChange} className="form-input" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="remarks">Remarks (Optional)</label>
                                <textarea
                                    id="remarks"
                                    name="remarks"
                                    rows={3}
                                    value={applicationData.remarks}
                                    onChange={handleApplicationDataChange}
                                    className="form-textarea"
                                    placeholder="Add any relevant remarks here..."
                                ></textarea>
                            </div>
                            <div style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'}}>
                                <button onClick={() => setIsApplyModalOpen(false)} className="btn btn-secondary" style={{width: 'auto'}}>Cancel</button>
                                <button onClick={handleFormSubmit} className="btn btn-student" style={{width: 'auto'}}>Submit</button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
            
            {/* Withdraw Confirmation Modal */}
            <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} title="Confirm Withdrawal">
                <p>Are you sure you want to withdraw your application? If the audit date is in the future, this job will become available to other students again.</p>
                <div style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'}}>
                    <button onClick={() => setIsWithdrawModalOpen(false)} className="btn btn-secondary" style={{width: 'auto'}}>Cancel</button>
                    <button onClick={handleWithdraw} className="btn btn-danger" style={{width: 'auto'}}>Withdraw</button>
                </div>
            </Modal>

             <style>{`
                .tabs-nav { border-bottom: 1px solid var(--color-border); display: flex; gap: 2rem; }
                .tab-btn { background: none; border: none; padding: 1rem 0.25rem; font-weight: 500; font-size: 0.875rem; color: var(--color-text-light); cursor: pointer; border-bottom: 2px solid transparent; }
                .tab-btn.active { color: var(--color-student); border-color: var(--color-student); }
                .detail-section { font-size: 0.875rem; padding: 1rem; background-color: var(--color-bg-light); border-radius: 0.375rem; border: 1px solid var(--color-border); }
                .detail-section p { margin: 0.25rem 0; }
                .submission-section { background-color: #dbeafe; border-color: #93c5fd; }
             `}</style>
        </DashboardLayout>
    );
};

export default StudentDashboard;