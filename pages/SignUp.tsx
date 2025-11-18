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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'FIRM') setRole(Role.FIRM);
    else if (value === 'STUDENT') setRole(Role.STUDENT);
    else if (value === 'ADMIN') setRole(Role.ADMIN);
  };

  return (
    <div className="page-center">
      <form onSubmit={handleSubmit} className="signup-form-card">
        <h2>Create your account</h2>

        <label>I am a...</label>
        <select value={role} onChange={handleRoleChange}>
          <option value="FIRM">Firm</option>
          <option value="STUDENT">Student</option>
          <option value="ADMIN">Admin</option>
        </select>

        <label>{role === Role.FIRM ? 'Firm Name' : 'Full Name'}</label>
        <input name="name" type="text" required value={formData.name} onChange={handleInputChange} />

        {(role === Role.FIRM || role === Role.ADMIN) && (
          <input name="location" placeholder="Location" type="text" required value={formData.location} onChange={handleInputChange} />
        )}

        {role === Role.ADMIN && (
          <input name="adminCode" placeholder="Admin Code" type="text" required value={formData.adminCode} onChange={handleInputChange} />
        )}

        {role === Role.STUDENT && (
          <>
            <input name="phone" placeholder="Phone" type="tel" required value={formData.phone} onChange={handleInputChange} />
            <input name="aadhar" placeholder="Aadhar" type="text" required value={formData.aadhar} onChange={handleInputChange} />
          </>
        )}

        <input name="email" placeholder="Email" type="email" required value={formData.email} onChange={handleInputChange} />
        <input name="password" placeholder="Password" type="password" required value={formData.password} onChange={handleInputChange} />
        <input name="confirmPassword" placeholder="Confirm Password" type="password" required value={formData.confirmPassword} onChange={handleInputChange} />

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          className={`signup-btn ${
            role === Role.FIRM ? 'firm' : role === Role.STUDENT ? 'student' : 'admin'
          }`}
        >
          Sign Up
        </button>

        <button type="button" className="back-btn" onClick={() => onNavigate('welcome')}>
          Back
        </button>
      </form>
    </div>
  );
};

export default SignUp;
