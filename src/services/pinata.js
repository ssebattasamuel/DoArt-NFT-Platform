// import axios from 'axios';

// const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
// const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

// console.log('Pinata.js - API Key:', PINATA_API_KEY);
// console.log('Pinata.js - Secret Key:', PINATA_SECRET_KEY ? 'Set' : 'Not set');

// export async function uploadToPinata(file, isJson = false) {
//   const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
//   const formData = new FormData();
//   if (isJson) {
//     formData.append(
//       'file',
//       new Blob([JSON.stringify(file)], { type: 'application/json' }),
//       'metadata.json'
//     );
//   } else {
//     formData.append('file', file, 'art-image.jpg'); // Short file name
//   }

//   try {
//     const response = await axios.post(url, formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//         pinata_api_key: PINATA_API_KEY,
//         pinata_secret_api_key: PINATA_SECRET_KEY
//       }
//     });
//     return `ipfs://${response.data.IpfsHash}`;
//   } catch (error) {
//     console.error('Pinata API error:', error.response?.data || error.message);
//     throw new Error(`Pinata upload failed: ${error.message}`);
//   }
// }
// src/services/pinata.js
import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

console.log('Pinata.js - API Key:', PINATA_API_KEY);
console.log('Pinata.js - Secret Key:', PINATA_SECRET_KEY ? 'Set' : 'Not set');

export async function uploadToPinata(file, isJson = false) {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const formData = new FormData();
  console.log('uploadToPinata: Uploading', {
    isJson,
    file: isJson ? JSON.stringify(file) : file.name
  });
  if (isJson) {
    formData.append(
      'file',
      new Blob([JSON.stringify(file)], { type: 'application/json' }),
      'metadata.json'
    );
  } else {
    formData.append('file', file, 'art-image.jpg'); // Short file name
  }

  try {
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY
      }
    });
    console.log(
      'uploadToPinata:',
      isJson ? 'JSON pinned' : 'File pinned',
      response.data
    );
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error(
      'uploadToPinata error:',
      error.response?.data || error.message,
      error.stack
    );
    throw new Error(`Pinata upload failed: ${error.message}`);
  }
}
