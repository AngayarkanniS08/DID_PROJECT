import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * Deploy DIDMerkleRegistry to Polygon Amoy testnet.
 *
 * Usage:
 *   npx ts-node scripts/deploy-merkle-registry.ts
 *
 * Required env vars in .env:
 *   ISSUER_PRIVATE_KEY=0x...
 *   POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
 */
async function main() {
  const rpcUrl = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology';
  const privateKey = process.env.ISSUER_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ ISSUER_PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  console.log(`\n🔗 Connecting to: ${rpcUrl}`);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log(`💳 Deployer: ${wallet.address}`);
  console.log(`💰 Balance:  ${ethers.formatEther(balance)} MATIC`);

  if (balance === 0n) {
    console.error('\n❌ Wallet has 0 MATIC. Get test MATIC from:');
    console.error('   https://faucet.polygon.technology (select Amoy testnet)');
    process.exit(1);
  }

  // Load compiled contract artifact
  const artifactPath = path.join(__dirname, '../artifacts/contracts/DIDMerkleRegistry.sol/DIDMerkleRegistry.json');

  if (!fs.existsSync(artifactPath)) {
    console.error('\n❌ Contract artifact not found. Compile first:');
    console.error('   npx hardhat compile');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log('\n⏳ Deploying DIDMerkleRegistry...');
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\n✅ Deployed: ${address}`);
  console.log(`⛓️  TX Hash:   ${contract.deploymentTransaction()?.hash}`);
  console.log(`🔍 Explorer: https://amoy.polygonscan.com/address/${address}`);

  // Write address to .env hint
  console.log('\n📋 Add to your .env:');
  console.log(`   MERKLE_CONTRACT_ADDRESS=${address}`);
  console.log(`   POLYGON_RPC_URL=${rpcUrl}`);
}

main().catch((err) => {
  console.error('Deploy failed:', err);
  process.exit(1);
});
