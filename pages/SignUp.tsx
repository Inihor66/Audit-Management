import React, { useState } from 'react';
import { Role } from '../types';
import * as storage from '../services/storageService';
import { ROLE_CONFIG } from '../constants';

interface SignUpProps {
  onSignUp: (user: any) => void;
  onNavigate: (page: string) => void;
  role?: Role;
}

const SignUp = ({ onSignUp, onNavigate, role: initialRole }: SignUpProps) => {
  // Default role set karo agar initialRole undefined ho
  const [role, setRole] = useState<Role>(initialRole || Role.FIRM);

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

  // Input change handle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Role change handle
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value.toUpperCase();
    if (value === 'FIRM') setRole(Role.FIRM);
    else if (value === 'STUDENT') setRole(Role.STUDENT);
    else if (value === 'ADMIN') setRole(Role.ADMIN);
  };

  // Submit handle
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

      if (role === Role.FIRM || role === Role.ADMIN) {
        storage.generateEmailVerificationCode(newUser.id);
        sessionStorage.setItem('pendingVerificationUserId', newUser.id);
        sessionStorage.setItem('pendingVerificationRole', role.toString());
        onNavigate('verify');
        return;
      }

      onSignUp(newUser);
    } catch (err: any) {
      setError(err?.message || 'An unknown error occurred.');
    }
  };

  // Role config for button text/color
  const config = ROLE_CONFIG[role] || { name: 'User', hex: '#000000' };
  const getButtonClass = () => {
    if (role === Role.FIRM) return 'btn-firm';
    if (role === Role.STUDENT) return 'btn-student';
    if (role === Role.ADMIN) return 'btn-admin';
    return 'btn';
  };

  return (
    <div className="page-center">
      <form onSubmit={handleSubmit} className="auth-form-card">
        <h2>Create your account</h2>

        <div className="form-group">
          <label>I am a...</label>
          <select value={role} onChange={handleRoleChange} className="form-select">
            <option value="FIRM">Firm</option>
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="form-group">
          <label>{role === Role.FIRM ? 'Firm Name' : 'Full Name'}</label>
          <input name="name" type="text" required className="form-input" onChange={handleInputChange} />
        </div>

        {(role === Role.FIRM || role === Role.ADMIN) && (
          <div className="form-group">
            <label>Location</label>
            <input name="location" type="text" required className="form-input" onChange={handleInputChange} />
          </div>
        )}

        {role === Role.ADMIN && (
          <div className="form-group">
            <label>Admin Code</label>
            <input name="adminCode" type="text" required className="form-input" onChange={handleInputChange} />
          </div>
        )}

        {role === Role.STUDENT && (
          <>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" type="tel" required className="form-input" onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Aadhar</label>
              <input name="aadhar" type="text" required className="form-input" onChange={handleInputChange} />
            </div>
          </>
        )}

        <div className="form-group">
          <label>Email</label>
          <input name="email" type="email" required className="form-input" onChange={handleInputChange} />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input name="password" type="password" required className="form-input" onChange={handleInputChange} />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input name="confirmPassword" type="password" required className="form-input" onChange={handleInputChange} />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button type="submit" className={`btn ${getButtonClass()}`}>
            Sign Up as {config.name}
          </button>
          <button type="button" onClick={() => onNavigate('welcome')} className="btn btn-primary">
            Back to role selection
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignUp;
