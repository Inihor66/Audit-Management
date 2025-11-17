// api/email/api.js

export async function sendVerificationEmail(email, userId, code, expiresAt) {
  try {
    const res = await fetch("https://audit-management-wgbd.onrender.com/email/send-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, userId, code, expiresAt })
    });

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("Email API Error:", err);
    return { error: "Failed" };
  }
}
