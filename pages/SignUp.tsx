// pages/SignUp.tsx
import React, { useState } from "react";
import { Role } from "../types";
import * as storage from "../services/storageService";
import { ROLE_CONFIG, API_BASE_URL } from "../constants";

interface SignUpProps {
  onSignUp: (user: any) => void;
  onNavigate: (page: string) => void;
  role?: Role;
}

const SignUp = ({ onSignUp, onNavigate, role: initialRole }: SignUpProps) => {
  const [role, setRole] = useState<Role>(initialRole || Role.FIRM);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    aadhar: "",
    adminCode: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as keyof typeof Role;
    setRole(Role[value]); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const newUserPayload: any = {
        role,
        name: formData.name,
        email: formData.email,
        passwordHash: formData.password,
        ...(role !== Role.STUDENT && { location: formData.location }),
        ...(role === Role.STUDENT && {
          phone: formData.phone,
          aadhar: formData.aadhar,
        }),
        ...(role === Role.ADMIN && { adminCode: formData.adminCode }),
      };

      const newUser = storage.addUser(newUserPayload);

      // Send verification email only for FIRM or ADMIN
      if (role === Role.FIRM || role === Role.ADMIN) {
        const verification = storage.createEmailVerificationRecord(newUser.id);

        const res = await fetch(`${API_BASE_URL}/email/send-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: newUser.id,
            email: newUser.email,
            code: verification.code,
            expiresAt: verification.expiresAt,
          }),
        });

        if (!res.ok) {
          setError("Failed to send verification email. Please try again.");
          setLoading(false);
          return;
        }

        sessionStorage.setItem("pendingVerificationUserId", newUser.id);
        sessionStorage.setItem("pendingVerificationRole", role.toString());
        onNavigate("verify");

        setLoading(false);
        return;
      }

      onSignUp(newUser);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      setLoading(false);
    }
  };

  const config = ROLE_CONFIG[role] || { name: "User", hex: "#000000" };

  const getButtonClass = () => {
    if (role === Role.FIRM) return "btn-firm";
    if (role === Role.STUDENT) return "btn-student";
    if (role === Role.ADMIN) return "btn-admin";
    return "btn";
  };

  return (
    <div className="page-center">
      <form onSubmit={handleSubmit} className="auth-form-card">
        <h2>Create your account</h2>

        <div className="form-group">
          <label>I am a...</label>
          <select value={Role[role]} onChange={handleRoleChange} className="form-select">
            <option value="FIRM">Firm</option>
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="form-group">
          <label>{role === Role.FIRM ? "Firm Name" : "Full Name"}</label>
          <input
            name="name"
            type="text"
            required
            className="form-input"
            onChange={handleInputChange}
          />
        </div>

        {(role === Role.FIRM || role === Role.ADMIN) && (
          <div className="form-group">
            <label>Location</label>
            <input
              name="location"
              type="text"
              required
              className="form-input"
              onChange={handleInputChange}
            />
          </div>
        )}

        {role === Role.ADMIN && (
          <div className="form-group">
            <label>Admin Code</label>
            <input
              name="adminCode"
              type="text"
              required
              className="form-input"
              onChange={handleInputChange}
            />
          </div>
        )}

        {role === Role.STUDENT && (
          <>
            <div className="form-group">
              <label>Phone</label>
              <input
                name="phone"
                type="tel"
                required
                className="form-input"
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Aadhar</label>
              <input
                name="aadhar"
                type="text"
                required
                className="form-input"
                onChange={handleInputChange}
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label>Email</label>
          <input
            name="email"
            type="email"
            required
            className="form-input"
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            name="password"
            type="password"
            required
            className="form-input"
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            name="confirmPassword"
            type="password"
            required
            className="form-input"
            onChange={handleInputChange}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className={`btn ${getButtonClass()}`} disabled={loading}>
          {loading ? "Creating account..." : `Sign Up as ${config.name}`}
        </button>
      </form>
    </div>
  );
};

export default SignUp;
