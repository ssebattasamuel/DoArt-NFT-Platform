/*import fs from 'fs';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config(); // Load .env file

const PINATA_API_KEY = process.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.VITE_PINATA_SECRET;

async function uploadToPinata(file, isJson = false) {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const formData = new FormData();
  if (isJson) {
    formData.append(
      'file',
      new Blob([JSON.stringify(file)], { type: 'application/json' }),
      'metadata.json'
    );
  } else {
    formData.append('file', file);
  }

  try {
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY
      }
    });
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    throw new Error(`Pinata upload failed: ${error.message}`);
  }
}

async function testUpload() {
  try {
    // Replace with your actual image path
    const fileBuffer = fs.readFileSync(
      'C:/Users/admin/Downloads/Deserted-road.jpg'
    );
    const cid = await uploadToPinata(fileBuffer);
    console.log('Uploaded CID:', cid);
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

testUpload();
*/
// src/testPinata.js
import fs from 'fs';
import dotenv from 'dotenv';
import axios from 'axios';
import { Blob } from 'node:buffer'; // Import Blob from Node.js buffer module

dotenv.config({ debug: true });

console.log('API Key:', process.env.VITE_PINATA_API_KEY);
console.log(
  'Secret Key:',
  process.env.VITE_PINATA_SECRET_KEY ? 'Set' : 'Not set'
);

async function uploadToPinata(file, isJson = false) {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const formData = new FormData();
  if (isJson) {
    formData.append(
      'file',
      new Blob([JSON.stringify(file)], { type: 'application/json' }),
      'metadata.json'
    );
  } else {
    formData.append('file', file, 'test-image.jpg'); // Short file name
  }

  try {
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: process.env.VITE_PINATA_API_KEY,
        pinata_secret_api_key: process.env.VITE_PINATA_SECRET_KEY
      }
    });
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Pinata API error:', error.response?.data || error.message);
    throw new Error(`Pinata upload failed: ${error.message}`);
  }
}

async function testUpload() {
  try {
    const fileBuffer = fs.readFileSync(
      'C:/Users/admin/Downloads/Deserted-road.jpg'
    );
    // Convert Buffer to Blob
    const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });
    const cid = await uploadToPinata(fileBlob);
    console.log('Uploaded CID:', cid);
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

testUpload();
