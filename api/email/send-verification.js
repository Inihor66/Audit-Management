export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email or code missing" });
  }

  // Simulated email
  console.log("SEND EMAIL TO:", email, "CODE:", code);

  return res.status(200).json({ 
    message: `Verification email sent to ${email}`, 
    code 
  });
}
