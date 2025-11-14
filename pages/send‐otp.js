import { useState } from 'react';

export default function SendOTPPage() {
  const [email, setEmail] = useState('');

  const sendOTP = async () => {
    const res = await fetch('/api/email/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    alert(data.message);
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
