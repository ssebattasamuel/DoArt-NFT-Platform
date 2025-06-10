import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET;

export async function uploadToPinata(file, isJson = false) {
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
