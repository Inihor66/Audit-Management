import React, { useState } from "react";
import Login from "./Login";
import SignUp from "./SignUp";
import { Role, User } from "../types";

type Page = "welcome" | "login" | "signup" | "dashboard" | "verify";

const ParentComponent = () => {
  const [currentPage, setCurrentPage] = useState<Page>("welcome");
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Navigate function to pass to children
  const handleNavigate = (page: Page, selectedRole?: Role) => {
    setCurrentPage(page);
    if (selectedRole) setRole(selectedRole);
  };

  // Handle login
  const handleLogin = (user: User) => {
    console.log("User logged in:", user);
    setCurrentUser(user);
    setCurrentPage("dashboard"); // navigate to dashboard after login
    sessionStorage.setItem("currentUser", JSON.stringify(user));
  };

  // Handle signup
  const handleSignUp = (user: User) => {
    console.log("User signed up:", user);
    setCurrentUser(user);
    setCurrentPage("dashboard"); // navigate to dashboard after signup
    sessionStorage.setItem("currentUser", JSON.stringify(user));
  };

  return (
    <div>
      {currentPage === "welcome" && (
        <div className="welcome-page">
          <h2>Welcome! Select your role</h2>
          <button onClick={() => handleNavigate("login", Role.FIRM)}>Login as Firm</button>
          <button onClick={() => handleNavigate("login", Role.STUDENT)}>Login as Student</button>
          <button onClick={() => handleNavigate("login", Role.ADMIN)}>Login as Admin</button>
        </div>
      )}

      {currentPage === "login" && role && (
        <Login
          role={role}
          onLogin={handleLogin}
          onNavigate={handleNavigate}
        />
      )}

      {currentPage === "signup" && role && (
        <SignUp
          role={role}
          onSignUp={handleSignUp}
          onNavigate={handleNavigate}
        />
      )}

      {currentPage === "dashboard" && currentUser && (
        <div className="dashboard-page">
          <h2>Welcome, {currentUser.name}!</h2>
          <button
            onClick={() => {
              setCurrentUser(null);
              setCurrentPage("welcome");
              sessionStorage.removeItem("currentUser");
            }}
          >
            Logout
          </button>
        </div>
      )}

      {currentPage === "verify" && (
        <div className="verify-page">
          <h2>Email Verification Page</h2>
          <button onClick={() => handleNavigate("login", role)}>Back to Login</button>
        </div>
      )}
    </div>
  );
};

export default ParentComponent;
