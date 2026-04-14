import { computeAddress } from 'ethers';

export class DIDGenerator {
    /**
     * Generates a DID string from an Ethereum address
     * Format: did:polygon:<address>
     */
    static generateDID(address: string): string {
        return `did:polygon:${address.toLowerCase()}`;
    }

    /**
     * Extracts the Ethereum address from a DID string
     */
    static extractAddress(did: string): string {
        const parts = did.split(':');
        if (parts.length < 3 || parts[0] !== 'did' || parts[1] !== 'polygon') {
            throw new Error('Invalid DID format. Expected did:polygon:<address>');
        }
        return parts[2];
    }

    /**
     * Computes address from public key and returns DID
     */
    static fromPublicKey(publicKey: string): string {
        const address = computeAddress(publicKey);
        return this.generateDID(address);
    }
}
