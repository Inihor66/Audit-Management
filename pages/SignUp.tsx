import React, { useState } from 'react';
import { Role } from '../types';
import * as storage from '../services/storageService';
import { ROLE_CONFIG } from '../constants/roles.js';

const SignUp = ({ onSignUp, onNavigate }) => {
  const [role, setRole] = useState(Role.FIRM);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const newUserPayload = {
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
    } catch (err) {
      setError(err.message || 'An unknown error occurred.');
    }
  };

  // IMPORTANT FIX — guarantee ROLE_CONFIG[role] always returns valid object
  const config = ROLE_CONFIG[role] || {
    name: "User",
    hex: "#000000"
  };

  const getRoleButtonClass = () => {
    switch (role) {
      case Role.FIRM:
        return 'btn-firm';
      case Role.STUDENT:
        return 'btn-student';
      case Role.ADMIN:
        return 'btn-admin';
      default:
        return '';
    }
  };

  return (
    <div className="page-center">
      <div className="auth-form-container">
        <div className="auth-form-card">
          <h2>Create your account</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>I am a...</label>
              <select
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-select"
              >
                <option value={Role.FIRM}>Firm</option>
                <option value={Role.STUDENT}>Student</option>
                <option value={Role.ADMIN}>Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>{role === Role.FIRM ? 'Firm Name' : 'Full Name'}</label>
              <input name="name" type="text" required onChange={handleInputChange} className="form-input" />
            </div>

            {(role === Role.FIRM || role === Role.ADMIN) && (
              <div className="form-group">
                <label>Location</label>
                <input name="location" type="text" required onChange={handleInputChange} className="form-input" />
              </div>
            )}

            {role === Role.ADMIN && (
              <div className="form-group">
                <label>Unique Admin Code</label>
                <input name="adminCode" type="text" required onChange={handleInputChange} className="form-input" />
              </div>
            )}

            {role === Role.STUDENT && (
              <>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input name="phone" type="tel" required onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Aadhar Number</label>
                  <input name="aadhar" type="text" required onChange={handleInputChange} className="form-input" />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Email address</label>
              <input name="email" type="email" required onChange={handleInputChange} className="form-input" />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" required onChange={handleInputChange} className="form-input" />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input name="confirmPassword" type="password" required onChange={handleInputChange} className="form-input" />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div style={{ marginTop: '2rem' }}>
              <button type="submit" className={`btn ${getRoleButtonClass()}`}>
                Sign Up as {config.name}
              </button>
            </div>
          </form>

          <div className="auth-links">
            <button onClick={() => onNavigate('welcome')}>Back to role selection</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
