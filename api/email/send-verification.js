import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  try {
    await sgMail.send({
      to: "aarohipurwar06@gmail.com",   
      from: process.env.EMAIL_FROM,
      subject: "SendGrid Integration Test",
      text: "If you see this, SendGrid integration is working."
    });

    res.status(200).json({ message: "Email sent successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
