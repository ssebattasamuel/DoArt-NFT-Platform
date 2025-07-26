// import { useState } from 'react';
// import styled from 'styled-components';
// import Heading from '../ui/Heading';
// import Row from '../ui/Row';
// import Input from '../ui/Input';
// import Button from '../ui/Button';
// import { useLocalStorageState } from '../hooks/useLocalStorage';
// import { useWeb3 } from '../hooks/useWeb3';
// import Spinner from '../ui/Spinner';

// const ProfileContainer = styled.div`
//   display: flex;
//   gap: 2rem;
//   margin-bottom: 2rem;
// `;

// const ProfileImage = styled.img`
//   width: 150px;
//   height: 150px;
//   border-radius: 50%;
//   object-fit: cover;
// `;

// const ProfileForm = styled.form`
//   display: flex;
//   flex-direction: column;
//   gap: 1.5rem;
//   max-width: 400px;
// `;

// const NftGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
//   gap: 2rem;
// `;

// const Section = styled.div`
//   margin-bottom: 3rem;
// `;

// function Account() {
//   const { account } = useWeb3();
//   const [profile, setProfile] = useLocalStorageState(
//     { username: '', bio: '' },
//     'userProfile'
//   );

//   const handleProfileUpdate = (e) => {
//     e.preventDefault();
//     setProfile({ username: e.target.username.value, bio: e.target.bio.value });
//   };

//   if (!account) return <div>Please connect your wallet</div>;

//   return (
//     <>
//       <Heading as="h1">Your Account</Heading>
//       <Row>
//         <ProfileContainer>
//           <ProfileImage src="/default-user.jpg" alt="Profile" />
//           <ProfileForm onSubmit={handleProfileUpdate}>
//             <div>
//               <label htmlFor="username">Username</label>
//               <Input
//                 id="username"
//                 defaultValue={profile.username}
//                 placeholder="Enter username"
//               />
//             </div>
//             <div>
//               <label htmlFor="bio">Bio</label>
//               <Input
//                 id="bio"
//                 defaultValue={profile.bio}
//                 placeholder="Tell us about yourself"
//               />
//             </div>
//             <Button type="submit">Update Profile</Button>
//           </ProfileForm>
//         </ProfileContainer>
//       </Row>
//       <Row>
//         <Heading as="h3">Wallet Address</Heading>
//         <p>{account}</p>
//       </Row>
//     </>
//   );
// }

// export default Account;
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
import Spinner from '../ui/Spinner';
import { useGetArtistMetadata } from '../hooks/useGetArtistMetadata';
import { useSetArtistMetadata } from '../hooks/useSetArtistMetadata';
import FormRow from '../ui/FormRow';

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
  const { account } = useWeb3();
  const { ownedNfts, userListings, userBids, isLoading: listingsLoading } = useUserListings();
  const { metadata: artistMetadata, isLoading: metadataLoading } = useGetArtistMetadata(account);
  const { setMetadata, isSetting } = useSetArtistMetadata();
  const [profile, setProfile] = useLocalStorageState(
    { username: '', bio: '' },
    'userProfile'
  );

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setProfile({ username: e.target.username.value, bio: e.target.bio.value });
  };

  const handleArtistMetadataUpdate = (e) => {
    e.preventDefault();
    setMetadata({
      name: e.target.name.value,
      bio: e.target.bio.value,
      portfolioUrl: e.target.portfolioUrl.value
    });
  };

  if (listingsLoading || metadataLoading) return <Spinner />;
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
        <Heading as="h3">Artist Metadata</Heading>
        <p>Name: {artistMetadata.name}</p>
        <p>Bio: {artistMetadata.bio}</p>
        <p>Portfolio URL: {artistMetadata.portfolioUrl}</p>
        <ProfileForm onSubmit={handleArtistMetadataUpdate}>
          <FormRow label="Name">
            <Input id="name" defaultValue={artistMetadata.name} />
          </FormRow>
          <FormRow label="Bio">
            <Input id="bio" defaultValue={artistMetadata.bio} />
          </FormRow>
          <FormRow label="Portfolio URL">
            <Input id="portfolioUrl" defaultValue={artistMetadata.portfolioUrl} />
          </FormRow>
          <Button type="submit" disabled={isSetting}>Update Artist Metadata</Button>
        </ProfileForm>
      </Section>
      <Section>
        <Heading as="h3">Your NFTs</Heading>
        <NftGrid>
          {(ownedNfts || []).length > 0 ? (
            (ownedNfts || []).map((nft) => (
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
          {(userListings || []).length > 0 ? (
            (userListings || []).map((nft) => (
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
          {(userBids || []).length > 0 ? (
            (userBids || []).map((nft) => (
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

