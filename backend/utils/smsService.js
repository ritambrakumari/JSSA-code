import axios from 'axios';

/**
 * Send SMS using Nimbus IT API
 * @param {string} phone - 10 digit mobile number
 * @param {string} message - SMS message content
 * @param {string} templateId - Template ID for DLT
 */
export const sendSMS = async (phone, message, templateId) => {
  try {
    const {
      NIMBUS_USER_ID,
      NIMBUS_AUTH_KEY,
      NIMBUS_SENDER_ID,
      NIMBUS_ENTITY_ID,
    } = process.env;

    if (!NIMBUS_USER_ID || !NIMBUS_AUTH_KEY) {
      console.error('Nimbus SMS credentials missing in .env');
      return { success: false, error: 'SMS service configuration missing' };
    }

    // Nimbus API URL
    const url = 'http://nimbusit.net/api/pushsms';

    const params = {
      user: NIMBUS_USER_ID,
      authkey: NIMBUS_AUTH_KEY,
      mobile: phone,
      text: message,
      sender: NIMBUS_SENDER_ID,
      entityid: NIMBUS_ENTITY_ID,
      templateid: templateId,
      rpt: 1
    };

    console.log(`[SMS] Sending to ${phone}...`);
    console.log(`[SMS] Template ID: ${templateId}`);

    const response = await axios.get(url, { params });
    const responseData = response.data;
    console.log(`[SMS] Response from ${phone}:`, responseData);

    // Handle string, JSON object or any truthy response since user confirmed OTP is received
    // Many SMS gateways return simple success strings like "SENT", "OK", "Success", or numeric IDs
    const isSuccess =
      (typeof responseData === 'string' && (
        responseData.toLowerCase().includes('ok') ||
        responseData.toLowerCase().includes('sent') ||
        responseData.toLowerCase().includes('success') ||
        /^\d+$/.test(responseData.trim()) // Numeric ID
      )) ||
      (responseData && (
        responseData.STATUS === 'SUCCESS' ||
        responseData.status === 'success' ||
        (responseData.RESPONSE && (responseData.RESPONSE.CODE === '200' || responseData.RESPONSE.CODE === '100'))
      ));

    if (isSuccess || response.status === 200) {
      return { success: true, data: responseData };
    } else {
      console.error('Nimbus SMS API Failure Structure:', responseData);
      return { success: false, error: responseData };
    }
  } catch (error) {
    console.error('SMS Service Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP using Nimbus IT
 * @param {string} phone - 10 digit mobile number
 * @param {string} otp - The OTP code
 */
export const sendOTP = async (phone, otp) => {
  // New template based on user input
  console.log(`[OTP] Preparing to send OTP to ${phone}`);

  // Local testing: OTP_CONSOLE_MODE=true in backend .env prints the OTP in this
  // terminal instead of sending an SMS. Never active when NODE_ENV=production.
  if (process.env.NODE_ENV !== "production" && process.env.OTP_CONSOLE_MODE === "true") {
    console.log("\n==============================");
    console.log(`  [DEV OTP] ${phone}  ->  ${otp}`);
    console.log("==============================\n");
    return { success: true, data: "OTP printed to console (OTP_CONSOLE_MODE)" };
  }

  const message = `Dear User, Your OTP for verification in JAN SWASTHYA SAHAYTA ABHIYAN is ${otp}. Please do not share this OTP with anyone for security reasons. This OTP is valid for 10 minutes only.`;
  const result = await sendSMS(phone, message, process.env.NIMBUS_TEMPLATE_ID);
  console.log(`[OTP] Send result for ${phone}:`, result.success ? "SUCCESS" : "FAILED", result.error || "");
  return result;
};

/**
 * Send Exam Assignment SMS
 * @param {string} phone - 10 digit mobile number
 * @param {string} startDate - Exam start date
 * @param {string} endDate - Exam end date
 */
export const sendExamAssignmentSMS = async (phone, startDate, endDate) => {
  const templateId = process.env.NIMBUS_EXAM_TEMPLATE_ID || '1107177519669063707';
  // EXACT TEMPLATE FROM USER:
  // Dear Candidate, your exam for JAN SWASTHYA SAHAYTA ABHIYAN has been scheduled. Start Date: {#var#} | End Date: {#var#} Please login to your dashboard to appear in the exam and submit it within the given time.
  const message = `Dear Candidate, your exam for JAN SWASTHYA SAHAYTA ABHIYAN has been scheduled. Start Date: ${startDate} | End Date: ${endDate} Please login to your dashboard to appear in the exam and submit it within the given time.`;
  return await sendSMS(phone, message, templateId);
};

/**
 * Send Application Success SMS
 * @param {string} phone - 10 digit mobile number
 * @param {string} applicationNo - Application number
 */
export const sendApplicationSuccessSMS = async (phone, applicationNo) => {
  const templateId = process.env.NIMBUS_APPLICATION_SUCCESS_TEMPLATE_ID || '1107177519662045718';
  console.log(`[SMS] Preparing to send application success SMS to ${phone}`);
  const message = `Dear Applicant, your application has been successfully submitted in JAN SWASTHYA SAHAYTA ABHIYAN. Your Application No. is ${applicationNo}. You can login to your dashboard to check status and further updates.`;
  const result = await sendSMS(phone, message, templateId);
  console.log(`[SMS] Application success SMS result for ${phone}:`, result.success ? "SUCCESS" : "FAILED", result.error || "");
  return result;
};

/**
 * Send Exam Pass SMS
 * @param {string} phone - 10 digit mobile number
 * @param {string} applicationNo - Application number
 * @param {number|string} marks - Marks obtained
 * @param {string} mouStart - MOU Process Start Date
 * @param {string} mouEnd - MOU Process End Date
 */
export const sendExamPassSMS = async (phone, applicationNo, marks, mouStart, mouEnd) => {
  const templateId = process.env.NIMBUS_EXAM_PASS_TEMPLATE_ID || '1107177519698488893';
  console.log(`[SMS] Preparing to send exam pass SMS to ${phone}`);

  // EXACT TEMPLATE:
  // Dear Candidate, congratulations! You have PASSED in JAN SWASTHYA SAHAYTA ABHIYAN. Application No: {#var#} Marks Obtained: {#var#} MOU Process Start Date: {#var#} | End Date: {#var#} Please login to your panel/dashboard to complete the MOU process within the given time.
  const message = `Dear Candidate, congratulations! You have PASSED in JAN SWASTHYA SAHAYTA ABHIYAN. Application No: ${applicationNo} Marks Obtained: ${marks} MOU Process Start Date: ${mouStart} | End Date: ${mouEnd} Please login to your panel/dashboard to complete the MOU process within the given time.`;

  const result = await sendSMS(phone, message, templateId);
  console.log(`[SMS] Exam pass SMS result for ${phone}:`, result.success ? "SUCCESS" : "FAILED", result.error || "");
  return result;
};

/**
 * Send Meeting Invitation SMS
 * @param {string} phone - 10 digit mobile number
 * @param {string} name - Participant name
 */
export const sendMeetingSMS = async (phone, name) => {
  const templateId = process.env.NIMBUS_MEETING_TEMPLATE_ID || '1107177867478269851';
  console.log(`[SMS] Preparing to send meeting invitation SMS to ${phone}`);

  // TEMPLATE: Dear {#var#}, Your meeting has started. Please log in to your dashboard on the Jan Swasthya Sahayatha Abhiyan portal using your details and join the meeting. Thank You.
  const message = `Dear ${name}, Your meeting has started. Please log in to your dashboard on the Jan Swasthya Sahayatha Abhiyan portal using your details and join the meeting. Thank You.`;

  const result = await sendSMS(phone, message, templateId);
  console.log(`[SMS] Meeting SMS result for ${phone}:`, result.success ? "SUCCESS" : "FAILED", result.error || "");
  return result;
};
