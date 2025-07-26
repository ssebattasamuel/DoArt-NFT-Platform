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
import { useWeb3 } from '../hooks/useWeb3'; // Import useWeb3 to get provider

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

function Dashboard() {
  const { provider } = useWeb3(); // Get provider from useWeb3 hook
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

      const [totalNfts, listings, auctions, filter] = await Promise.all([
        escrowStorage.getTotalNfts().catch(() => ethers.BigNumber.from(0)),
        escrowStorage.getAllListings().catch(() => []), // Fixed: getAllListings() instead of getListings()
        escrowStorage.getAllAuctions().catch(() => []), // Fixed: getAllAuctions() instead of getAuctions()
        doArt.filters.Transfer()
      ]);

      const activeListings = (listings || []).filter((l) => l.isListed).length;
      const activeAuctions = (auctions || []).filter((a) => a.isActive).length;

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
    },
    enabled: !!provider // Only run query if provider is available
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
/*
import styled from 'styled-components';
import Heading from '../ui/Heading';
import Row from '../ui/Row';

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

function Dashboard() {
  return (
    <Row type="vertical">
      <Heading as="h1">Dashboard</Heading>
      <StatsContainer>
        <StatCard>
          <StatTitle>Total NFTs Minted</StatTitle>
          <StatValue>0</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Active Listings</StatTitle>
          <StatValue>0</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Active Auctions</StatTitle>
          <StatValue>0</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>Total Volume</StatTitle>
          <StatValue>0 ETH</StatValue>
        </StatCard>
      </StatsContainer>
    </Row>
  );
}

export default Dashboard;*/
