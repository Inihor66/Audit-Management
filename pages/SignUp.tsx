import React, { useState } from 'react';
import { Role, User } from '../types';
import * as storage from '../services/storageService';
import { ROLE_CONFIG } from '../constants';

interface SignUpProps {
    onSignUp: (user: User) => void;
    onNavigate: (page: string, role?: Role) => void;
}

const SignUp = ({ onSignUp, onNavigate }: SignUpProps) => {
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
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            const newUserPayload: Omit<User, 'id' | 'subscription' | 'notifications' | 'pendingPaymentSS' | 'emailVerified' | 'emailVerification'> = {
                role,
                name: formData.name,
                email: formData.email,
                passwordHash: formData.password, // Storing plain text for simulation
                ...(role !== Role.STUDENT && { location: formData.location }),
                ...(role === Role.STUDENT && { phone: formData.phone, aadhar: formData.aadhar }),
                ...(role === Role.ADMIN && { adminCode: formData.adminCode }),
            };
            const newUser = storage.addUser(newUserPayload);
            // If firm or admin: generate verification code and navigate to verification page
            if (role === Role.FIRM || role === Role.ADMIN) {
                storage.generateEmailVerificationCode(newUser.id);
                sessionStorage.setItem('pendingVerificationUserId', newUser.id);
                sessionStorage.setItem('pendingVerificationRole', role);
                onNavigate('verify');
                return;
            }
            // Students are auto-verified: call onSignUp (which logs in)
            onSignUp(newUser);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
    };
    
    const config = ROLE_CONFIG[role];
    
    const getRoleButtonClass = () => {
        switch (role) {
            case Role.FIRM: return 'btn-firm';
            case Role.STUDENT: return 'btn-student';
            case Role.ADMIN: return 'btn-admin';
            default: return '';
        }
    }

    return (
        <div className="page-center">
            <div className="auth-form-container">
                <div className="auth-form-card">
                    <h2>Create your account</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="role">I am a...</label>
                            <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="form-select">
                                <option value={Role.FIRM}>Firm</option>
                                <option value={Role.STUDENT}>Student</option>
                                <option value={Role.ADMIN}>Admin</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="name">{role === Role.FIRM ? 'Firm Name' : 'Full Name'}</label>
                            <input id="name" name="name" type="text" required onChange={handleInputChange} className="form-input" />
                        </div>
                        
                        {(role === Role.FIRM || role === Role.ADMIN) && (
                            <div className="form-group">
                                <label htmlFor="location">Location</label>
                                <input id="location" name="location" type="text" required onChange={handleInputChange} className="form-input" />
                            </div>
                        )}

                        {role === Role.ADMIN && (
                            <div className="form-group">
                                <label htmlFor="adminCode">Unique Admin Code</label>
                                <input id="adminCode" name="adminCode" type="text" placeholder="e.g., ADM123" required onChange={handleInputChange} className="form-input" />
                            </div>
                        )}
                        
                        {role === Role.STUDENT && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input id="phone" name="phone" type="tel" required onChange={handleInputChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="aadhar">Aadhar Number</label>
                                    <input id="aadhar" name="aadhar" type="text" required onChange={handleInputChange} className="form-input" />
                                </div>
                            </>
                        )}
                        
                        <div className="form-group">
                            <label htmlFor="email">Email address</label>
                            <input id="email" name="email" type="email" required onChange={handleInputChange} className="form-input" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input id="password" name="password" type="password" required onChange={handleInputChange} className="form-input" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input id="confirmPassword" name="confirmPassword" type="password" required onChange={handleInputChange} className="form-input" />
                        </div>

                        {error && <p className="form-error">{error}</p>}

                        <div style={{marginTop: '2rem'}}>
                            <button type="submit" className={`btn ${getRoleButtonClass()}`}>
                                Sign Up as {config.name}
                            </button>
                        </div>
                    </form>

                     <div className="auth-links">
                        <button onClick={() => onNavigate('welcome')}>
                            Back to role selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SignUp;