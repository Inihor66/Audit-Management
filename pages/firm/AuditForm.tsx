
import React, { useState } from 'react';
import { FormData, User } from '../../types';
import * as storage from '../../services/storageService';

interface AuditFormProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: FormData;
}

const AuditForm = ({ user, onSuccess, onCancel, initialData }: AuditFormProps) => {
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState({
    firmName: initialData?.firmName || user.name,
    location: initialData?.location || user.location || '',
    expectedDate: initialData?.expectedDate ? initialData.expectedDate.split('T')[0] : '',
    adminCode: initialData?.adminCode || '',
    feesRange: initialData?.feesRange || '',
    paymentTerm: initialData?.paymentTerm || '30_days',
    paymentReminder: initialData?.paymentReminder || false,
    preEditTerms: initialData?.preEditTerms || '',
  });
  
  const roleClass = user.role.toLowerCase();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode) {
      // Logic for updating an existing form
      const updatedForm: FormData = { 
        ...initialData!, 
        ...formData,
        expectedDate: new Date(formData.expectedDate).toISOString()
      };
      storage.updateForm(updatedForm);
      alert('Form updated successfully!');
    } else {
      // Logic for creating a new form
      const canCreateForm = user.subscription.allowedEntries === 'infinity' || user.subscription.entriesUsed < user.subscription.allowedEntries;
      if (!canCreateForm) {
        alert('Entry limit reached. Please upgrade your subscription.');
        return;
      }

      // 1. DEDUCT ENTRY IMMEDIATELY (Update User)
      if (user.subscription.allowedEntries !== 'infinity') {
          const updatedUser = { ...user };
          updatedUser.subscription.entriesUsed += 1;
          storage.updateUser(updatedUser);
      }

      // 2. Add form with entryCounted = true
      storage.addForm({
        ...formData,
        createdByUserId: user.id,
        isApproved: false,
        finalFees: null,
        studentSubmission: null,
        deleted: false,
        entryCounted: true, // Mark as counted immediately so deletion doesn't refund
      });

      alert('Form submitted successfully! Entry deducted from your limit.');
    }
    onSuccess();
  };

  return (
    <div className="form-page-container">
      <h2 className="form-page-title">{isEditMode ? 'Edit Audit Form' : 'Create Audit Form'}</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="firmName" className="form-label">Firm Name</label>
            <input type="text" name="firmName" id="firmName" value={formData.firmName} onChange={handleInputChange} required className="form-input" />
          </div>
          <div className="form-group">
            <label htmlFor="location" className="form-label">Audit Location</label>
            <input type="text" name="location" id="location" value={formData.location} onChange={handleInputChange} required className="form-input" />
          </div>
          <div className="form-group">
            <label htmlFor="expectedDate" className="form-label">Expected Date</label>
            <input type="date" name="expectedDate" id="expectedDate" value={formData.expectedDate} onChange={handleInputChange} required className="form-input" />
          </div>
          <div className="form-group">
            <label htmlFor="adminCode" className="form-label">Admin Code</label>
            <input type="text" name="adminCode" id="adminCode" value={formData.adminCode} onChange={handleInputChange} required className="form-input" />
          </div>
          <div className="form-group">
            <label htmlFor="feesRange" className="form-label">Fees Range</label>
            <input type="text" name="feesRange" id="feesRange" placeholder="e.g., 5000-7000" value={formData.feesRange} onChange={handleInputChange} required className="form-input" />
          </div>
          <div className="form-group">
            <label htmlFor="paymentTerm" className="form-label">Payment Term</label>
            <select name="paymentTerm" id="paymentTerm" value={formData.paymentTerm} onChange={handleInputChange} className="form-select">
              <option value="15_days">15 Days</option>
              <option value="30_days">30 Days</option>
              <option value="45_days">45 Days</option>
              <option value="advance">Advance</option>
            </select>
          </div>
           <div className="form-group form-group-full">
            <label htmlFor="preEditTerms" className="form-label">Terms & Conditions</label>
            <textarea 
                name="preEditTerms" 
                id="preEditTerms" 
                value={formData.preEditTerms} 
                onChange={handleInputChange} 
                required 
                className="form-textarea" 
                rows={5}
                placeholder="Enter detailed terms regarding travel allowance, accommodation, reporting requirements, etc."
            ></textarea>
          </div>
        </div>
        <div className="checkbox-group">
          <div className="checkbox-input-container">
            <input id="paymentReminder" name="paymentReminder" type="checkbox" checked={formData.paymentReminder} onChange={handleInputChange} className="checkbox-input" />
          </div>
          <div className="checkbox-text-container">
            <label htmlFor="paymentReminder" className="checkbox-label">Payment Reminder</label>
            <p className="checkbox-description">Enable to send payment reminders.</p>
          </div>
        </div>
        <div className="form-actions">
            <button type="button" onClick={onCancel} className="form-button cancel">Cancel</button>
            <button type="submit" className={`form-button submit ${roleClass}`}>{isEditMode ? 'Update Form' : 'Submit Form'}</button>
        </div>
      </form>
    </div>
  );
};

export default AuditForm;

