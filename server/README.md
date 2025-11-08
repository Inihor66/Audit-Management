This small Express server provides endpoints to send verification emails and admin notification emails with payment screenshots.

Setup

1. Copy `.env.example` to `.env` and fill in SMTP details and FRONTEND_ORIGIN.

2. Install dependencies and start the server:

```powershell
cd server
npm install
npm start
```

3. In the frontend project root, create a `.env` file with:

```
VITE_API_BASE_URL=http://localhost:4000
```

4. Start the frontend (Vite) and test signup. The backend will send real emails using the configured SMTP provider.

Notes
- For testing use services like Mailtrap, SendGrid, or use a Gmail account with an app password.
- Ensure the SMTP credentials are kept secret and never checked into source control.
