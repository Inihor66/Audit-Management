import React, { useState, useEffect } from 'react';
import { User, FormData } from '../../types';
import * as storage from '../../services/storageService';

interface AuditFormProps {
  user: User;
  onFormSaved: () => void;
  onCancel: () => void;
  existingForm: FormData | null;
}

const AuditForm = ({ user, onFormSaved, onCancel, existingForm }: AuditFormProps) => {
  const [formData, setFormData] = useState({
    firmName: user.name,
    location: user.location || '',
    expectedDate: '',
    adminCode: '',
    firmFeesRange: '',
    paymentTerm: '30_days' as '15_days' | '30_days' | '45_days' | 'advance',
    paymentReminder: false,
  });

  const isEditing = !!existingForm;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        firmName: existingForm.firmName,
        location: existingForm.location,
        expectedDate: new Date(existingForm.expectedDate).toISOString().split('T')[0],
        adminCode: existingForm.adminCode.join(', '),
        firmFeesRange: existingForm.firmFeesRange,
        paymentTerm: existingForm.paymentTerm,
        paymentReminder: existingForm.paymentReminder,
      });
    }
  }, [existingForm, isEditing]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    if (isCheckbox) {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const adminCodes = formData.adminCode.split(',').map(code => code.trim()).filter(code => code);
    if (adminCodes.length === 0) {
        alert('Please enter at least one valid Admin Code.');
        return;
    }

    const formPayload = {
        ...formData,
        adminCode: adminCodes,
    };

    if (isEditing) {
        const updatedForm = { 
            ...existingForm,
            ...formPayload,
            expectedDate: new Date(formData.expectedDate).toISOString()
        };
        // Make sure we map firmFeesRange into the stored object shape
        (updatedForm as any).firmFeesRange = (formPayload as any).firmFeesRange;
        storage.updateForm(updatedForm as FormData);
        alert('Form updated successfully!');
    } else {
        const canCreateForm = user.subscription.allowedEntries === 'infinity' || user.subscription.entriesUsed < user.subscription.allowedEntries;
        if (!canCreateForm) {
            alert('Entry limit reached. Cannot create more forms.');
            return;
        }

        storage.addForm({
            // map firm-entered fees to firmFeesRange; adminFeesRange remains null until admin edits
            ...formPayload,
            firmFeesRange: (formPayload as any).firmFeesRange,
            adminFeesRange: null,
            createdByUserId: user.id,
            isApproved: false,
            finalFees: null,
            studentSubmission: null,
            deleted: false,
            deletedCounted: false,
        });
        
        const updatedUser = { ...user };
        if(updatedUser.subscription.allowedEntries !== 'infinity') {
            updatedUser.subscription.entriesUsed += 1;
        }
        storage.updateUser(updatedUser);
        alert('Form submitted successfully! Waiting for admin approval.');
    }
    onFormSaved();
  };

  return (
    <div className="container" style={{maxWidth: '48rem', paddingTop: '2rem'}}>
      <div className="card">
        <h2 className="card-title">{isEditing ? 'Edit' : 'Create'} Audit Form</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
                <label htmlFor="firmName">Firm Name</label>
                <input type="text" name="firmName" id="firmName" value={formData.firmName} onChange={handleInputChange} required className="form-input" />
            </div>
            <div className="form-group">
                <label htmlFor="location">Audit Location</label>
                <input type="text" name="location" id="location" value={formData.location} onChange={handleInputChange} required className="form-input" />
            </div>
            <div className="form-group">
                <label htmlFor="expectedDate">Expected Date</label>
                <input type="date" name="expectedDate" id="expectedDate" value={formData.expectedDate} onChange={handleInputChange} required className="form-input" />
            </div>
            <div className="form-group">
                <label htmlFor="adminCode">Admin Code(s)</label>
                <input type="text" name="adminCode" id="adminCode" value={formData.adminCode} onChange={handleInputChange} required className="form-input" placeholder="Enter one or more comma-separated codes" />
            </div>
            <div className="form-group">
                <label htmlFor="feesRange">Fees Range</label>
                <input type="text" name="firmFeesRange" id="feesRange" placeholder="e.g., 5000-7000" value={formData.firmFeesRange} onChange={handleInputChange} required className="form-input" />
            </div>
            <div className="form-group">
                <label htmlFor="paymentTerm">Payment Term</label>
                <select name="paymentTerm" id="paymentTerm" value={formData.paymentTerm} onChange={handleInputChange} className="form-select">
                <option value="15_days">15 Days</option>
                <option value="30_days">30 Days</option>
                <option value="45_days">45 Days</option>
                <option value="advance">Advance</option>
                </select>
            </div>
            <div className="form-group-checkbox">
                <input id="paymentReminder" name="paymentReminder" type="checkbox" checked={formData.paymentReminder} onChange={handleInputChange} />
                <label htmlFor="paymentReminder">Enable Payment Reminder</label>
            </div>
          </div>
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-firm">{isEditing ? 'Save Changes' : 'Submit Form'}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AuditForm;