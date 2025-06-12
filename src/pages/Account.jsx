import { useState } from 'react';
import styled from 'styled-components';
import Heading from '../ui/Heading';
import Row from '../ui/Row';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useLocalStorageState } from '../hooks/useLocalStorage';
import { useWeb3 } from '../hooks/useWeb3';
import { useUserListings } from '../hooks/useUserListings';
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

const Section = styled.div`
  margin-bottom: 3rem;
`;

function Account() {
  const { account, signer } = useWeb3();
  const { ownedNfts, userListings, userBids, isLoading } = useUserListings();
  const [profile, setProfile] = useLocalStorageState(
    { username: '', bio: '' },
    'userProfile'
  );

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setProfile({ username: e.target.username.value, bio: e.target.bio.value });
  };

  if (isLoading) return <Spinner />;
  if (!account) return <div>Please connect your wallet</div>;

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
        <p>{account}</p>
      </Row>
      <Section>
        <Heading as="h3">Your NFTs</Heading>
        <NftGrid>
          {ownedNfts.length > 0 ? (
            ownedNfts.map((nft) => (
              <ArtNftCard
                key={`${nft.contractAddress}-${nft.tokenId}`}
                nft={nft}
              />
            ))
          ) : (
            <p>No NFTs owned yet.</p>
          )}
        </NftGrid>
      </Section>
      <Section>
        <Heading as="h3">Your Listings</Heading>
        <NftGrid>
          {userListings.length > 0 ? (
            userListings.map((nft) => (
              <ArtNftCard
                key={`${nft.contractAddress}-${nft.tokenId}`}
                nft={nft}
              />
            ))
          ) : (
            <p>No active listings.</p>
          )}
        </NftGrid>
      </Section>
      <Section>
        <Heading as="h3">Your Bids</Heading>
        <NftGrid>
          {userBids.length > 0 ? (
            userBids.map((nft) => (
              <ArtNftCard
                key={`${nft.contractAddress}-${nft.tokenId}`}
                nft={nft}
              />
            ))
          ) : (
            <p>No active bids.</p>
          )}
        </NftGrid>
      </Section>
    </>
  );
}

export default Account;
