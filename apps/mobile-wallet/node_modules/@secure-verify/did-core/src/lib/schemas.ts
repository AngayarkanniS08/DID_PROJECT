export const STUDENT_CREDENTIAL_SCHEMA = {
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1"
    ],
    "type": "StudentCredential",
    "credentialSubject": {
        "id": "did:polygon:student",
        "studentId": "string",
        "name": "string",
        "course": "string",
        "batch": "string"
    }
};

export const DEGREE_CREDENTIAL_SCHEMA = {
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1"
    ],
    "type": "DegreeCredential",
    "credentialSubject": {
        "id": "did:polygon:student",
        "degree": "string",
        "major": "string",
        "year": "string",
        "grade": "string"
    }
};
