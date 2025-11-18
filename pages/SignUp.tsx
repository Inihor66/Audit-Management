import React, { useState } from 'react';
import { Role, User } from '../types';
import * as storage from '../services/storageService';
import { ROLE_CONFIG } from '../constants';

interface SignUpProps {
  onSignUp: (user: User) => void;
  onNavigate: (page: string, role?: Role) => void;
  role: Role;
}

const SignUp = ({ onSignUp, onNavigate, role: initialRole }: SignUpProps) => {
  const [role, setRole] = useState<Role>(initialRole);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    aadhar: '',
    adminCode: '',
  });
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as Role;
    setRole(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const newUserPayload: any = {
        role,
        name: formData.name,
        email: formData.email,
        passwordHash: formData.password,
        ...(role !== Role.STUDENT && { location: formData.location }),
        ...(role === Role.STUDENT && { phone: formData.phone, aadhar: formData.aadhar }),
        ...(role === Role.ADMIN && { adminCode: formData.adminCode }),
      };

      const newUser = storage.addUser(newUserPayload);

      // For FIRM/ADMIN, redirect to verify page
      if (role === Role.FIRM || role === Role.ADMIN) {
        storage.generateEmailVerificationCode(newUser.id);
        sessionStorage.setItem('pendingVerificationUserId', newUser.id);
        sessionStorage.setItem('pendingVerificationRole', role);
        onNavigate('verify');
        return;
      }

      onSignUp(newUser);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    }
  };

  const config = ROLE_CONFIG[role] || { name: 'User' };

  return (
    <div className="page-center">
      <form onSubmit={handleSubmit} className="auth-form-card">
        <h2>Create your account</h2>

        <label>I am a...</label>
        <select value={role} onChange={handleRoleChange} className="form-select">
          <option value={Role.FIRM}>Firm</option>
          <option value={Role.STUDENT}>Student</option>
          <option value={Role.ADMIN}>Admin</option>
        </select>

        <label>{role === Role.FIRM ? 'Firm Name' : 'Full Name'}</label>
        <input name="name" type="text" required onChange={handleInputChange} className="form-input" />

        {(role === Role.FIRM || role === Role.ADMIN) && (
          <input name="location" placeholder="Location" type="text" required onChange={handleInputChange} className="form-input" />
        )}

        {role === Role.ADMIN && (
          <input name="adminCode" placeholder="Admin Code" type="text" required onChange={handleInputChange} className="form-input" />
        )}

        {role === Role.STUDENT && (
          <>
            <input name="phone" placeholder="Phone" type="tel" required onChange={handleInputChange} className="form-input" />
            <input name="aadhar" placeholder="Aadhar" type="text" required onChange={handleInputChange} className="form-input" />
          </>
        )}

        <input name="email" placeholder="Email" type="email" required onChange={handleInputChange} className="form-input" />
        <input name="password" placeholder="Password" type="password" required onChange={handleInputChange} className="form-input" />
        <input name="confirmPassword" placeholder="Confirm Password" type="password" required onChange={handleInputChange} className="form-input" />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className={`btn ${role === Role.FIRM ? 'btn-firm' : role === Role.STUDENT ? 'btn-student' : 'btn-admin'}`}>
          Sign Up as {config.name}
        </button>

        <button type="button" onClick={() => onNavigate('welcome')} className="btn btn-secondary">
          Back to role selection
        </button>
      </form>
    </div>
  );
};

export default SignUp;
