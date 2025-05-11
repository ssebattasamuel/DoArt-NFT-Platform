const artworks = [
  {
    artwork: 'https://ipfs.io/ipfs/CID1',
    metadata: 'https://ipfs.io/ipfs/CID1_metadata.json',
  },
  {
    artwork: 'https://ipfs.io/ipfs/CID2',
    metadata: 'https://ipfs.io/ipfs/CID2_metadata.json',
  },
];

async function fetchMetadata() {
  for (const item of artworks) {
    try {
      const response = await fetch(item.metadata);
      const metadata = await response.json();
      displayArtwork(item.artwork, metadata);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  }
}

function displayArtwork(artworkUrl, metadata) {
  const container = document.getElementById('artwork-container');
  const img = document.createElement('img');
  img.src = artworkUrl;
  img.alt = metadata.title;

  const title = document.createElement('h3');
  title.textContent = metadata.title;

  const description = document.createElement('p');
  description.textContent = metadata.description;

  container.appendChild(img);
  container.appendChild(title);
  container.appendChild(description);
}

// Call the function to fetch and display artworks
fetchMetadata();
