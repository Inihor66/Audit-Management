import React, { useState } from 'react';
import { Role } from '../types';
import * as storage from '../services/storageService';
import { ROLE_CONFIG } from '../constants';

const SignUp = ({ onSignUp, onNavigate, role: initialRole }: { onSignUp: any; onNavigate: any; role: Role }) => {
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

    const config = ROLE_CONFIG[role] || { name: 'User', hex: '#000000' };

    return (
        <div className="page-center">
            <form onSubmit={handleSubmit} className="auth-form-card">
                <h2>Create your account</h2>

                <label>I am a...</label>
                <select value={role} onChange={handleRoleChange}>
                    <option value="FIRM">Firm</option>
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                </select>

                <label>{role === Role.FIRM ? 'Firm Name' : 'Full Name'}</label>
                <input name="name" type="text" required onChange={handleInputChange} />

                {(role === Role.FIRM || role === Role.ADMIN) && (
                    <input name="location" placeholder="Location" type="text" required onChange={handleInputChange} />
                )}

                {role === Role.ADMIN && (
                    <input name="adminCode" placeholder="Admin Code" type="text" required onChange={handleInputChange} />
                )}

                {role === Role.STUDENT && (
                    <>
                        <input name="phone" placeholder="Phone" type="tel" required onChange={handleInputChange} />
                        <input name="aadhar" placeholder="Aadhar" type="text" required onChange={handleInputChange} />
                    </>
                )}

                <input name="email" placeholder="Email" type="email" required onChange={handleInputChange} />
                <input name="password" placeholder="Password" type="password" required onChange={handleInputChange} />
                <input name="confirmPassword" placeholder="Confirm Password" type="password" required onChange={handleInputChange} />

                {error && <p className="form-error">{error}</p>}

                <button type="submit">Sign Up as {config.name}</button>
                <button type="button" onClick={() => onNavigate('welcome')}>Back</button>
            </form>
        </div>
    );
};

export default SignUp;
