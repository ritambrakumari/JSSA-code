const axios = require('axios');
require('dotenv').config();

const phone = '9924718512';
const message = 'Dear Member, Welcome to JAN SWASTHYA SAHAYATA ABHIYAN. Your healthcare benefits are now available. Please log in to your account and take advantage of the Online Doctor Consultation service from the comfort of your home. Login now and access your health services anytime. -JAN SWASTHYA SAHAYATA ABHIYAN';
const templateId = '1107178281618196510';

const params = {
  user: process.env.NIMBUS_USER_ID,
  authkey: process.env.NIMBUS_AUTH_KEY,
  mobile: phone,
  text: message,
  sender: process.env.NIMBUS_SENDER_ID,
  entityid: process.env.NIMBUS_ENTITY_ID,
  templateid: templateId,
  rpt: 1
};

axios.get('http://nimbusit.net/api/pushsms', { params })
  .then(res => console.log('RESPONSE:', res.data))
  .catch(err => console.error('ERROR:', err.response ? err.response.data : err.message));
