# sign-and-verify

A minimal REST service that demonstrates signing and verification functionality. It relies on [sign-and-verify-core](https://github.com/digitalcredentials/sign-and-verify-core)

The REST service implements a subset of the W3C CCG [vc-http-api draft standard](https://w3c-ccg.github.io/vc-http-api/).

# Getting started

## Configuration

Follow these steps to properly configure a `sign-and-verify` service deployment for your organization:

1. Configure the service with the following environment variables:

- `DID_SEED` - a secret seed used to generate DID document for issuer (required)
- `ISSUER_MEMBERSHIP_REGISTRY_URL` - location of registry used to confirm issuer's membership status in DCC (required)
- `PORT` - the port the web service will bind to (optional, default: `5000`)
- `DIGEST_CHECK` - set to `true` to enable `Digest` header verification (optional, default: `false`)
- `DIGEST_ALGORITHMS` - a comma-delimited list of acceptable digest algorithms (optional, default: `sha256,sha512`)
- `HMAC_SECRET` - set to the shared HMAC secret to require [HMAC signing](https://tools.ietf.org/html/draft-ietf-httpbis-message-signatures-00) of the request via the `Signature` header (optional, default: `null`)
- `HMAC_REQUIRED_HEADERS` - a comma-delimited list of headers that are required to be in the HMAC signature (optional, default: `date,digest`)
- `DB_USER` - database client username (optional)
- `DB_PASS` - database client password (optional)
- `DB_HOST` - database client hostname (optional)

2. Copy `.env.example` to `.env`, which `npm run start` will pick up, to test these values.

3. Modify the `DatabaseClient` class in `./src/database.ts` to suit your organization's DBMS deployment infrastructure

4. Modify the `credentialRequestHandler` method in `./src/issuer-helper.ts` to suit your organization's DBMS deployment infrastructure

5. Run `npm run setup` or `yarn setup` and follow output deployment instructions (please use Node version 14 or higher)

NOTE: the `DID_SEED` included as an example is just for your reference. Do not check in production did seeds, private keys, or the equivalent.

## Install

```
npm run install
```

## Build

```
npm run build
```

## Run

```
npm run start
```

## Test

```
npm run test
```

# Basic Concepts

This assumes familiarity with the basics of the [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/). Two key concepts are:

- [Verifiable Credential](https://www.w3.org/TR/vc-data-model/#credentials)
- [Verifiable Presentation](https://www.w3.org/TR/vc-data-model/#presentations)

The REST API exposed by this service implements a subset of the [vc-http-api](https://w3c-ccg.github.io/vc-http-api/vc-http-api) draft standard and also includes some non-standard convenience endpoints.

The vc-http-api can be confusing when getting started, partly because it contains APIs for issuer, holders, and verifiers. Actual deployments would involve different endpoints for differely roles; or, put differently, a single instance of this service is not intended to be used by issuers, holders, and verifiers. The vc-http-api currently lacks high-level documentation, so this README provides verbose descriptions about what these APIs are used for. But these APIs ultimately (should eventually) comply with [vc-http-api](https://w3c-ccg.github.io/vc-http-api/).

# API Docs

## Issue Credential

For issuers when signing a Verifiable Credential.

### General Format

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"credential": <Verifiable Credential To Sign>, \
          "options": <Signing Options>' \
  <sign-and-verify-service>/issue/credentials
```

### Example

Request:

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"credential": {"@context":["https://www.w3.org/2018/credentials/v1","https://w3id.org/security/suites/ed25519-2020/v1"],"id":"http://example.gov/credentials/3732","type":["VerifiableCredential"],"issuer":"did:web:digitalcredentials.github.io","issuanceDate":"2020-03-10T04:24:12.164Z","credentialSubject":{"id":"did:example:abcdef"}}, "options": {"verificationMethod":"did:web:digitalcredentials.github.io#z6MkrXSQTybtqyMasfSxeRBJxDvDUGqb7mt9fFVXkVn6xTG7"}}' \
  http://127.0.0.1:5000/issue/credentials
```

Response Codes:
- 201: success (with signed Verifiable Credential)
- 400: invalid input
- 500: error

[Reference: vc-http-api /issue/credentials](https://w3c-ccg.github.io/vc-http-api/#/Issuer/issueCredential)

## Verify Presentation

For verifiers to verify (check the proof) of a Verifiable Presentation (VP).

Current DCC implementations also use this endpoint for a special case of VP verification, to implement a lightweight version of DID auth. The  learner's wallet generates a VP proving control over the DID (it's a VP without a VC), and the issuer checks the proof.

Additional implementation details are [Overview of Credential Request Flow](#Overview-of-Credential-Request-Flow)

### General Format

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"verifiablePresentation": <Verifiable Presentation>, \
            "options": <Verification Options>' \
    <sign-and-verify-service>/verify/presentations
```

### Example

Request:

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"verifiablePresentation": {"@context":["https://www.w3.org/2018/credentials/v1","https://w3id.org/security/suites/ed25519-2020/v1"],"type":["VerifiablePresentation"],"id":"123","holder":"did:key:z6MkoSu3TY7zYt7RF9LAqXbW7VegC3SFAdLp32VWudSfv8Qy","proof":{"type":"Ed25519Signature2020","created":"2021-05-01T23:38:10Z","verificationMethod":"did:key:z6MkoSu3TY7zYt7RF9LAqXbW7VegC3SFAdLp32VWudSfv8Qy#z6MkoSu3TY7zYt7RF9LAqXbW7VegC3SFAdLp32VWudSfv8Qy","proofPurpose":"authentication","challenge":"test123","proofValue":"z3Ukrcvwg59pPywog48R6xB6Fd5XWmPazqPCjdpaXpdKzaeNAc1Un1EF8VnVLbf4nvRk5SGiVDvgxddS66bi7kdAo"}}, "options": {"verificationMethod":"did:web:digitalcredentials.github.io#z6MkrXSQTybtqyMasfSxeRBJxDvDUGqb7mt9fFVXkVn6xTG7","challenge":"test123"}}' \
  http://127.0.0.1:5000/verify/presentations
```

Response Codes:

- 200: success
    - Specifically, it means the API request was successful AND the VP was verified
    - VerificationResult details below
- 400: invalid input
- 500: error

Note: VerificationResult from vc-http-api isn't especially helpful at the moment, so we pass along non-standard verification metadata. Response code 200 means it's successfully verified. Additionally, in case of success, we return the non-standard `holder` field for convenience. In this example, the VerificationResult is:

```
{
   holder : did:web:digitalcredentials.github.io
}
```

[Reference: vc-http-api /verify/presentations](https://w3c-ccg.github.io/vc-http-api/#/Verifier/verifyPresentation)


## Verify Credential

Used to verify a Verifable Credential.

### General Format

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"verifiableCredential": <Verifiable Credential>, \
            "options": <Verification Options>' \
    <sign-and-verify-service>/verify/credentials
```


### Example

Request:

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"verifiableCredential": {"@context":["https://www.w3.org/2018/credentials/v1","https://w3id.org/security/suites/ed25519-2020/v1"],"id":"http://example.gov/credentials/3732","type":["VerifiableCredential"],"issuer":"did:web:digitalcredentials.github.io","issuanceDate":"2020-03-10T04:24:12.164Z","credentialSubject":{"id":"did:example:abcdef"},"proof":{"type":"Ed25519Signature2020","created":"2021-05-04T18:59:42Z","verificationMethod":"did:web:digitalcredentials.github.io#z6MkrXSQTybtqyMasfSxeRBJxDvDUGqb7mt9fFVXkVn6xTG7","proofPurpose":"assertionMethod","proofValue":"z4jnMia8Q1EDAQDNnurAnQgNmc1PmhrXx87j6zr9rjvrpGqSFxcHqJf55HjQPJm7Qj712KU3DXpNF1N6gYh77k9M3"}}, "options": {"verificationMethod":"did:web:digitalcredentials.github.io#z6MkrXSQTybtqyMasfSxeRBJxDvDUGqb7mt9fFVXkVn6xTG7"}}' \
  http://127.0.0.1:5000/verify/credentials
```

Response Codes:
- 200: success, and Verifiable Credential successfully verified.
- 400: invalid input
- 500: error

Note: VerificationResult from vc-http-api isn't especially helpful at the moment, so we pass along verification metadata. But response code 200 means it's successfully verified.


## Request a Demo Credential

 `<REQUEST_PAYLOAD>` is a Verifiable Presentation proving control of the did. See details below.

### Example with DID proof of control
```
curl --header "Content-Type: application/json" \
  --request POST \
  --data <REQUEST_PAYLOAD> \
  http://127.0.0.1:5000/request/democredential
```

### Example without DID proof of control
```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"holder": "did:example:me"}' \
  http://127.0.0.1:5000/request/democredential/nodidproof
```  

# Overview of Credential Request Flow

The vc-http-api standard doesn't include specific methods related to credential request. Similarly, the credential request protocol is not overly-specified by DCC, to allow issuers flexibility to adapt it to their processes. But there are certain request/response elements expected by the DCC wallet, which this service can help with. This section describes how the DCC credential request flow relates to sign-and-verify

## Request Structure

A credential request coming from the DCC wallet will be of the form:

```
curl --header "Content-Type: application/json" \
  --header "Authorization: Bearer <TOKEN>" \
  --request POST \
  --data <REQUEST_PAYLOAD> \
   <request_endpoint>
```

`request_endpoint` is provided by the issuer as part of the [DEEP_LINK](https://github.com/digitalcredentials/docs/blob/main/request/credential_request.md#request-credential-initial-state) to the DCC wallet. The DCC wallet will parse it from the DEEP_LINK and call it during the credential request.

`REQUEST_PAYLOAD` has structure described by the [generate proof of control response](#Generate-proof-of-control). It's recommended that issuers verify several aspects of payload; relevant fields are highlighted below.

```
{
    "@context": ...
    ...
    "type": ["VerifiablePresentation"],
    "holder": <HOLDER_DID>,
    "proof": {
      "challenge": "<Expected 1-time challenge>",
      "verificationMethod": {
        "id": <Used for VP verification options>
      }
      ...
    }
}
```

About `REQUEST_PAYLOAD`:
- `HOLDER_DID` is the subject DID the issuer would issue the credential to
- `challenge` is expected to match the challenge the issuer previously provided in the links
- `proof.verificationMethod.id` will be used as an argument when verifying the VP


## DID (Proof of Control) Verification

It's recommended that the issuer verify the `REQUEST_PAYLOAD` provided by the learner's DCC wallet before issuing the credential

Issuers can use the `/verify/presentations` endpoint described above to verify the DID contained in the subject's credential request.

The general structure of a `/verify/presentations` call looks like this:

```
curl --header "Content-Type: application/json"  \
    --request POST \
    --data '{ verifiablePresentation: "<REQUEST_PAYLOAD>", \
      options: { \
      verificationMethod: "<REQUEST_PAYLOAD.proof.verificationMethod.id>", \
      challenge: "<Expected 1-time challenge>" }' \
    <sign-and-verify-endpoint>/verify/presentations
```

As described in [Verify Presentation](#Verify-Presentation), response code 200 means it's successfully verified. Additionally, in case of success, we return the non-standard `holder` field for convenience. In this example, the VerificationResult is:

```
{
   holder : did:web:digitalcredentials.github.io
}
```

## Security

In order to ensure that requests to issue digital credentials are from a trusted source, there are two security mechanisms in place that work to establish a chain of trust.

### Digest Verification

In order to verify the integrity of incoming requests, there is an optional validation of the integrity of the request body. This is done by comparing the hash of the body against the hash provided in the `Digest` header, using the hash algorithm specified by the header. The header is required to be in the form of `Digest: {ALGORITHM}={HASH}`.

If the verification fails a response with a 400 status code and an appropriate error message are returned.

### HMAC Signature Verification

Digest Verification alone only isn't useful if the header and request body have been tampered with. To combat this, a request signature check can be made which verifies the signature of the request headers using a shared HMAC secret. Only a client that knows this secret will be able to generate a correct signature.

This, combined with Digest Verification, ensures that a) the request (specifically the headers in the signature) came from a trusted source and b) the request contents (encapsulated by the `Digest` header, which is part of the signature) haven't been tampered with and can be trusted.

## Generate a test control proof 

This generates a sample payload that would come from a wallet

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '$PARAMS' \
    <sign-and-verify-service>/generate/controlproof
```

Where PARAMS looks like:
```
PARAMS = {
  "presentationId": "456",
  "holder": "did:web:digitalcredentials.github.io",
  "verificationMethod": "did:web:digitalcredentials.github.io#z6MkrXSQTybtqyMasfSxeRBJxDvDUGqb7mt9fFVXkVn6xTG7",
  "challenge": "123"
}
```
