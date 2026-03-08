
import { KeyManager, DIDGenerator } from './packages/did-core/src/index';

try {
    console.log('Testing Crypto...');
    const wallet = KeyManager.generateWallet();
    console.log('Wallet address:', wallet.address);
    const did = DIDGenerator.generateDID(wallet.address);
    console.log('DID:', did);
    console.log('Crypto test PASSED');
} catch (err) {
    console.error('Crypto test FAILED:', err);
    process.exit(1);
}
