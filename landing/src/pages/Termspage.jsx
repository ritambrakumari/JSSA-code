import React, { useEffect } from "react";

export default function TermsPage({ onNavigate }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      <style>{`
        .terms-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 48px 60px 48px;
        }
        .terms-section-title {
          font-size: 22px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 16px 0;
        }
        .terms-para {
          font-size: 16px;
          font-weight: 400;
          line-height: 1.85;
          color: #111827;
          margin: 0 0 16px 0;
          padding: 0;
        }
        .terms-section-gap {
          margin-top: 36px;
        }
        @media (max-width: 768px) {
          .terms-wrap {
            padding: 20px 14px 40px 14px;
          }
          .terms-section-title {
            font-size: 14px;
            margin: 0 0 10px 0;
          }
          .terms-para {
            font-size: 10px;
            line-height: 1.7;
            margin: 0 0 10px 0;
          }
          .terms-section-gap {
            margin-top: 20px;
          }
        }
      `}</style>

      <div className="terms-wrap">
        <p className="terms-section-title">
          Terms &amp; Conditians For Joining Us
        </p>
        <p className="terms-para">
          1) The person should be above 18 yaars to be active member of this
          organization and without any criminal background.
        </p>
        <p className="terms-para">
          2) The Person should be physically and mentally strong (special person
          define first) and willing to work for the organization individually or
          in the group and travel at his own expense.
        </p>
        <p className="terms-para">
          3) A person is selected and can be removed and take legal action by
          the chairman and core group without notice or giving reason for wrong
          information, misconduct, misbehavior, indiscipline.
        </p>
        <p className="terms-para">
          4) The member is willing to work and obey the chairman and core group.
        </p>
        <p className="terms-para">
          5) The member will give his best efforts to full fill objective and
          task assigned to him or her.
        </p>
        <p className="terms-para">
          6) Member should be attend the meetings and participate fully and have
          to give written application for being absent, 3 day before meetings.
        </p>
        <p className="terms-para">
          7) The meeting will be helds at various locations.
        </p>
        <p className="terms-para">
          8) Meeting will be headed by the chairman, and the core group and
          members.
        </p>
        <p className="terms-para">
          9) The Chairmen has the supreme power to form or diffuse a core group
          and member.
        </p>
        <p className="terms-para">
          10) It is duty of a member to obey and give due respect to the
          chairman and core group.
        </p>
        <p className="terms-para">
          11)Membership fee should paid with application form and the Membership
          fee will be non-refundable.
        </p>

        <div className="terms-section-gap">
          <p className="terms-section-title">
            Terms &amp; Conditions For Working With Us
          </p>
          <p className="terms-para">
            1) The Person's age should be minimum 19 years maximum 40 years and
            without any criminal background to fill the application form for
            this post.
          </p>
          <p className="terms-para">
            2) The applicant should be physically and mentally strong (special
            person define first) and willing to work for the organization
            individually or in the group and travel at his own expense.
          </p>
          <p className="terms-para">
            3) A person is selected and can be removed and take legal action by
            the chairman and core group without notice or giving reason for
            wrong information, misconduct, misbehavior, indiscipline.
          </p>
          <p className="terms-para">
            4) The applicant is willing to work and obey the chairman and core
            group.
          </p>
          <p className="terms-para">
            5) The applicant will give his best efforts to full fill objective
            and task assigned to him or her.
          </p>
          <p className="terms-para">
            6) The Chairmen has the supreme power to diffuse a application form
            any time.
          </p>
          <p className="terms-para">
            7) It is duty of a applicant to obey and give due respect to the
            chairman and core group.
          </p>
          <p className="terms-para">
            8) Application fee should paid with application form and the
            application fee will be non-refundable.
          </p>
          <p className="terms-para">
            9) Application &amp; agreement fee should paid with agreement
            document and the agreement fee will be non-refundable.
          </p>
        </div>
      </div>
    </div>
  );
}
