import React, { useState } from 'react';
import { Role, User } from '../types';
import * as storage from '../services/storageService';

interface SignUpProps {
    onNavigate: (page: string, options?: { role?: Role; userId?: string; }) => void;
}

const SignUp = ({ onNavigate }: SignUpProps) => {
    // Form data state
    const [role, setRole] = useState<Role>(Role.FIRM);
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
    
    // Error state
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle form submission
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (role === Role.ADMIN && (!formData.adminCode || formData.adminCode.trim().length === 0)) {
            setError('Admin Code is required.');
            return;
        }
        
        try {
            // Create the user
            const newUserPayload = {
                role,
                name: formData.name,
                email: formData.email,
                passwordHash: formData.password, // Storing plain text for simulation
                ...(role !== Role.STUDENT && { location: formData.location }),
                ...(role === Role.STUDENT && { phone: formData.phone, aadhar: formData.aadhar }),
                ...(role === Role.ADMIN && { adminCode: formData.adminCode }),
            };
            const newUser = storage.addUser(newUserPayload);
            
            // Navigate to verification page instead of logging in
            onNavigate('verify_email', { userId: newUser.id });

        } catch (err) {
            // The addUser function throws an error if user or admin code exists
            setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
            console.error("Signup Error:", err);
            // Scroll to top to see error if needed
            window.scrollTo(0,0);
        }
    };

    // Render the single sign-up form
    return (
        <div className="auth-page">
            <div className="auth-container">
                <h2 className="auth-title">Create your account</h2>
            </div>

            <div className="auth-form-container">
                <div className="auth-form-card">
                    {error && (
                        <div className="error-alert">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                    <form className="auth-form" onSubmit={handleFormSubmit}>
                        <div className="form-group">
                            <label htmlFor="role" className="form-label">I am a...</label>
                            <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="form-select">
                                <option value={Role.FIRM}>Firm</option>
                                <option value={Role.STUDENT}>Student</option>
                                <option value={Role.ADMIN}>Admin</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="name" className="form-label">{role === Role.FIRM ? 'Firm Name' : 'Full Name'}</label>
                            <input id="name" name="name" type="text" value={formData.name} required onChange={handleInputChange} className="form-input" placeholder={role === Role.FIRM ? "Enter firm name" : "Enter your full name"} />
                        </div>
                        
                        {(role === Role.FIRM || role === Role.ADMIN) && (
                            <div className="form-group">
                                <label htmlFor="location" className="form-label">Location</label>
                                <input id="location" name="location" type="text" value={formData.location} required onChange={handleInputChange} className="form-input" placeholder="City or Region" />
                            </div>
                        )}
                        
                        {role === Role.ADMIN && (
                            <div className="form-group">
                                <label htmlFor="adminCode" className="form-label">Unique Admin Code</label>
                                <input id="adminCode" name="adminCode" type="text" value={formData.adminCode} required placeholder="e.g., MYCODE123" onChange={handleInputChange} className="form-input" />
                                <p className="form-input-description">This code will be shared with firms to link them to your dashboard.</p>
                            </div>
                        )}

                        {role === Role.STUDENT && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="phone" className="form-label">Phone Number</label>
                                    <input id="phone" name="phone" type="tel" value={formData.phone} required onChange={handleInputChange} className="form-input" placeholder="10-digit mobile number" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="aadhar" className="form-label">Aadhar Number</label>
                                    <input id="aadhar" name="aadhar" type="text" value={formData.aadhar} required onChange={handleInputChange} className="form-input" placeholder="12-digit UIDAI number" />
                                </div>
                            </>
                        )}
                        
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email address</label>
                            <input id="email" name="email" type="email" value={formData.email} required onChange={handleInputChange} className="form-input" placeholder="you@example.com" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input id="password" name="password" type="password" value={formData.password} required onChange={handleInputChange} className="form-input" placeholder="••••••••" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                            <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} required onChange={handleInputChange} className="form-input" placeholder="••••••••" />
                        </div>

                        <div>
                            <button type="submit" className={`submit-button ${role.toLowerCase()}`}>
                                Create Account
                            </button>
                        </div>
                    </form>

                    <div className="auth-footer">
                        <button onClick={() => onNavigate('login', { role })} className="auth-footer-link" style={{marginTop: '0.5rem'}}>
                            Already have an account? Log in
                        </button>
                        <button 
                            onClick={() => onNavigate('welcome')} 
                            className={`outline-button ${role.toLowerCase()}`} 
                            style={{marginTop: '0.5rem'}}
                        >
                            Back to role selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SignUp;
