import { useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";

const TawkMessenger = () => {
  const { role } = useAuth();

  useEffect(() => {
    // Only load for employee role
    if (role !== "employee") {
      if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
        window.Tawk_API.hideWidget();
      }
      return;
    }

    // Show widget if it already exists
    if (window.Tawk_API && typeof window.Tawk_API.showWidget === 'function') {
      window.Tawk_API.showWidget();
      return;
    }

    // Load Tawk.to Script
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Store the original title to prevent Tawk from overriding it
    const originalTitle = document.title;

    // Prevent Tawk from changing the tab title
    window.Tawk_API.onUnreadCountChanged = function(count) {
      // Forcefully reset the title back to original whenever count changes
      if (document.title !== originalTitle) {
        document.title = originalTitle;
      }
    };
    
    (function() {
      var s1 = document.createElement("script"),
          s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = 'https://embed.tawk.to/69b79a2d5963821c34ebf70d/1jjqj4gr2';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      s0.parentNode.insertBefore(s1, s0);
    })();

    return () => {
      // Cleanup: Hide widget if unmounting or role changes
      if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
        window.Tawk_API.hideWidget();
      }
    };
  }, [role]);

  return null;
};

export default TawkMessenger;
