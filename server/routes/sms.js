import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/send', async (req, res) => {
    const { phone, message } = req.body;
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !apiKeySid || !apiKeySecret || !twilioPhone) {
        console.log(`[Mock SMS] To ${phone}: ${message}`);
        return res.json({ success: true, message: 'SMS simulated (Missing TWILIO_PHONE_NUMBER in .env)' });
    }

    try {
        const response = await axios.post(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            new URLSearchParams({
                To: phone.startsWith('+') ? phone : `+91${phone}`, // Assumes India code if not provided
                From: twilioPhone,
                Body: message
            }),
            {
                auth: {
                    username: apiKeySid,
                    password: apiKeySecret
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        console.log('Twilio response:', response.data.sid);
        res.json({ success: true, message: 'SMS sent successfully via Twilio' });
    } catch (error) {
        console.error('Twilio Error:', error?.response?.data || error.message);
        res.status(500).json({ success: false, error: 'Failed to send SMS via Twilio' });
    }
});

export default router;
