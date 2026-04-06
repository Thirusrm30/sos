const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || 'YOUR_FAST2SMS_API_KEY_HERE';
const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

const isValidPhone = (phone) => {
  const cleaned = String(phone).replace(/[\s\-\(\)]/g, '');
  return /^[0-9]{10,15}$/.test(cleaned);
};

const formatPhone = (phone) => {
  return String(phone).replace(/[\s\-\(\)]/g, '').slice(-10);
};

const sendSMS = async (phoneNumber, message, route = 'promotional') => {
  if (FAST2SMS_API_KEY === 'YOUR_FAST2SMS_API_KEY_HERE' || !FAST2SMS_API_KEY) {
    console.log('⚠️ SMS NOT SENT - Fast2SMS API Key not configured');
    console.log('📱 Would have sent to:', phoneNumber);
    console.log('💬 Message:', message);
    return { success: false, error: 'API Key not configured' };
  }

  if (!isValidPhone(phoneNumber)) {
    console.log('⚠️ Invalid phone number:', phoneNumber);
    return { success: false, error: 'Invalid phone number' };
  }

  try {
    const response = await fetch(FAST2SMS_URL, {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: route,
        variables_values: message,
        numbers: formatPhone(phoneNumber),
        flash: 0
      })
    });

    const data = await response.json();

    if (data.return === true) {
      console.log('✅ SMS sent successfully to', phoneNumber);
      return { success: true, data };
    } else {
      console.log('❌ SMS failed:', data.message || data.error);
      return { success: false, error: data.message || data.error };
    }
  } catch (error) {
    console.error('❌ SMS Error:', error);
    return { success: false, error: error.message };
  }
};

const sendEmergencySMS = async (lat, lng, customMessage = null, userId = null) => {
  const locationUrl = `https://maps.google.com/?q=${lat},${lng}`;
  const message = customMessage || `HELP! I may be in danger. Location: ${locationUrl}`;

  console.log('🚨 Emergency SMS - Message:', message);

  let contacts = [
    { phone: '9999999999', name: 'Emergency' },
    { phone: '8888888888', name: 'Backup' }
  ];

  if (userId) {
    try {
      const user = await User.findOne({ userId });
      if (user && user.emergencyContacts && user.emergencyContacts.length > 0) {
        contacts = user.emergencyContacts.filter(c => c.phone);
      }
    } catch (error) {
      console.error('Error fetching user contacts:', error);
    }
  }

  const results = [];
  for (const contact of contacts) {
    const result = await sendSMS(contact.phone, message, 'transactional');
    results.push({ phone: contact.phone, ...result });
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`📊 SMS Results: ${successCount}/${results.length} sent successfully`);

  return results;
};

const sendRideShareSMS = async (lat, lng, vehicleNumber, vehicleType, driverName, contacts) => {
  const locationUrl = `https://maps.google.com/?q=${lat},${lng}`;
  const message = `🚗 RIDE ALERT\nVehicle: ${vehicleNumber}\nType: ${vehicleType}\nDriver: ${driverName}\nLocation: ${locationUrl}`;

  const results = [];
  for (const contact of contacts) {
    const result = await sendSMS(contact.phone, message, 'promotional');
    results.push({ phone: contact.phone, ...result });
  }

  return results;
};

const sendOverdueAlertSMS = async (lat, lng, tripId) => {
  const locationUrl = `https://maps.google.com/?q=${lat},${lng}`;
  const message = `🚨 URGENT! User has not checked in.\nTrip ID: ${tripId}\nLast Location: ${locationUrl}`;

  let contacts = [
    { phone: '9999999999', name: 'Emergency' }
  ];

  try {
    const user = await User.findOne({ userId: tripId });
    if (user && user.emergencyContacts && user.emergencyContacts.length > 0) {
      contacts = user.emergencyContacts.filter(c => c.phone);
    }
  } catch (error) {
    console.error('Error fetching user for overdue alert:', error);
  }

  const results = [];
  for (const contact of contacts) {
    const result = await sendSMS(contact.phone, message, 'transactional');
    results.push({ phone: contact.phone, ...result });
  }

  return results;
};

module.exports = {
  sendSMS,
  sendEmergencySMS,
  sendRideShareSMS,
  sendOverdueAlertSMS,
  isValidPhone,
  formatPhone
};
