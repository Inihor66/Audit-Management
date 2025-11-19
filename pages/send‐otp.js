import { useState } from 'react';

export default function SendOTPPage() {
  const [email, setEmail] = useState('');

  const sendOTP = async () => {
    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 1000 * 60 * 10; // 10 minutes
    const userId = "temp-user"; // or real userId if you have it

    const res = await fetch('/api/email/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email,
        code,
        expiresAt
      }),
    });

    const data = await res.json();
    if (data.ok) {
      alert("OTP Sent Successfully!");
    } else {
      alert("Error sending OTP");
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      <h1>Send OTP</h1>
      <input
        type="email"
        placeholder="aarohipurwar06@gmail.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button onClick={sendOTP}>Send OTP</button>
    </div>
  );
}
