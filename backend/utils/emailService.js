import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Shared transporter instance with pooling to prevent "Too many login attempts" (454) errors
let sharedTransporter = null;

/**
 * Initialize or return the shared transporter
 */
const getTransporter = () => {
  if (sharedTransporter) return sharedTransporter;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP credentials missing in .env. Email service will be limited.');
    return null;
  }

  sharedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT) === 465,
    pool: true, // IMPORTANT: Use connection pooling to reuse sessions
    maxConnections: 3, // Limit total concurrent connections
    maxMessages: 100, // Max messages per connection before closing
    rateLimit: 5, // Limit messages per second
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || "dmta pxpu obrp elij",
    },
  });

  return sharedTransporter;
};

/**
 * Send Professional MOU Email
 * @param {Object} options - { to, candidateName, applicationNo, marks, mouStart, mouEnd }
 */
export const sendMOUEmail = async (options) => {
  try {
    const { to, candidateName, applicationNo, marks, mouStart, mouEnd } = options;
    const transporter = getTransporter();

    if (!transporter) {
      return { success: false, error: 'Email configuration missing' };
    }

    const logoPath = path.resolve(__dirname, '../../admin/src/assets/img0.png');

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #D9F99D; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #3F6212; background-image: linear-gradient(100deg, #3F6212 0%, #4D7C0F 55%, #65A30D 100%); padding: 24px 20px; text-align: center;">
          <div style="display: inline-block; background-color: #ffffff; border-radius: 10px; padding: 8px 14px;">
            <img src="cid:jssalogo" alt="JSSA Logo" style="max-height: 60px; display: block;" />
          </div>
          <h1 style="color: #ffffff; margin: 14px 0 4px; font-size: 21px; letter-spacing: 0.5px; font-weight: 700;">जन स्वास्थ्य सहायता अभियान</h1>
          <p style="color: #ffffff; margin: 0; font-size: 14px; opacity: 0.92;">Jan Swasthya Sahayta Abhiyan</p>
        </div>

        <div style="padding: 30px; color: #1f2d3d; line-height: 1.6;">
          <p style="font-size: 16px; font-weight: bold; margin-bottom: 5px; color: #1A2E05;">Dear ${candidateName},</p>
          <p style="font-size: 16px; font-weight: bold; margin-top: 0; color: #1A2E05;">प्रिय ${candidateName},</p>

          <p style="font-size: 19px; color: #4D7C0F; font-weight: bold; margin-bottom: 0;">Congratulations! / बधाई हो!</p>

          <p style="margin-top: 10px;">
            We are pleased to inform you that you have <strong>PASSED</strong> in JAN SWASTHYA SAHAYTA ABHIYAN (JSSA).<br/>
            हमें आपको सूचित करते हुए खुशी हो रही है कि आपने जन स्वास्थ्य सहायता अभियान (JSSA) में <strong>उत्तीर्ण (PASS)</strong> प्राप्त किया है।
          </p>

          <div style="background-color: #F7FEE7; border: 1px solid #D9F99D; border-left: 5px solid #4D7C0F; padding: 18px 20px; margin: 25px 0; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #5d7088; font-size: 13px; border-bottom: 1px solid #e3ecf7;">
                  Application No / आवेदन संख्या:
                </td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #1A2E05; border-bottom: 1px solid #e3ecf7;">
                  ${applicationNo}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #5d7088; font-size: 13px; border-bottom: 1px solid #e3ecf7;">
                  Marks Obtained / प्राप्त अंक:
                </td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #1A2E05; border-bottom: 1px solid #e3ecf7;">
                  ${marks}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #5d7088; font-size: 13px; border-bottom: 1px solid #e3ecf7;">
                  MOU Process Start Date / MOU प्रारंभ तिथि:
                </td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #4D7C0F; border-bottom: 1px solid #e3ecf7;">
                  ${mouStart}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #5d7088; font-size: 13px;">
                  MOU Process End Date / MOU अंतिम तिथि:
                </td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #d32f2f;">
                  ${mouEnd}
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px;">
            Please login to your panel/dashboard to complete the <strong>MOU process</strong> within the given time.<br/>
            MOU प्रक्रिया को निर्धारित समय के भीतर पूरा करने के लिए कृपया अपने पैनल/डैशबोर्ड पर लॉगिन करें।
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="https://jssabhiyan.com" style="background-color: #4D7C0F; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; letter-spacing: 0.5px; font-size: 15px;">Dashboard Login / लॉगिन करें</a>
          </div>

          <p style="font-size: 12px; color: #6b7d93; font-style: italic; border-top: 1px solid #e3ecf7; padding-top: 12px; margin-top: 30px;">
            *This is an automated message. Please do not reply to this email.<br/>
            यह एक स्वचालित संदेश है। कृपया इस ईमेल का उत्तर न दें।
          </p>
        </div>

        <div style="background-color: #1A2E05; padding: 18px 20px; text-align: center; font-size: 11px; color: #D9F99D;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Jan Swasthya Sahayta Abhiyan (JSSA). All Rights Reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"JSSA Support" <${process.env.SMTP_USER}>`,
      to: to,
      subject: 'Congratulations! You have PASSED in JAN SWASTHYA SAHAYTA ABHIYAN',
      html: htmlContent,
      attachments: [{
        filename: 'jssa-logo.png',
        path: logoPath,
        cid: 'jssalogo' // same cid value as in the html img src
      }]
    };

    console.log(`📧 Sending MOU success email to ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    if (error.message.includes('454')) {
      console.error('❌ SMTP Error: Too many login attempts. Connection pooling is enabled, but server may need time to reset.');
    } else {
      console.error('❌ Email Service Error:', error.message);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Send Exam Assignment Email
 * @param {Object} options - { to, candidateName, startDate, endDate }
 */
export const sendExamAssignmentEmail = async (options) => {
  try {
    const { to, candidateName, startDate, endDate } = options;
    const transporter = getTransporter();

    if (!transporter) {
      return { success: false, error: 'Email configuration missing' };
    }

    const logoPath = path.resolve(__dirname, '../../admin/src/assets/img0.png');

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #D9F99D; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #3F6212; background-image: linear-gradient(100deg, #3F6212 0%, #4D7C0F 55%, #65A30D 100%); padding: 24px 20px; text-align: center; color: #ffffff;">
          <div style="display: inline-block; background-color: #ffffff; border-radius: 10px; padding: 8px 14px;">
            <img src="cid:jssalogo" alt="Logo" style="max-height: 60px; display: block;" />
          </div>
          <h2 style="color: #ffffff; margin: 14px 0 0; font-size: 20px; letter-spacing: 0.5px;">JAN SWASTHYA SAHAYTA ABHIYAN</h2>
        </div>
        <div style="padding: 30px; color: #1f2d3d; line-height: 1.6;">
          <p style="color: #1A2E05;">Dear <strong>${candidateName}</strong>,</p>
          <p>Your exam for <strong>JAN SWASTHYA SAHAYTA ABHIYAN</strong> has been scheduled.</p>
          <div style="background-color: #F7FEE7; border: 1px solid #D9F99D; border-left: 5px solid #4D7C0F; padding: 15px 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 5px 0; color: #1A2E05;"><strong>Start Date:</strong> ${startDate}</p>
            <p style="margin: 5px 0; color: #1A2E05;"><strong>End Date:</strong> ${endDate}</p>
          </div>
          <p>Please login to your dashboard to appear in the exam and submit it within the given time.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://jssabhiyan.com" style="background-color: #4D7C0F; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">Login to Dashboard</a>
          </div>
        </div>
        <div style="background-color: #1A2E05; height: 8px; line-height: 8px; font-size: 0;">&nbsp;</div>
      </div>
    `;

    const mailOptions = {
      from: `"JSSA Support" <${process.env.SMTP_USER}>`,
      to: to,
      subject: 'Exam Scheduled: JAN SWASTHYA SAHAYTA ABHIYAN',
      html: htmlContent,
      attachments: [{
        filename: 'logo.png',
        path: logoPath,
        cid: 'jssalogo'
      }]
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    if (error.message.includes('454')) {
      console.error('❌ SMTP Error: Too many login attempts.');
    } else {
      console.error('❌ Email Notification Error:', error.message);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Send Meeting Invitation Email
 * @param {Object} options - { to, participantName, title, type, scheduledFor, senderName }
 */
export const sendMeetingInvitationEmail = async (options) => {
  try {
    const { to, participantName, title, type, scheduledFor, senderName } = options;
    const transporter = getTransporter();

    if (!transporter) {
      return { success: false, error: 'Email configuration missing' };
    }

    const logoPath = path.resolve(__dirname, '../../admin/src/assets/img0.png');

    const formattedDate = scheduledFor ? new Date(scheduledFor).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Instant / अभी';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #D9F99D; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #3F6212; background-image: linear-gradient(100deg, #3F6212 0%, #4D7C0F 55%, #65A30D 100%); padding: 24px 20px; text-align: center;">
          <div style="display: inline-block; background-color: #ffffff; border-radius: 10px; padding: 8px 14px;">
            <img src="cid:jssalogo" alt="JSSA Logo" style="max-height: 60px; display: block;" />
          </div>
          <h1 style="color: #ffffff; margin: 14px 0 4px; font-size: 21px; letter-spacing: 0.5px; font-weight: 700;">जन स्वास्थ्य सहायता अभियान</h1>
          <p style="color: #ffffff; margin: 0; font-size: 14px; opacity: 0.92;">Jan Swasthya Sahayta Abhiyan</p>
        </div>

        <div style="padding: 30px; color: #1f2d3d; line-height: 1.6;">
          <p style="font-size: 16px; font-weight: bold; margin-bottom: 5px; color: #1A2E05;">Dear ${participantName},</p>
          <p style="font-size: 16px; font-weight: bold; margin-top: 0; color: #1A2E05;">प्रिय ${participantName},</p>

          <p style="font-size: 19px; color: #4D7C0F; font-weight: bold; margin-bottom: 20px;">Meeting Invitation / मीटिंग आमंत्रण</p>

          <p>
            You have been invited to a meeting by <strong>${senderName}</strong>.<br/>
            आपको <strong>${senderName}</strong> द्वारा एक मीटिंग में आमंत्रित किया गया है।
          </p>

          <div style="background-color: #F7FEE7; border: 1px solid #D9F99D; border-left: 5px solid #4D7C0F; padding: 18px 20px; margin: 25px 0; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #5d7088; font-size: 13px;">Meeting Title / मीटिंग का नाम:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #1A2E05;">${title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #5d7088; font-size: 13px;">Meeting Type / मीटिंग का प्रकार:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #1A2E05; text-transform: capitalize;">${type} Meet</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #5d7088; font-size: 13px;">Scheduled For / निर्धारित समय:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #4D7C0F;">${formattedDate}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; text-align: center; background: #fff8e1; padding: 10px; border: 1px dashed #ffc107; margin: 20px 0;">
            Please login to your dashboard to join the meeting.<br/>
            मीटिंग में शामिल होने के लिए कृपया अपने डैशबोर्ड पर लॉगिन करें।
          </p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="https://jssabhiyan.com" style="background-color: #4D7C0F; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; letter-spacing: 0.5px; font-size: 15px;">Login to Dashboard / लॉगिन करें</a>
          </div>

          <p style="font-size: 12px; color: #6b7d93; font-style: italic; border-top: 1px solid #e3ecf7; padding-top: 12px; margin-top: 30px;">
            *This is an automated message. Please do not reply to this email.<br/>
            यह एक स्वचालित संदेश है। कृपया इस ईमेल का उत्तर न दें।
          </p>
        </div>

        <div style="background-color: #1A2E05; padding: 18px 20px; text-align: center; font-size: 11px; color: #D9F99D;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Jan Swasthya Sahayta Abhiyan (JSSA). All Rights Reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"JSSA Support" <${process.env.SMTP_USER}>`,
      to: to,
      subject: `Meeting Invitation: ${title}`,
      html: htmlContent,
      attachments: [{
        filename: 'jssa-logo.png',
        path: logoPath,
        cid: 'jssalogo'
      }]
    };

    console.log(`📧 Sending meeting invitation email to ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Meeting Email Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Meeting Reminder Email
 * @param {Object} options - { to, participantName, title, type, scheduledFor, senderName }
 */
export const sendMeetingReminderEmail = async (options) => {
  try {
    const { to, participantName, title, type, scheduledFor, senderName } = options;
    const transporter = getTransporter();

    if (!transporter) {
      return { success: false, error: 'Email configuration missing' };
    }

    const logoPath = path.resolve(__dirname, '../../admin/src/assets/img0.png');

    const formattedDate = scheduledFor ? new Date(scheduledFor).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Instant / अभी';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #D9F99D; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #3F6212; background-image: linear-gradient(100deg, #3F6212 0%, #4D7C0F 55%, #65A30D 100%); padding: 24px 20px; text-align: center;">
          <div style="display: inline-block; background-color: #ffffff; border-radius: 10px; padding: 8px 14px;">
            <img src="cid:jssalogo" alt="JSSA Logo" style="max-height: 60px; display: block;" />
          </div>
          <h1 style="color: #ffffff; margin: 14px 0 4px; font-size: 21px; letter-spacing: 0.5px; font-weight: 700;">जन स्वास्थ्य सहायता अभियान</h1>
          <p style="color: #ffffff; margin: 0; font-size: 14px; opacity: 0.92;">Jan Swasthya Sahayta Abhiyan</p>
        </div>

        <div style="padding: 30px; color: #1f2d3d; line-height: 1.6;">
          <p style="font-size: 16px; font-weight: bold; margin-bottom: 5px; color: #1A2E05;">Dear ${participantName},</p>
          <p style="font-size: 16px; font-weight: bold; margin-top: 0; color: #1A2E05;">प्रिय ${participantName},</p>

          <p style="font-size: 18px; color: #d32f2f; font-weight: bold; margin-bottom: 20px;">Meeting Reminder / मीटिंग रिमाइंडर</p>

          <p>
            You are missing an ongoing meeting. <strong>${senderName}</strong> is waiting for you.<br/>
            आप एक चल रही मीटिंग में शामिल नहीं हुए हैं। <strong>${senderName}</strong> आपका इंतज़ार कर रहे हैं।
          </p>

          <div style="background-color: #fff9f9; border: 1px solid #f5d0d0; border-left: 5px solid #d32f2f; padding: 18px 20px; margin: 25px 0; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #5d7088; font-size: 13px;">Meeting Title / मीटिंग का नाम:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #1A2E05;">${title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #5d7088; font-size: 13px;">Scheduled For / निर्धारित समय:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #d32f2f;">${formattedDate}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; text-align: center; background: #fff8e1; padding: 10px; border: 1px dashed #ffc107; margin: 20px 0;">
            Please join the meeting immediately via your dashboard.<br/>
            कृपया अपने डैशबोर्ड के माध्यम से तुरंत मीटिंग में शामिल हों।
          </p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="https://jssabhiyan.com" style="background-color: #4D7C0F; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; letter-spacing: 0.5px; font-size: 15px;">Join Meeting Now / अभी शामिल हों</a>
          </div>

          <p style="font-size: 12px; color: #6b7d93; font-style: italic; border-top: 1px solid #e3ecf7; padding-top: 12px; margin-top: 30px;">
            *This is an automated message. Please do not reply to this email.<br/>
            यह एक स्वचालित संदेश है। कृपया इस ईमेल का उत्तर न दें।
          </p>
        </div>

        <div style="background-color: #1A2E05; padding: 18px 20px; text-align: center; font-size: 11px; color: #D9F99D;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Jan Swasthya Sahayta Abhiyan (JSSA). All Rights Reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"JSSA Support" <${process.env.SMTP_USER}>`,
      to: to,
      subject: `Urgent Reminder: Meeting Started - ${title}`,
      html: htmlContent,
      attachments: [{
        filename: 'jssa-logo.png',
        path: logoPath,
        cid: 'jssalogo'
      }]
    };

    console.log(`📧 Sending meeting reminder email to ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Reminder Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Meeting Reminder Email Error:', error.message);
    return { success: false, error: error.message };
  }
};
