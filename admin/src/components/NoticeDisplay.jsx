import React, { useState, useEffect } from "react";
import { noticesAPI } from "../utils/api";

const NoticeDisplay = () => {
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveNotice();
  }, []);

  const fetchActiveNotice = async () => {
    try {
      setLoading(true);
      const response = await noticesAPI.getAll(true); // Get only active notices
      if (response.success && response.data && response.data.notices.length > 0) {
        // Get the most recent active notice
        setNotice(response.data.notices[0]);
      }
    } catch (err) {
      console.error("Error fetching notice:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!notice) {
    return null; // Don't show anything if no active notice
  }

  return (
    <>
      {/* Main Notice Section */}
      <div
        className="notice-app-wrap"
        style={{ background: "#fce8f0", padding: "20px 0 0", marginTop: 24 }}
      >
        <div className="notice-app-inner" style={{ padding: "0 175px 0 175px" }}>
          {notice.noticeEnglish || notice.noticeHindi ? (
            <p
              className="body-text notice-text"
              style={{
                lineHeight: 1.6,
                color: "#1a1a1a",
                marginBottom: 28,
                textAlign: "justify",
                fontWeight: 400,
                fontSize: 18,
              }}
            >
              <strong>NOTICE/सूचना:</strong>{" "}
              {notice.noticeHindi && (
                <>
                  {notice.noticeHindi}{" "}
                </>
              )}
              {notice.noticeEnglish && (
                <>
                  {notice.noticeEnglish}
                </>
              )}
            </p>
          ) : null}

          {/* Important Notice Box */}
          {notice.importantNotice && (
            <div
              className="body-text notice-important"
              style={{
                background: "#f8b4b4",
                padding: "20px 24px",
                borderRadius: 3,
                fontWeight: 600,
                color: "#1a1a1a",
                marginBottom: 28,
                textAlign: "center",
                fontSize: 19,
              }}
            >
              IMPORTANT NOTICE:– {notice.importantNotice}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NoticeDisplay;
