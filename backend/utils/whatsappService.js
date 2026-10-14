import axios from "axios";

/**
 * WhatsApp Service for JSSA
 * Uses third-party WhatsApp Business API Provider
 */

const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || "ff6f8792-24f2-11f1-894a-02c8a5e042bd";
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || "997756246761783";
const WHATSAPP_API_URL = "https://apibot.msg2z.in/v3/";

/**
 * Send MOU Success Notification via WhatsApp
 * Template: mou_process_notification
 * Placeholders: 1,2 (App ID), 3,4 (Start Date), 5,6 (End Date)
 */
export const sendMOUProcessWhatsApp = async (mobile, candidateName, appId, startDate, endDate, templateName = "mou_process_notification") => {
  try {
    console.log(`🟢 Sending WhatsApp (${templateName}) to ${candidateName} (${mobile})...`);

    // Ensure mobile has 91 prefix if not present
    const formattedMobile = mobile.length === 10 ? `91${mobile}` : mobile;

    // According to Msg2z V3 Documentation (Point #8: Send Text Template Message)
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedMobile,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en" // As seen in screenshot
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: appId },     // {{1}} Application Number (EN)
              { type: "text", text: appId },     // {{2}} Application Number (HI)
              { type: "text", text: startDate }, // {{3}} MOU Start Date (EN)
              { type: "text", text: startDate }, // {{4}} MOU Start Date (HI)
              { type: "text", text: endDate },   // {{5}} MOU End Date (EN)
              { type: "text", text: endDate }    // {{6}} MOU End Date (HI)
            ]
          }
        ]
      }
    };

    // Correct URL for msg2z v3 requires Phone Number ID in path and /messages at end
    const requestUrl = `${WHATSAPP_API_URL}${WHATSAPP_PHONE_ID}/messages`;

    // Debug logs to verify configuration
    console.log(`📡 WhatsApp API Hit Request:`);
    console.log(`   - URL: ${requestUrl}`);
    console.log(`   - API Key: ${WHATSAPP_API_KEY ? `${WHATSAPP_API_KEY.substring(0, 5)}...` : "MISSING"}`);
    console.log(`   - Phone ID: ${WHATSAPP_PHONE_ID}`);
    console.log(`   - Payload:`, JSON.stringify(payload, null, 2));

    const response = await axios.post(requestUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "apikey": WHATSAPP_API_KEY,
        "User-Agent": "Axios/1.6.0",
        "Origin": "https://apibot.msg2z.in"
      }
    });


    // Documentation shows messages array in successful response
    if (response.data.messages || response.data.success) {
      console.log(`✅ WhatsApp sent successfully to ${mobile}`);
      return { success: true, data: response.data };
    } else {
      console.error(`❌ WhatsApp API Error:`, response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error(`❌ WhatsApp Request Failed:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Exam Assignment Notification via WhatsApp
 * Template: exam_notification
 * Placeholders: 1,2 (App ID), 3,4 (Start Date), 5,6 (End Date)
 */
export const sendExamAssignmentWhatsApp = async (mobile, appId, startDate, endDate) => {
  return sendMOUProcessWhatsApp(mobile, "Candidate", appId, startDate, endDate, "exam_notification");
};
