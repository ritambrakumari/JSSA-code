import { useState, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  MessageSquare,
  ExternalLink,
  Monitor,
  CheckCircle2,
  XCircle,
  Maximize2,
} from "lucide-react";

const TAWK_URL = "https://dashboard.tawk.to/";
const TAWK_LOGIN_URL = "https://dashboard.tawk.to/login";

const POPUP_FEATURES =
  "width=1280,height=800,top=80,left=80,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no";

export default function LiveSupport() {
  const popupRef = useRef(null);
  const [popupOpen, setPopupOpen] = useState(false);

  const openPopup = (url) => {
    // If already open, just focus it
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      return;
    }
    const win = window.open(url, "tawkto_dashboard", POPUP_FEATURES);
    if (win) {
      popupRef.current = win;
      setPopupOpen(true);
      // Poll every second to detect if user closes popup
      const poll = setInterval(() => {
        if (win.closed) {
          clearInterval(poll);
          setPopupOpen(false);
          popupRef.current = null;
        }
      }, 1000);
    } else {
      // Popup blocked — fallback to new tab
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const focusPopup = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
    }
  };

  const closePopup = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    setPopupOpen(false);
    popupRef.current = null;
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#3AB000]/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[#3AB000]" />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-wider">
              Chat &amp; Live Support
            </h1>
            <p className="text-[11px] text-gray-400 font-medium">
              Tawk.to — Real-time customer support management
            </p>
          </div>
        </div>

        {/* Status Bar */}
        <div
          className={`flex items-center gap-3 px-5 py-3 mb-6 border text-sm font-semibold transition-all ${
            popupOpen
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-gray-50 border-gray-200 text-gray-500"
          }`}
        >
          {popupOpen ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#3AB000]" />
              <span>Tawk.to dashboard is open in a popup window.</span>
              <button
                onClick={focusPopup}
                className="ml-auto text-xs underline font-bold text-[#3AB000] hover:text-[#2d8a00]"
              >
                Bring to front
              </button>
              <button
                onClick={closePopup}
                className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> Close
              </button>
            </>
          ) : (
            <>
              <Monitor className="w-4 h-4" />
              <span>No active session. Click a button below to open Tawk.to.</span>
            </>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl w-full mx-auto mt-4">
          {/* Sign In */}
          <button
            onClick={() => openPopup(TAWK_LOGIN_URL)}
            className="group flex flex-col items-center justify-center gap-4 p-10 bg-white border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all text-center rounded-xl"
          >
            <div className="w-16 h-16 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-black text-gray-800 group-hover:text-blue-600 transition-colors">
                Sign In to Tawk.to
              </p>
              <p className="text-sm text-gray-400 mt-2 max-w-[250px] mx-auto">
                Opens login page in popup — redirects work properly
              </p>
            </div>
          </button>

          {/* New Tab */}
          <button
            onClick={() => window.open(TAWK_URL, "_blank", "noopener,noreferrer")}
            className="group flex flex-col items-center justify-center gap-4 p-10 bg-white border border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all text-center rounded-xl"
          >
            <div className="w-16 h-16 rounded-full bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
              <ExternalLink className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-black text-gray-800 group-hover:text-orange-600 transition-colors">
                Open in New Tab
              </p>
              <p className="text-sm text-gray-400 mt-2 max-w-[250px] mx-auto">
                Opens Tawk.to in a separate browser tab
              </p>
            </div>
          </button>
        </div>


      </div>
    </DashboardLayout>
  );
}
