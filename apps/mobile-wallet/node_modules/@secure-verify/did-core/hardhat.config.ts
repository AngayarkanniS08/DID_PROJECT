import type { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    amoy: {
      type: 'http',
      url: process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
      accounts: process.env.ISSUER_PRIVATE_KEY ? [process.env.ISSUER_PRIVATE_KEY] : [],
      chainId: 80002,
    },
    localhost: {
      type: 'http',
      url: 'http://127.0.0.1:8545',
    },
  },
  paths: {
    sources: './contracts',
    artifacts: './artifacts',
  },
};

export default config;
