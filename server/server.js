require('dotenv').config({path: "./process.env"});
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = 5013;

const router = express.Router();

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// fucnction to send an email using nodemailer
async function sendEmail(email, name, html) {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Receipt Confirmation for ${name}`,
            text: `Receipt for ${name}`, // Optional plain text
            html: html,
        });
        return { success: true };
    } catch (err) {
        console.error('Error sending email:', err);
        return { success: false, error: err };
    }
}

// route to be called to generate receipy
router.post('/receipt', async (req, res) => {
    const { name, email, amount, category, street, city, state, postalCode } = req.body;

    if (!name || !email || !amount || !category || !street || !city || !state || !postalCode) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    console.log(`Receipt for ${name} (${email}): $${amount} for ${category}`);
    console.log(`Address: ${street}, ${city}, ${state}, ${postalCode}`);

    const htmlContent = `
    <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="text-align: center; color: #333;">Receipt Confirmation</h2>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
        <p style="font-size: 16px; color: #555;"><strong>Name:</strong> ${name}</p>
        <p style="font-size: 16px; color: #555;"><strong>Amount:</strong> <span style="color: #2a9d8f;">$${amount}</span></p>
        <p style="font-size: 16px; color: #555;"><strong>Category:</strong> ${category}</p>
        <p style="font-size: 16px; color: #555;"><strong>Address:</strong><br> ${street},<br> ${city}, ${state} ${postalCode}</p>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
        <p style="text-align: center; font-size: 14px; color: #aaa;">Thank you for your submission!</p>
    </div>
    `;

    const result = await sendEmail(email, name, htmlContent);

    if (!result.success) {
        return res.status(500).json({ error: 'Failed to send email' });
    }

    res.status(200).json({ message: 'Receipt generated and sent to email' });
});

app.use('/', router);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
