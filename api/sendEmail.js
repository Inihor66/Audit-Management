import sgMail from "@sendgrid/mail";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Missing email or OTP code" });
  }

  try {
    // Set API Key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM, // MUST be verified in SendGrid
      subject: "Your Verification Code",
      text: `Your verification code is: ${code}`,
      html: `
        <div style="padding: 15px; font-family: Arial;">
          <h2>Email Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="text-align:center; padding:10px; background:#eee;">${code}</h1>
          <p>This code is valid for 10 minutes.</p>
        </div>
      `,
    };

    await sgMail.send(msg);

    return res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("SendGrid Email Error:", error.response?.body || error);
    return res.status(500).json({
      error: "Failed to send email",
      details: error.response?.body
    });
  }
}
