import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  try {
    await sgMail.send({
      to: "aarohipurwar06@gmail.com",   // yaha apni email daalo
      from: process.env.EMAIL_FROM,
      subject: "SendGrid Integration Test",
      text: "If you receive this email, your SendGrid integration works!"
    });

    return res.status(200).json({ message: "Email sent successfully!" });

  } catch (err) {
    console.error("SendGrid Error: ", err);
    return res.status(500).json({ error: err.message });
  }
}
