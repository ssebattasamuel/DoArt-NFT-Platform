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

  const {
    isLoading,
    data: stats,
    error
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      if (!provider) throw new Error('Provider not available');
      if (!EscrowStorageABI.abi || !DoArtABI.abi)
        throw new Error('Invalid ABI files');

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

      const [totalNfts, listings, filter] = await Promise.all([
        escrowStorage.getTotalNfts().catch(() => ethers.BigNumber.from(0)),
        escrowStorage.getListings().catch(() => []),
        doArt.filters.Transfer()
      ]);

      const activeListings = listings.filter((l) => l.isListed).length;
      const activeAuctions = 0; // Temporarily set to 0 since getAuctions() isn't available

      // Fetch total volume from Transfer events
      const events = await doArt
        .queryFilter(filter, 0, 'latest')
        .catch(() => []);
      const totalVolume = events.reduce((sum, event) => {
        return sum.add(event.args.value || ethers.BigNumber.from(0));
      }, ethers.BigNumber.from(0));

      return {
        totalNfts: totalNfts.toNumber(),
        activeListings,
        activeAuctions,
        totalVolume
      };
    }
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
