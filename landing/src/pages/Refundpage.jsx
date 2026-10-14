import React from "react";
import { useLandingConfig } from "../context/LandingConfigContext";

export default function RefundPage({ onNavigate }) {
  const { landingConfig } = useLandingConfig();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      <style>{`
        .refund-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 48px 60px 48px;
        }
        .refund-para {
          font-size: 16px;
          line-height: 1.85;
          color: #111827;
          margin: 0 0 20px 0;
          padding: 0;
        }
        .refund-contact-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 24px 0 12px 0;
        }
        .refund-contact-item {
          font-size: 16px;
          line-height: 1.85;
          color: #111827;
          margin: 0 0 4px 0;
        }
        @media (max-width: 768px) {
          .refund-wrap {
            padding: 20px 14px 40px 14px;
          }
          .refund-para {
            font-size: 10px;
            line-height: 1.7;
            margin: 0 0 14px 0;
          }
          .refund-contact-title {
            font-size: 10px;
            margin: 16px 0 8px 0;
          }
          .refund-contact-item {
            font-size: 10px;
            line-height: 1.7;
          }
        }
      `}</style>

      <div className="refund-wrap">
        <p className="refund-para">
          1.If the volenteer/fee payer/donor feels that he/she has made any
          error in the fees/donation amount/purpose or any other parameter,
          please inform NIRMANBHARAT ASSISTANCE COUNCIL about such error within
          24 hours by ernail &amp; call. We will improve any such parameters you
          request whenever possible
        </p>

        <p className="refund-para">
          2.If you wish to cancel the application/donation/other services,
          please let us know within 24 hours after submitting the fees/donation
          amount. We will refund your fees/donation &amp; Your
          application/donation/other services will be automatically canceled
          after refund of fees.
        </p>

        <p className="refund-para">
          3.If you wish to refund the application fee/donation/any other fees
          for any reason, you must inform us with proper proof of payment on our
          email and contact number within 24 hours of submission of fee. Your
          payment will be refunded within T+7 days if found correct after
          verification by our team.
        </p>

        <p className="refund-para">
          <strong>Note:</strong> For refund of application fee/donation /any
          other fees you have to inform us on email or contact number within 24
          hours of deposit of fee. If you notify us after 24 hours, no fees will
          be refunded to you.
        </p>

        <p className="refund-contact-title">
          Contact Details For Refund &amp; Cancellation:
        </p>

        {landingConfig?.contactUs?.phones?.map((phone, idx) => (
          <p className="refund-contact-item" key={`phone-${idx}`}>
            Helpline No.{idx + 1} : {phone}
          </p>
        ))}
       
        {landingConfig?.contactUs?.emails?.map((email, idx) => (
          <p className="refund-contact-item" key={`email-${idx}`}>
            Email : {email}
          </p>
        ))}
      </div>
    </div>
  );
}
