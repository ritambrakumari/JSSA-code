import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: 'd:/JSSA-main/backend/.env' });

async function testContact() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error("Missing credentials");
    return;
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  try {
    const response = await axios({
      url: 'https://api.razorpay.com/v1/contacts',
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      data: {
        name: "Rahul Kumar",
        email: "rahul.kumar@jssabhiyan.com",
        contact: "9876543210",
        type: "employee",
        reference_id: `EMP_${Date.now()}`
      }
    });
    console.log("Contact Created Successfully:", response.data);
  } catch (error) {
    console.error("Error creating contact:", error.response?.data || error.message);
  }
}

testContact();
