/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Indian phone number (10 digits, optional +91)
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  // Remove spaces, dashes, and country code
  let cleaned = phone.replace(/[\s\-+]/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.substring(2);
  }
  // Should be exactly 10 digits
  return /^\d{10}$/.test(cleaned);
}

/**
 * Normalize phone number (remove spaces, dashes, country code)
 * @param {string} phone
 * @returns {string}
 */
export function normalizePhone(phone) {
  let cleaned = phone.replace(/[\s\-+]/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

/**
 * Validate password (min 6 characters)
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  return password && password.length >= 6;
}
