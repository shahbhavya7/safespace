const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Twilio Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;

if (accountSid && authToken && twilioPhoneNumber) {
  twilioClient = twilio(accountSid, authToken);
}

// Helper functions
async function sendSMS(to, message) {
  if (!twilioClient) {
    return { success: false, error: 'Twilio not configured' };
  }
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    });
    return { success: true, sid: result.sid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function makePhoneCall(to, message) {
  if (!twilioClient) {
    return { success: false, error: 'Twilio not configured' };
  }
  try {
    const twimlUrl = `http://twimlets.com/message?Message=${encodeURIComponent(message)}`;
    const call = await twilioClient.calls.create({
      url: twimlUrl,
      to: to,
      from: twilioPhoneNumber,
    });
    return { success: true, sid: call.sid, status: call.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Routes
app.post('/api/emergency/call-and-sms', async (req, res) => {
  try {
    const { latitude, longitude, emergencyNumber } = req.body;
    
    if (!twilioClient) {
      return res.status(503).json({
        success: false,
        message: 'Twilio not configured',
        error: 'TWILIO_NOT_CONFIGURED'
      });
    }

    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const smsMessage = `🚨 EMERGENCY ALERT!\n\nLocation: ${googleMapsLink}\n\nTime: ${new Date().toLocaleString()}\n\n- SafeSpace`;
    const voiceMessage = `Emergency SOS alert activated. Please respond immediately.`;

    const callResult = await makePhoneCall(emergencyNumber, voiceMessage);
    const smsResult = await sendSMS(emergencyNumber, smsMessage);

    res.json({
      success: callResult.success || smsResult.success,
      call: callResult,
      sms: smsResult,
      mapsLink: googleMapsLink
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/emergency/notify-contacts', async (req, res) => {
  try {
    const { latitude, longitude, phoneNumbers, message, makeCall } = req.body;

    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const smsMessage = message || `🚨 EMERGENCY SOS ALERT!\n\nLocation: ${googleMapsLink}\n\nTime: ${new Date().toLocaleString()}`;

    const smsPromises = phoneNumbers.map(phone => sendSMS(phone, smsMessage));
    const smsResults = await Promise.all(smsPromises);

    let callResult = null;
    if (makeCall && phoneNumbers.length > 0) {
      callResult = await makePhoneCall(phoneNumbers[0], 'Emergency SOS alert! Please respond immediately.');
    }

    res.json({
      success: true,
      smsResults,
      callResult,
      mapsLink: googleMapsLink
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/location/share/start', async (req, res) => {
  try {
    const { latitude, longitude, phoneNumbers } = req.body;
    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const smsMessage = `📍 Location Sharing Started\n\nLocation: ${googleMapsLink}\n\n- SafeSpace`;

    const smsPromises = phoneNumbers.map(phone => sendSMS(phone, smsMessage));
    const smsResults = await Promise.all(smsPromises);

    res.json({
      success: true,
      smsResults,
      sessionId: `SESSION_${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/location/share/stop', async (req, res) => {
  try {
    const { phoneNumbers } = req.body;
    const smsMessage = `📍 Location Sharing Stopped\n\n- SafeSpace`;

    const smsPromises = phoneNumbers.map(phone => sendSMS(phone, smsMessage));
    const smsResults = await Promise.all(smsPromises);

    res.json({ success: true, smsResults });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/chatbot', async (req, res) => {
  const { message } = req.body;
  const userMessage = message.toLowerCase().trim();

  let reply = 'I\'m here to help! How can I assist you today?';
  let quickActions = [];

  if (userMessage.includes('emergency') || userMessage.includes('sos')) {
    reply = '🚨 For emergencies, use the Safety Hub to trigger an SOS alert.';
    quickActions = [{ label: 'Safety Hub', action: '/safety' }];
  } else if (userMessage.includes('hello') || userMessage.includes('hi')) {
    reply = 'Hello! 👋 I\'m your SafeSpace assistant. How can I help you today?';
  }

  res.json({ success: true, reply, quickActions });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    twilioConfigured: !!twilioClient,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'SafeSpace API', version: '3.0.0' });
});

module.exports = app;
