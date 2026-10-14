/**
 * Simple translation helper using Google's free translation API (gtx)
 * Note: This is for small-scale use and should be replaced with a proper
 * paid API (e.g. Google Cloud Translation) for production high-traffic apps.
 */
export const translateToHindi = async (text) => {
  if (!text || text.trim() === "") return "";
  
  try {
    // Sanitize text: remove excessive spaces
    const query = text.trim();
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    // Google returns a nested array: [[["translated_text", "source_text", null, null, 1]], null, "en"]
    if (data && data[0] && Array.isArray(data[0])) {
      // Join all parts if multiple sentences or phrases are translated
      const result = data[0].map(part => part[0]).join("");
      if (result) return result;
    }
    
    console.warn("Translation returned empty/unexpected format:", data);
    return query; // Fallback to original
  } catch (error) {
    console.error("Translation Helper Error:", error);
    return text.trim(); // Fallback to original
  }
};
