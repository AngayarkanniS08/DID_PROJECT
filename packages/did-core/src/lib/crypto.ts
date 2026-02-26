import { Wallet, HDNodeWallet, verifyMessage, hashMessage } from 'ethers';


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
     * Strings a JSON object
     */
    static async signObject(obj: any, wallet: Wallet | HDNodeWallet): Promise<string> {
        const message = JSON.stringify(obj);
        return await wallet.signMessage(message);
    }
}

export class Verifier {
    /**
     * Verifies a signature and returns the recovered address
     */
    static verifyMessage(message: string, signature: string): string {
        return verifyMessage(message, signature);
    }

    /**
     * Verifies if a signature matches the expected signer address
     */
    static isValidSignature(message: string, signature: string, expectedAddress: string): boolean {
        const recoveredAddress = this.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    }
}
