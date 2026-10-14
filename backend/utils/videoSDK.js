import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const VIDEOSDK_API_KEY = process.env.VIDEOSDK_API_KEY;
const VIDEOSDK_SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;
const VIDEOSDK_API_ENDPOINT = "https://api.videosdk.live/v2";

console.log("VideoSDK API Key Loaded:", VIDEOSDK_API_KEY ? "YES" : "NO");
console.log("VideoSDK Secret Key Loaded:", VIDEOSDK_SECRET_KEY ? "YES" : "NO");

/**
 * Generate VideoSDK Token
 * @param {string} roomId - Optional Room ID to restrict the token to
 * @returns {string} - JWT Token
 */
export const generateVideoSDKToken = (roomId = "") => {
  const options = {
    expiresIn: "120m",
    algorithm: "HS256",
  };

  const payload = {
    apikey: VIDEOSDK_API_KEY,
    permissions: ["allow_join", "allow_mod"], // allow_mod allows host controls
    version: 2,
    ...(roomId && { roomId }),
  };

  return jwt.sign(payload, VIDEOSDK_SECRET_KEY, options);
};

/**
 * Create a new room on VideoSDK
 * @returns {Promise<string>} - The created Room ID
 */
export const createVideoSDKRoom = async () => {
  const token = generateVideoSDKToken();
  
  try {
    console.log("Attempting to create VideoSDK room with Key:", VIDEOSDK_API_KEY);
    const response = await axios({
      method: "POST",
      url: `${VIDEOSDK_API_ENDPOINT}/rooms`,
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      data: {},
    });
    
    console.log("VideoSDK Room Created Successfully:", response.data.roomId);
    return response.data.roomId;
  } catch (error) {
    console.error("VideoSDK Create Room Error:", error.response?.data || error.message);
    throw new Error("Failed to create VideoSDK room");
  }
};

/**
 * Validate a room ID
 * @param {string} roomId 
 * @returns {Promise<boolean>}
 */
export const validateVideoSDKRoom = async (roomId) => {
  const token = generateVideoSDKToken();
  
  try {
    const response = await axios({
      method: "GET",
      url: `${VIDEOSDK_API_ENDPOINT}/rooms/${roomId}`,
      headers: {
        Authorization: token,
      },
    });
    
    return response.status === 200;
  } catch (error) {
    return false;
  }
};
/**
 * Terminate a room (Ends meeting for everyone)
 * @param {string} roomId 
 */
/**
 * Terminate a room (Ends meeting for everyone)
 * Note: VideoSDK v2 handles session ending via client-side meeting.end(). 
 * This is a placeholder for future session management APIs.
 */
export const terminateVideoSDKRoom = async (roomId) => {
  // In v2, we primarily rely on meeting.end() from the host client.
  // Server-side session termination is handled by participant removal or session timeouts.
  return true; 
};
