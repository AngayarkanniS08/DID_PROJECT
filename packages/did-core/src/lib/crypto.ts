import { Wallet, HDNodeWallet, verifyMessage, Signature, hashMessage } from 'ethers';


export class KeyManager {
    /**
     * Generates a new random wallet (Private/Public Key Pair)
     */
    static generateWallet(): HDNodeWallet {
        return Wallet.createRandom();
    }

    /**
     * Creates a Wallet instance from a private key
     */
    static getWalletFromPrivateKey(privateKey: string): Wallet {
        return new Wallet(privateKey);
    }
}

export class Signer {
    /**
     * Signs a string payload with a private key
     */
    static async signMessage(message: string, wallet: Wallet | HDNodeWallet): Promise<string> {
        return await wallet.signMessage(message);
    }

    /**
     * Canonical JSON Stringify (Ensures consistent key ordering)
     * Handles nested objects and arrays recursively
     */
    static canonicalStringify(obj: any): string {
        const getSortedObject = (input: any): any => {
            if (input === null || typeof input !== 'object') {
                return input;
            }

            if (Array.isArray(input)) {
                return input.map(getSortedObject);
            }

            const sortedKeys = Object.keys(input).sort();
            const result: any = {};
            for (const key of sortedKeys) {
                result[key] = getSortedObject(input[key]);
            }
            return result;
        };

        const sorted = getSortedObject(obj);
        return JSON.stringify(sorted);
    }

    /**
     * Signs a JSON object deterministically
     */
    static async signObject(obj: any, wallet: Wallet | HDNodeWallet): Promise<string> {
        const message = this.canonicalStringify(obj);
        return await wallet.signMessage(message);
    }
}

export class Verifier {
    /**
     * Verifies a signature and returns the recovered address
     * ✅ CWE-327 FIXED: Low-S enforcement to prevent signature malleability
     */
    static verifyMessage(message: string, signature: string): string {
        const sig = Signature.from(signature);

        // SECP256K1 Curv Order N
        const EC_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;

        // Check for High-S (Malleable) signatures
        if (BigInt(sig.s) > EC_N / 2n) {
            throw new Error("Invalid Signature: High-S malleability detected. Signature rejected for security.");
        }

        return verifyMessage(message, signature);
    }

    /**
     * Verifies if a signature matches the expected signer address
     */
    static isValidSignature(message: string, signature: string, expectedAddress: string): boolean {
        const recoveredAddress = this.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    }

    /**
     * High-level helper to verify any identity JSON object.
     * 1. Extracts the signature ('sig' or 'proof.jws')
     * 2. Reconstructs the original signed data (everything else)
     * 3. Recovers the signer's identity
     */
    static verifyIdentity(payload: any, expectedSignerAddress: string): {
        isValid: boolean;
        recoveredAddress: string;
        error?: string;
    } {
        try {
            if (!payload) return { isValid: false, recoveredAddress: '', error: "Empty payload" };

            // 1. Find the signature (Support both simplified 'sig' and full VC 'proof.jws')
            const signature = payload.sig || (payload.proof && payload.proof.jws);
            if (!signature) {
                return { isValid: false, recoveredAddress: '', error: "No cryptographic proof found" };
            }

            // 2. Reconstitute the signed content (use canonical stringification)
            const { sig, proof, ...signedData } = payload;
            const message = Signer.canonicalStringify(signedData);

            // 3. Recover the public address of whoever signed this
            const recoveredAddress = this.verifyMessage(message, signature);
            const isValid = recoveredAddress.toLowerCase() === expectedSignerAddress.toLowerCase();

            return {
                isValid,
                recoveredAddress,
                error: isValid ? undefined : "Signature mismatch"
            };
        } catch (err: any) {
            return { isValid: false, recoveredAddress: '', error: err.message };
        }
    }
}
