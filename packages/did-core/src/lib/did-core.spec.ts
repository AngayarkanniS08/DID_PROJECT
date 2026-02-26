import { KeyManager, Signer, Verifier } from './crypto';
import { DIDGenerator } from './did';

describe('did-core', () => {
  it('should generate a valid wallet and sign a message', async () => {
    const wallet = KeyManager.generateWallet();
    expect(wallet.address).toBeDefined();
    expect(wallet.privateKey).toBeDefined();

    const message = 'Hello SecureVerify';
    const signature = await Signer.signMessage(message, wallet);
    expect(signature).toBeDefined();

    const recoveredAddress = Verifier.verifyMessage(message, signature);
    expect(recoveredAddress).toEqual(wallet.address);
  });

  it('should generate a correct DID from address', () => {
    const address = '0x1234567890123456789012345678901234567890';
    const did = DIDGenerator.generateDID(address);
    expect(did).toEqual(`did:polygon:${address.toLowerCase()}`);
  });

  it('should extract address from DID', () => {
    const address = '0x1234567890123456789012345678901234567890';
    const did = `did:polygon:${address.toLowerCase()}`;
    const extracted = DIDGenerator.extractAddress(did);
    expect(extracted).toEqual(address.toLowerCase());
  });
});
