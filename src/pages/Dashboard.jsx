// src/pages/Dashboard.jsx
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import styled from 'styled-components';
import Heading from '../ui/Heading';
import Row from '../ui/Row';
import Spinner from '../ui/Spinner';
import DoArtABI from '../abis/DoArt.json';
import EscrowStorageABI from '../abis/EscrowStorage.json';
import config from '../config';
import { formatCurrency } from '../utils/helpers';

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
`;

const StatCard = styled.div`
  background: var(--color-grey-0);
  border-radius: var(--border-radius-md);
  padding: 2rem;
  box-shadow: var(--shadow-md);
  text-align: center;
`;

const StatTitle = styled.h3`
  font-size: 1.6rem;
  color: var(--color-grey-600);
  margin-bottom: 1rem;
`;

const StatValue = styled.p`
  font-size: 2.4rem;
  font-weight: 600;
  color: var(--color-brand-600);
`;

function Dashboard({ provider }) {
  const chainId = import.meta.env.VITE_CHAIN_ID;

  const fetchStats = async () => {
    const doArt = new ethers.Contract(
      config[chainId].doArt.address,
      DoArtABI.abi,
      provider
    );
    const escrowStorage = new ethers.Contract(
      config[chainId].escrowStorage.address,
      EscrowStorageABI.abi,
      provider
    );

    const totalNfts = (await doArt.totalSupply()).toString();
    const listings = await escrowStorage.getListings();
    const activeListings = listings.filter((l) => l.isListed).length;
    const auctions = await escrowStorage.getAuctions();
    const activeAuctions = auctions.filter((a) => a.isActive).length;

    // Fetch total volume from Transfer events
    const filter = doArt.filters.Transfer();
    const events = await doArt.queryFilter(filter, 0, 'latest');
    const totalVolume = events.reduce((sum, event) => {
      // Assume value in event (simplified; adjust based on your contract)
      return sum.add(event.args.value || ethers.BigNumber.from(0));
    }, ethers.BigNumber.from(0));

    return { totalNfts, activeListings, activeAuctions, totalVolume };
  };

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchStats,
  });

  if (isLoading) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Row type="vertical">
      <Heading as="h1">Dashboard</Heading>
      <StatsContainer>
        <StatCard>
          <StatTitle>Total NFTs Minted</StatTitle>
          <StatValue>{stats.totalNfts}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Active Listings</StatTitle>
          <StatValue>{stats.activeListings}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Active Auctions</StatTitle>
          <StatValue>{stats.activeAuctions}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Total Volume</StatTitle>
          <StatValue>
            {formatCurrency(ethers.utils.formatEther(stats.totalVolume), 'ETH')}
          </StatValue>
        </StatCard>
      </StatsContainer>
    </Row>
  );
}

export default Dashboard;
