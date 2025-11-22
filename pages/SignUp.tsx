import React, { useState } from "react";
import { Role } from "../types";
import * as storage from "../services/storageService";
import { ROLE_CONFIG } from "../constants";

const SignUp = ({ onSignUp = () => {}, onNavigate = () => {}, role: initialRole }) => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e) => {
    setRole(Role[e.target.value]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
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

      const newUser = storage.addUser(payload);

      if (role === Role.FIRM || role === Role.ADMIN) {
        const sent = await storage.generateEmailVerificationCode(newUser.id);

        if (!sent) {
          setError("Failed to send verification email.");
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
    } catch (err) {
      setError("Something went wrong.");
      setLoading(false);
    }
  };

  const config = ROLE_CONFIG[role];

  return (
    <div className="page-center">
      <form onSubmit={handleSubmit} className="auth-form-card">
        <h2>Create your account</h2>
        {/* Rest of the form code remains the same */}
        <button type="submit" className={`btn btn-primary`} disabled={loading}>
          {loading ? "Creating account..." : `Sign Up as ${config.name}`}
        </button>
      </form>
    </div>
  );
};

export default SignUp;
