
import React, { useState, useEffect } from 'react';
import { User, FormData, Role } from '../types';
import * as storage from '../services/storageService';
import { DashboardLayout } from '../components/DashboardLayout';
import { ShareIcon } from '../components/icons/ShareIcon';

interface FormDetailsPageProps {
  formId: string;
  user: User;
  onBack: () => void;
  refreshUser: () => void;
  onLogout: () => void;
}

export default function FormDetailsPage({ formId, user, onBack, refreshUser, onLogout }: FormDetailsPageProps) {
    const [form, setForm] = useState<FormData | null>(null);
    const [loading, setLoading] = useState(true);
    // State for student submission form
    const [submissionData, setSubmissionData] = useState({ name: '', phone: '', aadhar: '', remarks: '' });
    // State for admin editable fields
    const [editableForm, setEditableForm] = useState<{ postEditFees?: string | null; postEditTerms?: string | null; }>({});

    useEffect(() => {
        const foundForm = storage.getFormById(formId);
        if (foundForm) {
            setForm(foundForm);
            if (user.role === Role.ADMIN) {
                setEditableForm({
                    postEditFees: foundForm.postEditFees,
                    postEditTerms: foundForm.postEditTerms,
                });
            }
             if (user.role === Role.STUDENT) {
                setSubmissionData({
                    name: user.name,
                    phone: user.phone || '',
                    aadhar: user.aadhar || '',
                    remarks: '',
                });
            }
        }
        setLoading(false);
    }, [formId, user.role, user.name, user.phone, user.aadhar]);

    const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditableForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAdminUpdate = () => {
        if (!form) return;
        const updatedForm = { ...form, ...editableForm };
        storage.updateForm(updatedForm as FormData);
        setForm(updatedForm as FormData);
        alert('Form updated successfully!');
    };

    const handleAdminApprove = () => {
        if (!form) return;

        const updatedForm = { ...form, ...editableForm, isApproved: true } as FormData;
        
        // Count entry on approval if not already counted
        if (!updatedForm.entryCounted) {
            const firmUser = storage.getUserById(form.createdByUserId);
            if (firmUser) {
                const updatedFirmUser = { ...firmUser };
                if (updatedFirmUser.subscription.allowedEntries !== 'infinity') {
                    updatedFirmUser.subscription.entriesUsed += 1;
                }
                updatedForm.entryCounted = true;
                storage.updateUser(updatedFirmUser);
                refreshUser(); // Refresh user data in App state
            }
        }
        
        storage.updateForm(updatedForm);
        setForm(updatedForm);
        alert('Form approved and saved!');
        onBack();
    };

    const handleStudentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSubmissionData(prev => ({ ...prev, [name]: value }));
    };

    const handleStudentSubmit = () => {
        if (!form) return;
        const submission = {
            studentId: user.id,
            studentName: submissionData.name,
            studentEmail: user.email,
            phone: submissionData.phone,
            aadhar: submissionData.aadhar,
            remarks: submissionData.remarks,
            submittedAt: new Date().toISOString(),
        };
        const updatedForm = { ...form, studentSubmission: submission };
        storage.updateForm(updatedForm);
        alert('Application submitted successfully!');
        onBack();
    };
    
    // Share Link Generator for Admin
    const copyShareLink = () => {
        if(!form) return;
        const link = `${window.location.origin}/?page=form_details&formId=${form.id}&role=STUDENT`;
        navigator.clipboard.writeText(link).then(() => {
            alert("Shareable link copied to clipboard!");
        });
    };


    const renderFirmView = () => (
        <>
            <div className="form-details-grid">
                <div className="form-detail-item"><strong>Firm Name:</strong> <span>{form!.firmName}</span></div>
                <div className="form-detail-item"><strong>Location:</strong> <span>{form!.location}</span></div>
                <div className="form-detail-item"><strong>Expected Date:</strong> <span>{new Date(form!.expectedDate).toLocaleDateString()}</span></div>
                <div className="form-detail-item"><strong>Admin Code:</strong> <span>{form!.adminCode}</span></div>
                <div className="form-detail-item"><strong>Fees Range:</strong> <span>{form!.feesRange}</span></div>
                <div className="form-detail-item"><strong>Payment Term:</strong> <span style={{textTransform: 'capitalize'}}>{form!.paymentTerm.replace('_', ' ')}</span></div>
                <div className="form-detail-item"><strong>Reminder:</strong> <span>{form!.paymentReminder ? 'Yes' : 'No'}</span></div>
                <div className="form-detail-item"><strong>Status:</strong> <span>{form!.isApproved ? 'Approved by Admin' : 'Pending Approval'}</span></div>
            </div>
            {form!.preEditTerms && (
                <div className="card-divider">
                    <h4>Terms & Conditions</h4>
                    <p className="terms-content">{form!.preEditTerms}</p>
                </div>
            )}
            {form!.studentSubmission && (
                <div className="card-divider">
                    <h4 style={{fontWeight: 600}}>Student Submission</h4>
                    <p><strong>Student:</strong> {form!.studentSubmission.studentName}</p>
                    {form!.studentSubmission.phone && <p><strong>Phone:</strong> {form!.studentSubmission.phone}</p>}
                    {form!.studentSubmission.aadhar && <p><strong>Aadhar:</strong> {form!.studentSubmission.aadhar}</p>}
                    <p><strong>Remarks:</strong> {form!.studentSubmission.remarks || 'N/A'}</p>
                    <p><strong>Submitted At:</strong> {new Date(form!.studentSubmission.submittedAt).toLocaleString()}</p>
                </div>
            )}
        </>
    );

    const renderStudentView = () => (
        <div>
            <div className="modal-info-box">
                <h4>Audit Information</h4>
                <p><strong>Firm Name:</strong> {form!.firmName}</p>
                <p><strong>Location:</strong> {form!.location}</p>
                <p><strong>Expected Date:</strong> {new Date(form!.expectedDate).toLocaleDateString()}</p>
                <p><strong>Admin Code:</strong> {form!.adminCode}</p>
                <p><strong>Fees:</strong> {form!.postEditFees || form!.feesRange}</p>
                {form!.postEditTerms && <p><strong>Terms:</strong> {form!.postEditTerms}</p>}
            </div>

            {form!.studentSubmission ? (
                <div className="modal-submitted-box card-divider" >
                    <h4>Your Submission</h4>
                    <p><strong>Name:</strong> {form!.studentSubmission.studentName}</p>
                    {form!.studentSubmission.phone && <p><strong>Phone:</strong> {form!.studentSubmission.phone}</p>}
                    {form!.studentSubmission.aadhar && <p><strong>Aadhar:</strong> {form!.studentSubmission.aadhar}</p>}
                    <p className="remarks"><strong>Remarks:</strong> {form!.studentSubmission.remarks || 'N/A'}</p>
                    <p className="date" style={{marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-500)'}}>Submitted on: {new Date(form!.studentSubmission.submittedAt).toLocaleString()}</p>
                </div>
            ) : (
                <div className="card-divider">
                    <h4 style={{fontWeight: 600, fontSize: '1.125rem', color: '#1f2937', marginBottom: '1rem'}}>Submit Your Application</h4>
                    <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleStudentSubmit(); }}>
                        <div className="form-group">
                            <label htmlFor="name" className="form-label">Full Name</label>
                            <input id="name" name="name" type="text" value={submissionData.name} onChange={handleStudentInputChange} required className="form-input" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone" className="form-label">Phone Number</label>
                            <input id="phone" name="phone" type="tel" value={submissionData.phone} onChange={handleStudentInputChange} required className="form-input" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="aadhar" className="form-label">Aadhar Number</label>
                            <input id="aadhar" name="aadhar" type="text" value={submissionData.aadhar} onChange={handleStudentInputChange} required className="form-input" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="remarks" className="form-label">Remarks (Optional)</label>
                            <textarea id="remarks" name="remarks" rows={4} value={submissionData.remarks} onChange={handleStudentInputChange} className="form-textarea" placeholder="Add any relevant remarks here..." />
                        </div>
                        <div className="form-actions">
                            <button type="button" onClick={onBack} className="form-button cancel">Cancel</button>
                            <button type="submit" className="form-button submit student">Submit</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );

    const renderAdminView = () => {
        const isFormLocked = !!form!.studentSubmission;
        return (
            <div className="auth-form" style={{gap: '1rem'}}>
                {form!.isApproved && !isFormLocked && (
                    <div className="form-group-full" style={{marginBottom: '1rem', background: '#ecfdf5', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #10b981'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span style={{color: '#065f46', fontWeight: 600}}>Shareable Student Link:</span>
                            <button onClick={copyShareLink} style={{background: 'white', border: '1px solid #10b981', color: '#059669', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <ShareIcon className="w-4 h-4"/> Copy Link
                            </button>
                        </div>
                        <p style={{fontSize: '0.8rem', color: '#047857', marginTop: '0.5rem'}}>Send this link to students to let them apply directly.</p>
                    </div>
                )}
                
                <div className="form-group-full"> <h4 className="form-section-title">Firm Details (Read-Only)</h4></div>
                <div className="form-grid">
                    <div className="form-group"><label className="form-label">Firm Name</label><input type="text" value={form!.firmName} className="form-input" disabled /></div>
                    <div className="form-group"><label className="form-label">Location</label><input type="text" value={form!.location} className="form-input" disabled /></div>
                    <div className="form-group"><label className="form-label">Pre-Edit Fees</label><input type="text" value={form!.feesRange} className="form-input" disabled /></div>
                    <div className="form-group"><label className="form-label">Date</label><input type="text" value={new Date(form!.expectedDate).toLocaleDateString()} className="form-input" disabled /></div>
                </div>
                <div className="form-group form-group-full"><label className="form-label">Pre-Edit Terms & Conditions</label><textarea value={form!.preEditTerms} className="form-textarea" rows={3} disabled></textarea></div>
                
                <div className="form-group-full"><h4 className="form-section-title">Admin Details (Editable)</h4></div>
                {isFormLocked && <div className="form-group-full"><p className="form-lock-message">This form is locked for editing because a student has already submitted their report.</p></div>}
                
                <div className="form-grid">
                  <div className="form-group form-group-full">
                      <label htmlFor="postEditFees" className="form-label">Post-Edit Fees</label>
                      <input type="text" id="postEditFees" name="postEditFees" value={editableForm.postEditFees || ''} onChange={handleAdminInputChange} className="form-input" disabled={isFormLocked} />
                  </div>
                  <div className="form-group form-group-full">
                      <label htmlFor="postEditTerms" className="form-label">Post-Edit Terms & Conditions (Optional)</label>
                      <textarea id="postEditTerms" name="postEditTerms" value={editableForm.postEditTerms || ''} onChange={handleAdminInputChange} className="form-textarea" rows={3} disabled={isFormLocked}></textarea>
                  </div>
                </div>

                {form!.studentSubmission && (
                    <>
                        <div className="form-group-full"><h4 className="form-section-title">Student Submission</h4></div>
                        <div className="form-grid">
                            <div className="form-group"><label className="form-label">Student Name</label><input type="text" value={form!.studentSubmission.studentName} className="form-input" disabled /></div>
                            <div className="form-group"><label className="form-label">Student Phone</label><input type="text" value={form!.studentSubmission.phone || 'N/A'} className="form-input" disabled /></div>
                        </div>
                        <div className="form-group form-group-full"><label className="form-label">Remarks</label><textarea value={form!.studentSubmission.remarks || 'N/A'} className="form-textarea" rows={3} disabled></textarea></div>
                    </>
                )}

                <div className="form-actions" style={{paddingTop: '1rem'}}>
                    {!isFormLocked && <button onClick={handleAdminUpdate} className="modal-button save">Save Changes</button>}
                    {!form!.isApproved && !isFormLocked && <button onClick={handleAdminApprove} className="modal-button approve">Approve & Save</button>}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) return <p>Loading form details...</p>;
        if (!form) return <p>Form not found.</p>;

        const roleToViewMap = {
            [Role.FIRM]: renderFirmView,
            [Role.STUDENT]: renderStudentView,
            [Role.ADMIN]: renderAdminView,
        };

        return (
            <div className="form-details-page">
                <button onClick={onBack} className="back-link">&larr; Back to Dashboard</button>
                <div className="form-details-header">
                    <h2 className="form-details-title">Form Details</h2>
                </div>
                {roleToViewMap[user.role]()}
            </div>
        );
    };

    return (
        <DashboardLayout user={user} onLogout={onLogout}>
            {renderContent()}
        </DashboardLayout>
    );
}

