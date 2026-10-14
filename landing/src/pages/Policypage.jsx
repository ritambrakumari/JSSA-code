import React from "react";

const sections = [
  {
    title: "Who we are",
    content: [
      'Our website address is <a href="https://jssabhiyan.com/" style="color:#111827;text-decoration:none;">https://jssabhiyan.com/</a>.',
    ],
  },
  {
    title: "Comments",
    content: [
      'When visitors leave comments on the site we collect the data shown in the comments form, and also the visitor\'s IP address and browser user agent string to help spam detection. An anonymized string created from your email address (also called a hash) may be provided to the Gravatar service to see if you are using it. The Gravatar service privacy policy is available here: <a href="https://jssabhiyan.com/privacy-policy" style="color:#111827;text-decoration:none;">https://jssabhiyan.com/privacy-policy</a>. After approval of your comment, your profile picture is visible to the public in the context of your comment.',
    ],
  },
  {
    title: "Media",
    content: [
      "If you upload images to the website, you should avoid uploading images with embedded location data (EXIF GPS) included. Visitors to the website can download and extract any location data from images on the website.",
    ],
  },
  {
    title: "Cookies",
    content: [
      "If you leave a comment on our site you may opt-in to saving your name, email address and website in cookies. These are for your convenience so that you do not have to fill in your details again when you leave another comment. These cookies will last for one year.",
      "If you visit our login page, we will set a temporary cookie to determine if your browser accepts cookies. This cookie contains no personal data and is discarded when you close your browser.",
      'When you log in, we will also set up several cookies to save your login information and your screen display choices. Login cookies last for two days, and screen options cookies last for a year. If you select "Remember Me", your login will persist for two weeks. If you log out of your account, the login cookies will be removed.',
      "If you edit or publish an article, an additional cookie will be saved in your browser. This cookie includes no personal data and simply indicates the post ID of the article you just edited. It expires after 1 day.",
    ],
  },
  {
    title: "Embedded content from other websites",
    content: [
      "Articles on this site may include embedded content (e.g. videos, images, articles, etc.). Embedded content from other websites behaves in the exact same way as if the visitor has visited the other website.",
      "These websites may collect data about you, use cookies, embed additional third-party tracking, and monitor your interaction with that embedded content, including tracking your interaction with the embedded content if you have an account and are logged in to that website.",
    ],
  },
  {
    title: "Who we share your data with",
    content: [
      "If you request a password reset, your IP address will be included in the reset email.",
    ],
  },
  {
    title: "How long we retain your data",
    content: [
      "If you leave a comment, the comment and its metadata are retained indefinitely. This is so we can recognize and approve any follow-up comments automatically instead of holding them in a moderation queue.",
      "For users that register on our website (if any), we also store the personal information they provide in their user profile. All users can see, edit, or delete their personal information at any time (except they cannot change their username). Website administrators can also see and edit that information.",
    ],
  },
  {
    title: "What rights you have over your data",
    content: [
      "If you have an account on this site, or have left comments, you can request to receive an exported file of the personal data we hold about you, including any data you have provided to us. You can also request that we erase any personal data we hold about you. This does not include any data we are obliged to keep for administrative, legal, or security purposes.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      <style>{`
        .policy-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 48px 60px 48px;
        }
        .policy-section {
          margin-bottom: 36px;
        }
        .policy-heading {
          font-size: 22px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 10px 0;
          line-height: 1.3;
        }
        .policy-para {
          color: #111827;
          font-size: 16px;
          line-height: 1.85;
          padding: 0;
        }
        @media (max-width: 768px) {
          .policy-wrap {
            padding: 20px 14px 40px 14px;
          }
          .policy-heading {
            font-size: 14px;
            margin: 0 0 6px 0;
          }
          .policy-para {
            font-size: 10px;
            line-height: 1.7;
          }
          .policy-section {
            margin-bottom: 20px;
          }
        }
      `}</style>

      <div className="policy-wrap">
        {sections.map((section, index) => (
          <div key={index} className="policy-section">
            <h2 className="policy-heading">{section.title}</h2>
            {section.content.map((para, i) => (
              <p
                key={i}
                className="policy-para"
                style={{
                  margin: i === section.content.length - 1 ? "0" : "0 0 14px 0",
                }}
                dangerouslySetInnerHTML={{ __html: para }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
