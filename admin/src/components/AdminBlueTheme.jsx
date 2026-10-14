// Shared landing-site theme for the Admin Panel (dark-green #3F6212 / green #4D7C0F / page #f9fafb, Segoe UI).
// UI only — no data or logic. Turned on for admin & superadmin by DashboardLayout via a <body> class,
// so every admin route (and its modals) picks it up. Other roles keep their existing look.
// Elements inside `.adm-keep`, `.print-area` or #application-slip-pdf (PDF / certificate / ID-card
// templates) are left untouched. Status colours (Active/Paid green, Pending orange, Failed red) are not changed.
import React, { useLayoutEffect } from "react";
import { useAuth } from "../auth/AuthProvider";

const STYLE_ID = "adm-blue-theme";
let activeCount = 0;

export function isAdminThemeRole(role) {
  return role === "admin" || role === "superadmin";
}

export function useAdminBlue() {
  const { role } = useAuth();
  return isAdminThemeRole(role);
}

function ensureThemeStyle() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = ADMIN_THEME_CSS;
  document.head.appendChild(el);
}

/** Adds the landing-site theme to <body> while the calling page is mounted (any role). */
export function useBlueBodyTheme(enabled = true) {
  useLayoutEffect(() => {
    if (!enabled || typeof document === "undefined") return undefined;
    ensureThemeStyle();
    activeCount += 1;
    document.body.classList.add("adm-blue");
    return () => {
      activeCount = Math.max(0, activeCount - 1);
      if (activeCount === 0) document.body.classList.remove("adm-blue");
    };
  }, [enabled]);
  return enabled;
}

/** Used by DashboardLayout: adds the theme to <body> while an admin page is mounted. */
export function useAdminBodyTheme() {
  const enabled = useAdminBlue();
  return useBlueBodyTheme(enabled);
}

/** Kept for pages that render it directly; the stylesheet is injected once into <head>. */
export function AdminBlueStyle() {
  ensureThemeStyle();
  return null;
}

/** Blue page header used across admin pages. */
export function AdminHero({ kicker = "Admin Panel", title, subtitle, icon: Icon, children }) {
  return (
    <div className="ab-hero">
      <div className="ab-hero-l">
        {Icon && (
          <span className="ab-hero-ic">
            <Icon className="w-6 h-6" />
          </span>
        )}
        <div className="ab-hero-txt">
          <p className="ab-kicker">{kicker}</p>
          <h1>{title}</h1>
          {subtitle && <p className="ab-sub">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="ab-hero-r">{children}</div>}
    </div>
  );
}

export const ADMIN_THEME_CSS = String.raw`
/* ── base: landing typography & surfaces ── */
body.adm-blue{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;}
body.adm-blue main.adm-main{background:#f9fafb!important;}
.adm-blue main :is(h1,h2).text-gray-900:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.adm-blue main :is(h1,h2).text-gray-800:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.adm-blue main :is(h1,h2).text-black:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:#1A2E05!important;}
/* tables: dark-green header like the landing job table */
.adm-blue main table > thead > tr > th:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:#3F6212!important;color:#fff!important;border-color:#3F6212!important;}
.adm-blue main table > thead > tr > th:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *) :not(input):not(select):not(textarea):not(option){color:inherit!important;}
.adm-blue main table > thead > tr:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:#3F6212!important;}
/* black primary buttons → landing green (modal overlays use bg-opacity and are skipped) */
.adm-blue main .bg-black.text-white:not(.bg-opacity-50):not(.bg-opacity-60):not(.bg-opacity-40):not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:#4D7C0F!important;}
.adm-blue main .bg-black.text-white:not(.bg-opacity-50):not(.bg-opacity-60):not(.bg-opacity-40):not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:#3F6212!important;}

/* ── brand green utilities → landing blue (generated) ── */
.adm-blue .accent-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){accent-color:rgb(101,163,13)!important}
.adm-blue .bg-\[\#0A3D00\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(77,124,15)!important}
.adm-blue .bg-\[\#248000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(101,163,13)!important}
.adm-blue .bg-\[\#248000\]\/10:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(101 163 13 / 0.1)!important}
.adm-blue .bg-\[\#2d8a00\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(77,124,15)!important}
.adm-blue .bg-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(101,163,13)!important}
.adm-blue .bg-\[\#3AB000\]\/10:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(101 163 13 / 0.1)!important}
.adm-blue .bg-\[\#3AB000\]\/5:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(101 163 13 / 0.05)!important}
.adm-blue .bg-\[\#e8f5e2\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(247,254,231)!important}
.adm-blue .bg-\[\#f0f9eb\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(247,254,231)!important}
.adm-blue .bg-\[\#f0fce8\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(247,254,231)!important}
.adm-blue .bg-\[\#f0fce8\]\/30:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(247 254 231 / 0.3)!important}
.adm-blue .bg-\[\#f2ffeb\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(247,254,231)!important}
.adm-blue .bg-\[\#f4fbf0\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(236,252,203)!important}
.adm-blue .bg-\[\#f8fcf7\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(236,252,203)!important}
.adm-blue .bg-\[\#f8fcf7\]\/30:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(245 249 255 / 0.3)!important}
.adm-blue .bg-\[\#f9fff5\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(236,252,203)!important}
.adm-blue .bg-emerald-600:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(101,163,13)!important}
.adm-blue .border-\[\#1a5000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(77,124,15)!important}
.adm-blue .border-\[\#248000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(101,163,13)!important}
.adm-blue .border-\[\#2d8a00\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(77,124,15)!important}
.adm-blue .border-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(101,163,13)!important}
.adm-blue .border-\[\#3AB000\]\/10:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(101 163 13 / 0.1)!important}
.adm-blue .border-\[\#3AB000\]\/15:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(101 163 13 / 0.15)!important}
.adm-blue .border-\[\#3AB000\]\/20:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(101 163 13 / 0.2)!important}
.adm-blue .border-\[\#3AB000\]\/30:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(101 163 13 / 0.3)!important}
.adm-blue .border-\[\#3AB000\]\/40:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(101 163 13 / 0.4)!important}
.adm-blue .border-\[\#3AB000\]\/50:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(101 163 13 / 0.5)!important}
.adm-blue .border-\[\#b5e08a\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(190,242,100)!important}
.adm-blue .border-\[\#bbf7d0\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(190,242,100)!important}
.adm-blue .border-\[\#c5e1a5\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(190,242,100)!important}
.adm-blue .border-\[\#c5edaa\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(190,242,100)!important}
.adm-blue .border-l-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-left-color:rgb(101,163,13)!important}
.adm-blue .border-t-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-top-color:rgb(101,163,13)!important}
.adm-blue .decoration-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){text-decoration-color:rgb(101,163,13)!important}
.adm-blue .decoration-\[\#3AB000\]\/20:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){text-decoration-color:rgb(101 163 13 / 0.2)!important}
.adm-blue .fill-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){fill:rgb(101,163,13)!important}
.adm-blue .focus-within\:border-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):focus-within{border-color:rgb(101,163,13)!important}
.adm-blue .focus-within\:ring-\[\#3AB000\]\/10:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):focus-within{--tw-ring-color:rgb(101 163 13 / 0.1)!important}
.adm-blue .focus\:border-\[\#248000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):focus{border-color:rgb(101,163,13)!important}
.adm-blue .focus\:border-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):focus{border-color:rgb(101,163,13)!important}
.adm-blue .focus\:border-green-500:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):focus{border-color:rgb(101,163,13)!important}
.adm-blue .focus\:ring-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):focus{--tw-ring-color:rgb(101,163,13)!important}
.adm-blue .focus\:ring-\[\#3AB000\]\/20:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):focus{--tw-ring-color:rgb(101 163 13 / 0.2)!important}
.adm-blue .from-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){--tw-gradient-from:rgb(101,163,13) var(--tw-gradient-from-position)!important}
.adm-blue .from-\[\#3AB000\]\/10:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){--tw-gradient-from:rgb(101 163 13 / 0.1) var(--tw-gradient-from-position)!important}
.adm-blue .from-\[\#f0fce8\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){--tw-gradient-from:rgb(247,254,231) var(--tw-gradient-from-position)!important}
.adm-blue .group:focus-within .group-focus-within\:text-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:rgb(101,163,13)!important}
.adm-blue .group:hover .group-hover\:bg-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(101,163,13)!important}
.adm-blue .group:hover .group-hover\:bg-\[\#3AB000\]\/5:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(101 163 13 / 0.05)!important}
.adm-blue .group:hover .group-hover\:border-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(101,163,13)!important}
.adm-blue .group:hover .group-hover\:border-\[\#3AB000\]\/40:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(101 163 13 / 0.4)!important}
.adm-blue .group:hover .group-hover\:text-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:rgb(101,163,13)!important}
.adm-blue .hover\:bg-\[\#1a5e00\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(77,124,15)!important}
.adm-blue .hover\:bg-\[\#1f6000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(77,124,15)!important}
.adm-blue .hover\:bg-\[\#248000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(101,163,13)!important}
.adm-blue .hover\:bg-\[\#2B8000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(77,124,15)!important}
.adm-blue .hover\:bg-\[\#2d8a00\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(77,124,15)!important}
.adm-blue .hover\:bg-\[\#2e8a00\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(77,124,15)!important}
.adm-blue .hover\:bg-\[\#329600\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(77,124,15)!important}
.adm-blue .hover\:bg-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(101,163,13)!important}
.adm-blue .hover\:bg-\[\#3AB000\]\/10:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(101 163 13 / 0.1)!important}
.adm-blue .hover\:bg-\[\#3AB000\]\/20:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(101 163 13 / 0.2)!important}
.adm-blue .hover\:bg-\[\#3AB000\]\/5:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(101 163 13 / 0.05)!important}
.adm-blue .hover\:bg-\[\#d0edbc\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(247,254,231)!important}
.adm-blue .hover\:bg-\[\#d0edcc\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(247,254,231)!important}
.adm-blue .hover\:bg-\[\#d4edcc\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(247,254,231)!important}
.adm-blue .hover\:bg-\[\#e8f5e2\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(247,254,231)!important}
.adm-blue .hover\:bg-\[\#f0f9eb\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(247,254,231)!important}
.adm-blue .hover\:bg-\[\#f0fce8\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(247,254,231)!important}
.adm-blue .hover\:bg-\[\#f0fce8\]\/30:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(247 254 231 / 0.3)!important}
.adm-blue .hover\:bg-\[\#f9fff5\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(236,252,203)!important}
.adm-blue .hover\:bg-emerald-700:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{background-color:rgb(77,124,15)!important}
.adm-blue .hover\:border-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{border-color:rgb(101,163,13)!important}
.adm-blue .hover\:border-\[\#3AB000\]\/30:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{border-color:rgb(101 163 13 / 0.3)!important}
.adm-blue .hover\:border-\[\#3AB000\]\/50:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{border-color:rgb(101 163 13 / 0.5)!important}
.adm-blue .hover\:border-\[\#a8e08a\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{border-color:rgb(190,242,100)!important}
.adm-blue .hover\:shadow-\[\#3AB000\]\/5:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{--tw-shadow-color:rgb(101 163 13 / 0.05)!important}
.adm-blue .hover\:text-\[\#2d8a00\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{color:rgb(77,124,15)!important}
.adm-blue .hover\:text-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *):hover{color:rgb(101,163,13)!important}
.adm-blue .peer:checked ~ .peer-checked\:bg-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(101,163,13)!important}
.adm-blue .ring-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){--tw-ring-color:rgb(101,163,13)!important}
.adm-blue .shadow-\[\#248000\]\/20:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){--tw-shadow-color:rgb(101 163 13 / 0.2)!important}
.adm-blue .shadow-\[\#248000\]\/30:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){--tw-shadow-color:rgb(101 163 13 / 0.3)!important}
.adm-blue .shadow-\[\#3AB000\]\/10:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){--tw-shadow-color:rgb(101 163 13 / 0.1)!important}
.adm-blue .shadow-\[\#3AB000\]\/20:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){--tw-shadow-color:rgb(101 163 13 / 0.2)!important}
.adm-blue .shadow-\[\#3AB000\]\/5:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){--tw-shadow-color:rgb(101 163 13 / 0.05)!important}
.adm-blue .text-\[\#1a5000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:rgb(77,124,15)!important}
.adm-blue .text-\[\#2d7f00\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:rgb(101,163,13)!important}
.adm-blue .text-\[\#2d8a00\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:rgb(77,124,15)!important}
.adm-blue .text-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:rgb(101,163,13)!important}
.adm-blue .text-\[\#3AB000\]\/30:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:rgb(101 163 13 / 0.3)!important}
.adm-blue .text-\[\#3AB000\]\/60:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:rgb(101 163 13 / 0.6)!important}
.adm-blue .text-\[\#3AB000\]\/70:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:rgb(101 163 13 / 0.7)!important}
.adm-blue .text-\[\#d4f5a0\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:rgb(217,249,157)!important}
.adm-blue .to-\[\#2d8a00\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){--tw-gradient-to:rgb(77,124,15) var(--tw-gradient-to-position)!important}
.adm-blue .to-\[\#7ED321\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){--tw-gradient-to:rgb(190,242,100) var(--tw-gradient-to-position)!important}
.adm-blue .to-\[\#e8f5d8\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){--tw-gradient-to:rgb(247,254,231) var(--tw-gradient-to-position)!important}
/* ── inline brand-green styles ── */
.adm-blue [style*="background: rgb(58, 176, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.adm-blue [style*="background-color: rgb(58, 176, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background:#65A30D!important}
.adm-blue [style^="color: rgb(58, 176, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.adm-blue [style*="; color: rgb(58, 176, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:#65A30D!important}
.adm-blue [style*="border-color: rgb(58, 176, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:#65A30D!important}
.adm-blue [style*="border-top: "][style*="rgb(58, 176, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-top-color:#65A30D!important}
.adm-blue [style*="border-bottom: "][style*="rgb(58, 176, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-bottom-color:#65A30D!important}
.adm-blue [style*="border-right: "][style*="rgb(58, 176, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-right-color:#65A30D!important}
.adm-blue [style*="border-left: "][style*="rgb(58, 176, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-left-color:#65A30D!important}
.adm-blue [style*="border: "][style*="solid rgb(58, 176, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:#65A30D!important}
.adm-blue [style*="accent-color: rgb(58, 176, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){accent-color:#65A30D!important}
.adm-blue [style*="background: rgb(45, 138, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.adm-blue [style*="background-color: rgb(45, 138, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background:#4D7C0F!important}
.adm-blue [style^="color: rgb(45, 138, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.adm-blue [style*="; color: rgb(45, 138, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:#4D7C0F!important}
.adm-blue [style*="border-color: rgb(45, 138, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:#4D7C0F!important}
.adm-blue [style*="border-top: "][style*="rgb(45, 138, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-top-color:#4D7C0F!important}
.adm-blue [style*="border-bottom: "][style*="rgb(45, 138, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-bottom-color:#4D7C0F!important}
.adm-blue [style*="border-right: "][style*="rgb(45, 138, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-right-color:#4D7C0F!important}
.adm-blue [style*="border-left: "][style*="rgb(45, 138, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-left-color:#4D7C0F!important}
.adm-blue [style*="border: "][style*="solid rgb(45, 138, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:#4D7C0F!important}
.adm-blue [style*="accent-color: rgb(45, 138, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){accent-color:#4D7C0F!important}
.adm-blue [style*="background: rgb(232, 245, 226)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.adm-blue [style*="background-color: rgb(232, 245, 226)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background:#F7FEE7!important}
.adm-blue [style^="color: rgb(232, 245, 226)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.adm-blue [style*="; color: rgb(232, 245, 226)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:#F7FEE7!important}
.adm-blue [style*="border-color: rgb(232, 245, 226)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:#F7FEE7!important}
.adm-blue [style*="border-top: "][style*="rgb(232, 245, 226)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-top-color:#F7FEE7!important}
.adm-blue [style*="border-bottom: "][style*="rgb(232, 245, 226)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-bottom-color:#F7FEE7!important}
.adm-blue [style*="border-right: "][style*="rgb(232, 245, 226)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-right-color:#F7FEE7!important}
.adm-blue [style*="border-left: "][style*="rgb(232, 245, 226)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-left-color:#F7FEE7!important}
.adm-blue [style*="border: "][style*="solid rgb(232, 245, 226)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:#F7FEE7!important}
.adm-blue [style*="accent-color: rgb(232, 245, 226)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){accent-color:#F7FEE7!important}
.adm-blue [style*="gradient"][style*="rgb(58, 176, 0)"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background:linear-gradient(135deg,#65A30D 0%,#4D7C0F 100%)!important}
.adm-blue [stroke="#3AB000"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){stroke:#65A30D}
.adm-blue [fill="#3AB000"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){fill:#65A30D}
.adm-blue [stop-color="#3AB000"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){stop-color:#65A30D}
.adm-blue [stroke="#3ab000"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){stroke:#65A30D}
.adm-blue [fill="#3ab000"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){fill:#65A30D}
.adm-blue [stop-color="#3ab000"]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){stop-color:#65A30D}

/* ── keep status chips green (tinted green background + green text) ── */
.adm-blue .text-\[\#3AB000\]:is(.bg-\[\#3AB000\]\/5:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.bg-\[\#3AB000\]\/10:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.bg-\[\#f9fff5\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.bg-\[\#e8f5e2\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.bg-green-50:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.bg-green-100):not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){color:#2d8a00!important;}
.adm-blue .bg-\[\#3AB000\]\/5.text-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(58 176 0 / .05)!important;}
.adm-blue .bg-\[\#3AB000\]\/10.text-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:rgb(58 176 0 / .1)!important;}
.adm-blue .bg-\[\#f9fff5\].text-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:#f9fff5!important;}
.adm-blue .bg-\[\#e8f5e2\].text-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background-color:#e8f5e2!important;}
.adm-blue .text-\[\#3AB000\].border-\[\#3AB000\]\/20:is(.bg-\[\#3AB000\]\/5:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.bg-\[\#3AB000\]\/10:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.bg-\[\#f9fff5\]):not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(58 176 0 / .2)!important;}
.adm-blue .text-\[\#3AB000\].border-\[\#3AB000\]\/30:is(.bg-\[\#3AB000\]\/5:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.bg-\[\#3AB000\]\/10:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.bg-\[\#f9fff5\]):not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){border-color:rgb(58 176 0 / .3)!important;}

/* ── shared page hero ── */
.ab-hero{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:22px 26px;margin-bottom:18px;border-radius:10px;color:#fff;position:relative;overflow:hidden;
  background:linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%);box-shadow:0 6px 16px rgba(77,124,15,.22);text-shadow:0 1px 2px rgba(26,46,5,.35);}
.ab-hero::after{content:"";position:absolute;right:-70px;top:-90px;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,.1);pointer-events:none;}
.ab-hero-l{display:flex;align-items:center;gap:16px;min-width:0;flex:1 1 320px;position:relative;z-index:1;}
.ab-hero-r{display:flex;flex-wrap:wrap;gap:10px;position:relative;z-index:1;text-shadow:none;}
.ab-hero-ic{width:48px;height:48px;border-radius:10px;background:#fff;color:#65A30D;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(63,98,18,.18);}
.ab-hero-txt{min-width:0;}
.ab-kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;margin:0 0 4px;}
.adm-blue .ab-hero h1{font-size:24px;line-height:1.2;font-weight:800;margin:0 0 4px;color:#fff!important;}
.ab-sub{font-size:14px;font-weight:500;margin:0;}
.adm-blue .ab-hero-r .bg-\[\#3AB000\]:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.adm-blue .ab-hero-r .bg-black.text-white:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background:#fff!important;color:#3F6212!important;}
.adm-blue .ab-hero-r .bg-\[\#3AB000\]:hover:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *),.adm-blue .ab-hero-r .bg-black.text-white:hover:not(.adm-keep):not(.adm-keep *):not(.print-area):not(.print-area *):not(#application-slip-pdf *){background:#ECFCCB!important;}
/* success boxes → blue only on pages that opted in with their own .adm-blue wrapper */
.adm-blue .adm-blue .bg-green-50{background:#ECFCCB!important;}
.adm-blue .adm-blue .border-green-200{border-color:#D9F99D!important;}
.adm-blue .adm-blue .text-green-700{color:#4D7C0F!important;}
@media(max-width:640px){.ab-hero{padding:18px;}.adm-blue .ab-hero h1{font-size:20px;}.ab-hero-r{width:100%;}.ab-hero-r>*{flex:1;}}
`;
