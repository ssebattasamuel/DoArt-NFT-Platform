import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import Heading from '../ui/Heading';
import Row from '../ui/Row';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useLocalStorageState } from '../hooks/useLocalStorage';
import DoArtABI from '../abis/DoArt.json';
import config from '../config';
import ArtNftCard from '../ui/ArtNftCard';

const ProfileContainer = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const ProfileImage = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
`;

const ProfileForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 400px;
`;

const NftGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;

function Account({ provider, signer }) {
  const [account, setAccount] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [profile, setProfile] = useLocalStorageState(
    { username: '', bio: '' },
    'userProfile'
  );

  useEffect(() => {
    const fetchAccount = async () => {
      if (!signer || !provider) return;

      try {
        const address = await signer.getAddress();
        setAccount(address);

        const chainId = import.meta.env.VITE_CHAIN_ID;
        const doArt = new ethers.Contract(
          config[chainId].doArt.address,
          DoArtABI.abi,
          provider
        );
        const balance = await doArt.balanceOf(address);
        const ownedNfts = [];

        for (let i = 0; i < balance.toNumber(); i++) {
          const tokenId = await doArt.tokenOfOwnerByIndex(address, i);
          const uri = await doArt.tokenURI(tokenId);
          let metadata;
          try {
            metadata = await (await fetch(uri)).json();
          } catch {
            metadata = { title: `Token #${tokenId}`, image: '' };
          }
          ownedNfts.push({
            contractAddress: config[chainId].doArt.address,
            tokenId: tokenId.toString(),
            metadata,
            listing: { isListed: false, price: 0, escrowAmount: 0, uri },
            auction: { isActive: false, highestBid: ethers.BigNumber.from(0) },
          });
        }
        setNfts(ownedNfts);
      } catch (error) {
        console.error('Failed to fetch account:', error);
      }
    };
    fetchAccount();
  }, [signer, provider]);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setProfile({ username: e.target.username.value, bio: e.target.bio.value });
  };

  return (
    <>
      <Heading as="h1">Your Account</Heading>
      <Row>
        <ProfileContainer>
          <ProfileImage src="/default-user.jpg" alt="Profile" />
          <ProfileForm onSubmit={handleProfileUpdate}>
            <div>
              <label htmlFor="username">Username</label>
              <Input
                id="username"
                defaultValue={profile.username}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label htmlFor="bio">Bio</label>
              <Input
                id="bio"
                defaultValue={profile.bio}
                placeholder="Tell us about yourself"
              />
            </div>
            <Button type="submit">Update Profile</Button>
          </ProfileForm>
        </ProfileContainer>
      </Row>
      <Row>
        <Heading as="h3">Wallet Address</Heading>
        <p>{account || 'Not connected'}</p>
      </Row>
      <Row>
        <Heading as="h3">Your NFTs</Heading>
        <NftGrid>
          {nfts.length > 0 ? (
            nfts.map((nft) => (
              <ArtNftCard
                key={`${nft.contractAddress}-${nft.tokenId}`}
                nft={nft}
                provider={provider}
                signer={signer}
              />
            ))
          ) : (
            <p>No NFTs owned yet.</p>
          )}
        </NftGrid>
      </Row>
    </>
  );
}

export default Account;
