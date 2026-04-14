export interface QRPayload {
  did: string;
  timestamp: number;
  nonce: string;
  context: string;
  signature?: string;
}

export interface StudentCredential {
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: {
    id: string; // The DID of the student
    name: string;
    studentId: string;
    course: string;
    batch: string;
  };
  proof?: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
}
