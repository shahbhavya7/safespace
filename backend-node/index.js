const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Twilio Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;

// Initialize Twilio only if credentials are provided
if (accountSid && authToken && twilioPhoneNumber) {
  twilioClient = twilio(accountSid, authToken);
  console.log('✅ Twilio initialized successfully');
} else {
  console.log('⚠️  Twilio credentials not found. Call & SMS features will be disabled.');
}

// Helper function to send SMS
async function sendSMS(to, message) {
  if (!twilioClient) {
    console.log('⚠️  Twilio not configured. SMS not sent to:', to);
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    });
    console.log(`✅ SMS sent to ${to}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to make phone call
async function makePhoneCall(to, message) {
  if (!twilioClient) {
    console.log('⚠️  Twilio not configured. Call not made to:', to);
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    // Create TwiML for voice message
    const twimlUrl = `http://twimlets.com/message?Message=${encodeURIComponent(message)}`;

    const call = await twilioClient.calls.create({
      url: twimlUrl,
      to: to,
      from: twilioPhoneNumber,
    });
    console.log(`✅ Call initiated to ${to}: ${call.sid}`);
    return { success: true, sid: call.sid, status: call.status };
  } catch (error) {
    console.error(`❌ Failed to call ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ========== EMERGENCY SOS - AUTOMATED CALL & SMS ==========
app.post('/api/emergency/call-and-sms', async (req, res) => {
  try {
    const { latitude, longitude, emergencyNumber, timestamp } = req.body;

    console.log('🚨 EMERGENCY SOS ACTIVATED:', {
      emergencyNumber: emergencyNumber,
      location: { latitude, longitude },
      timestamp: timestamp || new Date().toLocaleString(),
    });

    if (!twilioClient) {
      return res.status(503).json({
        success: false,
        message: 'Twilio not configured. Please add credentials to .env file.',
        error: 'TWILIO_NOT_CONFIGURED'
      });
    }

    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

    // SMS message
    const smsMessage = `🚨 EMERGENCY ALERT!\n\nEmergency SOS activated.\n\nLocation: ${googleMapsLink}\n\nTime: ${new Date().toLocaleString()}\n\n- SafeSpace Emergency System`;

    // Voice message for call
    const voiceMessage = `Emergency SOS alert activated. Please respond immediately. The caller's location has been sent via SMS.`;

    // Make call to emergency number
    console.log(`📞 Initiating call to ${emergencyNumber}...`);
    const callResult = await makePhoneCall(emergencyNumber, voiceMessage);

    // Send SMS to emergency number
    console.log(`💬 Sending SMS to ${emergencyNumber}...`);
    const smsResult = await sendSMS(emergencyNumber, smsMessage);

    if (callResult.success || smsResult.success) {
      res.json({
        success: true,
        message: 'Emergency alert sent successfully',
        call: callResult,
        sms: smsResult,
        location: { latitude, longitude },
        mapsLink: googleMapsLink
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send emergency alert',
        call: callResult,
        sms: smsResult
      });
    }

  } catch (error) {
    console.error('❌ Emergency SOS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emergency alert',
      error: error.message
    });
  }
});

// ========== NOTIFY TRUSTED CONTACTS DURING SOS ==========
app.post('/api/emergency/notify-contacts', async (req, res) => {
  try {
    const { latitude, longitude, phoneNumbers, message, makeCall } = req.body;

    console.log('🚨 NOTIFYING TRUSTED CONTACTS:', {
      contacts: phoneNumbers,
      location: { latitude, longitude },
      makeCall: makeCall || false,
      timestamp: new Date().toLocaleString()
    });

    if (!twilioClient) {
      console.log('⚠️  Twilio not configured. Cannot notify contacts.');
      return res.json({
        success: false,
        message: 'Twilio not configured',
        error: 'TWILIO_NOT_CONFIGURED'
      });
    }

    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const smsMessage = message || `🚨 EMERGENCY SOS ALERT!\n\nYour trusted contact needs immediate help!\n\nLocation: ${googleMapsLink}\n\nTime: ${new Date().toLocaleString()}\n\nPlease respond immediately!\n\n- SafeSpace Emergency System`;

    // Send SMS to all trusted contacts
    const smsPromises = phoneNumbers.map(phone => sendSMS(phone, smsMessage));
    const smsResults = await Promise.all(smsPromises);

    const successCount = smsResults.filter(r => r.success).length;

    let callResult = null;

    // Optionally call the first contact
    if (makeCall && phoneNumbers.length > 0) {
      const voiceMessage = `Emergency SOS alert! Your trusted contact needs immediate help. Their location has been sent via text message. Please respond immediately.`;
      console.log(`📞 Calling first trusted contact: ${phoneNumbers[0]}...`);
      callResult = await makePhoneCall(phoneNumbers[0], voiceMessage);
    }

    res.json({
      success: true,
      message: `${successCount}/${phoneNumbers.length} trusted contacts notified${callResult ? ' and call initiated' : ''}`,
      smsResults,
      callResult,
      location: { latitude, longitude },
      mapsLink: googleMapsLink
    });

  } catch (error) {
    console.error('❌ Notify contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to notify contacts',
      error: error.message
    });
  }
});

// ========== LOCATION SHARING START (SMS to Trusted Contacts) ==========
app.post('/api/location/share/start', async (req, res) => {
  try {
    const { latitude, longitude, phoneNumbers } = req.body;

    console.log('📍 LOCATION SHARING STARTED:', {
      location: { latitude, longitude },
      trustedContacts: phoneNumbers,
      timestamp: new Date().toLocaleString()
    });

    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const smsMessage = `📍 Location Sharing Started\n\nYour trusted contact has started sharing their live location with you.\n\nCurrent Location: ${googleMapsLink}\n\nYou will receive updates as they move.\n\n- SafeSpace App`;

    // Send SMS to all trusted contacts
    const smsPromises = phoneNumbers.map(phone => sendSMS(phone, smsMessage));
    const smsResults = await Promise.all(smsPromises);

    const successCount = smsResults.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Location sharing started! ${successCount}/${phoneNumbers.length} contacts notified`,
      smsResults,
      sessionId: `SESSION_${Date.now()}`,
    });

  } catch (error) {
    console.error('❌ Location share start error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start location sharing',
      error: error.message
    });
  }
});

// ========== LOCATION UPDATE (SMS to Trusted Contacts) ==========
app.post('/api/location/update', async (req, res) => {
  try {
    const { latitude, longitude, phoneNumbers } = req.body;

    console.log('📍 LOCATION UPDATE:', {
      location: { latitude, longitude },
      timestamp: new Date().toLocaleString()
    });

    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const smsMessage = `📍 Location Update\n\nUpdated Location: ${googleMapsLink}\n\nTime: ${new Date().toLocaleTimeString()}\n\n- SafeSpace App`;

    // Send SMS to all trusted contacts
    const smsPromises = phoneNumbers.map(phone => sendSMS(phone, smsMessage));
    const smsResults = await Promise.all(smsPromises);

    res.json({
      success: true,
      message: 'Location updated',
      smsResults,
    });

  } catch (error) {
    console.error('❌ Location update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
});

// ========== LOCATION SHARING STOP (SMS to Trusted Contacts) ==========
app.post('/api/location/share/stop', async (req, res) => {
  try {
    const { phoneNumbers } = req.body;

    console.log('📍 LOCATION SHARING STOPPED:', {
      trustedContacts: phoneNumbers,
      timestamp: new Date().toLocaleString()
    });

    const smsMessage = `📍 Location Sharing Stopped\n\nYour trusted contact has stopped sharing their location.\n\nStay safe!\n\n- SafeSpace App`;

    // Send SMS to all trusted contacts
    const smsPromises = phoneNumbers.map(phone => sendSMS(phone, smsMessage));
    const smsResults = await Promise.all(smsPromises);

    const successCount = smsResults.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Location sharing stopped! ${successCount}/${phoneNumbers.length} contacts notified`,
      smsResults,
    });

  } catch (error) {
    console.error('❌ Location share stop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop location sharing',
      error: error.message
    });
  }
});

// ========== CHATBOT ASSISTANT ==========
app.post('/api/chatbot', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    const userMessage = message.toLowerCase().trim();

    console.log('💬 Chatbot message received:', userMessage);

    // Mood detection keywords (improved with negation handling)
    const moodKeywords = {
      upset: ['sad', 'depressed', 'anxious', 'worried', 'scared', 'afraid', 'terrible', 'awful', 'stressed', 'panic', 'down', 'low', 'unhappy', 'crying', 'hurt', 'pain', 'lonely', 'hopeless', 'overwhelmed', 'not feeling good', 'not good', 'feeling bad', 'feel bad', 'not okay', 'not fine', 'not well'],
      frustrated: ['angry', 'frustrated', 'annoyed', 'upset', 'complaint', 'issue', 'problem', 'not working', 'broken', 'bad', 'irritated', 'mad'],
      happy: ['happy', 'great', 'awesome', 'wonderful', 'excellent', 'fantastic', 'amazing', 'feeling good', 'feel good', 'doing well', 'doing great'],
      confused: ['confused', 'lost', 'don\'t understand', 'don\'t know', 'unclear', 'uncertain'],
      neutral: ['fine', 'okay', 'ok', 'alright', 'good', 'thanks', 'thank you']
    };

    // Detect mood - check upset/frustrated first before happy
    let detectedMood = 'neutral';

    // Priority order: upset, frustrated, confused, happy, neutral
    const moodPriority = ['upset', 'frustrated', 'confused', 'happy', 'neutral'];

    for (const mood of moodPriority) {
      const keywords = moodKeywords[mood];
      if (keywords && keywords.some(keyword => userMessage.includes(keyword))) {
        detectedMood = mood;
        break;
      }
    }

    // Intent detection
    let intent = 'general';
    let reply = '';
    let suggestions = [];
    let quickActions = [];

    // Emergency keywords - HIGHEST PRIORITY
    if (userMessage.includes('emergency') || userMessage.includes('sos') || userMessage.includes('danger') || userMessage.includes('help me') || userMessage.includes('unsafe') || userMessage.includes('threat')) {
      intent = 'emergency';
      reply = '🚨 I understand this is urgent. Your safety is the top priority. You can trigger an Emergency SOS right now that will immediately alert your trusted contacts with your location. They\'ll receive both a phone call and SMS. Do you need immediate help?';
      suggestions = [
        'Trigger Emergency SOS now',
        'Call emergency services (112)',
        'Share your live location with contacts',
        'View emergency contact numbers'
      ];
      quickActions = [
        { label: 'Emergency SOS', action: '/safety' },
        { label: 'Security Directory', action: '/security' },
        { label: 'Add Trusted Contacts', action: '/profile' }
      ];
    }
    // Complaint/Issue
    else if (detectedMood === 'frustrated' || userMessage.includes('complaint') || userMessage.includes('report') || userMessage.includes('issue') || userMessage.includes('problem')) {
      intent = 'complaint';
      reply = 'I\'m sorry you\'re experiencing this. 😔 Your concerns are important to us. I\'m here to help you report this issue. What type of concern would you like to address?';
      suggestions = [
        'Report a safety incident or harassment',
        'Technical issue with the app',
        'Provide feedback or suggestions',
        'Speak with support staff'
      ];
      quickActions = [
        { label: 'Report Incident', action: '/safety' },
        { label: 'Contact Support', action: '/resources' },
        { label: 'Emergency Services', action: '/security' }
      ];
    }
    // Mood/Mental Health - Most important, check first
    else if (detectedMood === 'upset' || userMessage.includes('not feeling') || userMessage.includes('feeling bad') || userMessage.includes('mental health') || userMessage.includes('depressed') || userMessage.includes('anxious')) {
      intent = 'wellness';
      reply = 'I\'m really sorry you\'re going through this. � Your feelings are valid, and it\'s brave of you to reach out. SafeSpace has several resources that might help you feel better. Would you like to explore some options?';
      suggestions = [
        'Talk to a professional counselor',
        'Log your mood to track patterns',
        'Try calming breathing exercises',
        'Read self-help articles for coping strategies',
        'View emergency mental health resources'
      ];
      quickActions = [
        { label: 'Book Counseling Now', action: '/resources' },
        { label: 'Wellness Hub', action: '/wellness' },
        { label: 'Self-Help Guides', action: '/self_guidance' },
        { label: 'Emergency Support', action: '/security' }
      ];
    }
    // Location/Navigation help
    else if (userMessage.includes('location') || userMessage.includes('share') || userMessage.includes('tracking')) {
      intent = 'location';
      reply = '📍 SafeSpace has live location sharing! You can share your real-time location with trusted contacts via SMS. This is great when walking alone at night or in unfamiliar areas.';
      suggestions = [
        'Start location sharing in Safety Hub',
        'Your contacts will receive SMS updates with your location',
        'You can stop sharing anytime'
      ];
      quickActions = [
        { label: 'Start Location Sharing', action: '/safety' }
      ];
    }
    // Profile/Trusted Contacts
    else if (userMessage.includes('profile') || userMessage.includes('trusted contact') || userMessage.includes('add contact') || userMessage.includes('manage contact')) {
      intent = 'profile';
      reply = '👤 Your Profile is where you manage your account and trusted contacts. Trusted contacts are the people who will receive your emergency alerts and location updates.';
      suggestions = [
        'Add trusted contacts with phone numbers',
        'View and manage your emergency contacts',
        'Update your profile information',
        'Your contacts receive alerts during SOS'
      ];
      quickActions = [
        { label: 'Go to Profile', action: '/profile' },
        { label: 'About Trusted Contacts', action: '/safety' }
      ];
    }
    // Security Directory
    else if (userMessage.includes('security') || userMessage.includes('emergency number') || userMessage.includes('police') || userMessage.includes('ambulance') || userMessage.includes('fire')) {
      intent = 'security';
      reply = '🔒 The Security Directory has all important emergency contact numbers including Police, Ambulance, Fire Brigade, and campus security services.';
      suggestions = [
        'View emergency service numbers',
        'Access campus security contacts',
        'Quick dial emergency services',
        'Find nearest help centers'
      ];
      quickActions = [
        { label: 'Open Security Directory', action: '/security' }
      ];
    }
    // Self-Help Guides
    else if (userMessage.includes('self-help') || userMessage.includes('guide') || userMessage.includes('article') || userMessage.includes('learn') || userMessage.includes('tips')) {
      intent = 'selfhelp';
      reply = '📚 Our Self-Help Guides provide educational resources on mental health, stress management, safety tips, and more. Great for learning at your own pace!';
      suggestions = [
        'Mental health articles',
        'Stress management techniques',
        'Safety and awareness tips',
        'Recommended wellness apps'
      ];
      quickActions = [
        { label: 'Browse Self-Help Guides', action: '/self_guidance' }
      ];
    }
    // Wellness Hub specific
    else if (userMessage.includes('mood') || userMessage.includes('track') || userMessage.includes('journal') || userMessage.includes('wellness hub')) {
      intent = 'wellness';
      reply = '� The Wellness Hub helps you track your mood, maintain a mental health journal, and access wellness resources. Regular mood tracking can help you understand patterns and improve well-being.';
      suggestions = [
        'Log your current mood',
        'View mood history and trends',
        'Access breathing exercises',
        'Get personalized wellness tips'
      ];
      quickActions = [
        { label: 'Open Wellness Hub', action: '/wellness' },
        { label: 'Self-Help Resources', action: '/self_guidance' }
      ];
    }
    // Safety Hub specific
    else if (userMessage.includes('safety hub') || userMessage.includes('safety feature') || userMessage.includes('protection')) {
      intent = 'safety';
      reply = '🚨 The Safety Hub is your one-stop for all safety features including Emergency SOS, Live Location Sharing, and quick access to emergency services.';
      suggestions = [
        'Trigger Emergency SOS (calls & SMS your contacts)',
        'Share your live location with trusted contacts',
        'Quick access to emergency numbers',
        'Set up trusted contacts for emergencies'
      ];
      quickActions = [
        { label: 'Go to Safety Hub', action: '/safety' },
        { label: 'Add Trusted Contacts', action: '/profile' }
      ];
    }
    // General navigation/Features
    else if (detectedMood === 'confused' || userMessage.includes('feature') || userMessage.includes('what can') || userMessage.includes('how to') || userMessage.includes('navigate') || userMessage.includes('show me')) {
      intent = 'navigation';
      reply = '👋 Let me show you around SafeSpace! Here are all the features available to keep you safe and supported:';
      suggestions = [
        '🚨 Safety Hub - Emergency SOS & location sharing',
        '💚 Wellness Hub - Mood tracking & mental health',
        '📚 Resources - Book counseling sessions',
        '📖 Self-Help Guides - Educational articles & tips',
        '👤 Profile - Manage trusted contacts',
        '🔒 Security Directory - Emergency contact numbers'
      ];
      quickActions = [
        { label: 'Home', action: '/' },
        { label: 'Safety Hub', action: '/safety' },
        { label: 'Wellness Hub', action: '/wellness' },
        { label: 'Resources', action: '/resources' },
        { label: 'Profile', action: '/profile' }
      ];
    }
    // Counseling/Professional Help
    else if (userMessage.includes('counseling') || userMessage.includes('counselor') || userMessage.includes('therapy') || userMessage.includes('therapist') || userMessage.includes('talk to someone') || userMessage.includes('professional help')) {
      intent = 'counseling';
      reply = '🧑‍⚕️ Seeking professional support is a really positive step! 💙 SafeSpace offers confidential counseling sessions with licensed professionals who are here to listen and help. Sessions are free for enrolled students.';
      suggestions = [
        'Book a 50-minute counseling session',
        'Sessions are completely confidential',
        'Available Monday-Friday, 9 AM - 5 PM',
        'You can also explore self-help resources while waiting'
      ];
      quickActions = [
        { label: 'Book Session Now', action: '/resources' },
        { label: 'Self-Help Resources', action: '/self_guidance' },
        { label: 'Crisis Hotlines', action: '/security' }
      ];
    }
    // Greeting
    else if (userMessage.includes('hello') || userMessage.includes('hi ') || userMessage.includes('hey') || userMessage === 'hi' || userMessage.includes('start')) {
      intent = 'greeting';
      reply = 'Hello! 👋 I\'m your SafeSpace assistant, and I\'m here to support you 24/7. Whether you need safety features, mental health support, or just want to explore the app, I can help guide you. How are you feeling today?';
      suggestions = [
        'I need help right now',
        'Show me wellness resources',
        'What safety features are available?',
        'I want to talk to a counselor'
      ];
      quickActions = [
        { label: 'Safety Hub', action: '/safety' },
        { label: 'Wellness Hub', action: '/wellness' },
        { label: 'Get Support', action: '/resources' }
      ];
    }
    // Positive mood
    else if (detectedMood === 'happy') {
      intent = 'positive';
      reply = 'That\'s wonderful to hear! 😊 I\'m so glad you\'re doing well. It\'s great to check in when you\'re feeling good too. Would you like to log your positive mood or explore ways to maintain your well-being?';
      suggestions = [
        'Log your positive mood for tracking',
        'Learn stress prevention techniques',
        'Explore safety features for peace of mind',
        'Read wellness tips to stay healthy'
      ];
      quickActions = [
        { label: 'Log Mood', action: '/wellness' },
        { label: 'Wellness Tips', action: '/self_guidance' }
      ];
    }
    // Default fallback
    else {
      intent = 'general';
      reply = 'I\'m here to support you! 💙 SafeSpace has many features to keep you safe and help you feel better. I can help you with:\n\n🚨 Emergency alerts & safety\n💚 Mental health & wellness\n📞 Counseling & professional help\n📍 Location sharing\n📚 Self-help resources\n\nWhat would you like to explore?';
      suggestions = [
        'I\'m not feeling well',
        'Show me safety features',
        'I need someone to talk to',
        'How do I add emergency contacts?'
      ];
      quickActions = [
        { label: 'Safety Hub', action: '/safety' },
        { label: 'Wellness Hub', action: '/wellness' },
        { label: 'Get Help', action: '/resources' },
        { label: 'Home', action: '/' }
      ];
    }

    res.json({
      success: true,
      reply,
      intent,
      mood: detectedMood,
      suggestions,
      quickActions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Chatbot error:', error);
    res.status(500).json({
      success: false,
      reply: 'Sorry, I encountered an error. Please try again.',
      intent: 'error',
      mood: 'neutral'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SafeSpace Backend is running',
    twilioConfigured: !!twilioClient,
    timestamp: new Date().toISOString(),
    features: {
      emergencyCallAndSMS: twilioClient ? 'enabled' : 'disabled (needs Twilio)',
      locationSharing: twilioClient ? 'enabled' : 'disabled (needs Twilio)',
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SafeSpace Emergency API',
    version: '3.0.0',
    description: 'Emergency SOS makes automated call and sends SMS to emergency services. Location sharing sends SMS to trusted contacts.',
    endpoints: {
      emergencyCallAndSMS: 'POST /api/emergency/call-and-sms - Automated call & SMS to emergency number',
      notifyTrustedContacts: 'POST /api/emergency/notify-contacts - Notify trusted contacts during SOS',
      locationShareStart: 'POST /api/location/share/start - Start sharing location via SMS',
      locationUpdate: 'POST /api/location/update - Update location via SMS',
      locationShareStop: 'POST /api/location/share/stop - Stop sharing location',
      health: 'GET /api/health - Check server status'
    },
    twilioStatus: twilioClient ? '✅ Configured' : '⚠️ Not Configured'
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ SafeSpace Backend Server Running`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🚨 Emergency Call & SMS: http://localhost:${PORT}/api/emergency/call-and-sms`);
  console.log(`📍 Location API: http://localhost:${PORT}/api/location/share/start`);
  console.log(`💬 Twilio Status: ${twilioClient ? '✅ Enabled' : '⚠️ Disabled (add credentials to .env)'}`);
  console.log('');
  console.log('📋 FEATURE OVERVIEW:');
  console.log('   🚨 Emergency SOS → Automated call + SMS to 124');
  console.log('   📍 Location Sharing → SMS to trusted contacts');
  console.log('═══════════════════════════════════════════════════');
});
