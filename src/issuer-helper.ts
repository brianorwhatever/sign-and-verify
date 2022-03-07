// NOTE: The operations in this file are specific to MongoDB
// and the database schema used in early deployments of this code.
// You may modify the content of credentialRequestHandler to
// suit your organization's DBMS deployment infrastructure

import fs from "fs";
import path from "path";
import jwt_decode from "jwt-decode";
import Handlebars from "handlebars";
import { dbCredClient } from "./database";

// NOTE: FEEL FREE TO ALTER IT TO CONTAIN LOGIC FOR RETRIEVING CREDENTIALS FOR LEARNERS IN YOUR ORG
// NOTE: HOLDER ID IS GENERATED FROM AN EXTERNAL WALLET, NOT THE ISSUER
// Method for issuer to retrieve credential on behalf of learner
const credentialRequestHandler = async (
  issuerId: string,
  holderId: string,
  idToken: string
): Promise<any> => {
  // NOTE: using one credential type for now
  // Select credential type
  const credentialType = "ID";
  // NOTE: CREDENTIAL ID IS THE LEARNER EMAIL IN EARLY DEPLOYMENTS OF THIS CODE
  // Select credential primary key
  const primaryKey = "credentialSubject.email";
  // Extract email from ID token
  const idObject: any = jwt_decode(idToken);
  const email = idObject.email;
  if (!email) {
    throw new Error("ID token does not contain email");
  }

  // const CredentialModel = await dbCredClient.open();
  // const credentialQuery = { [primaryKey]: email };
  // const credentialRecord = await CredentialModel.findOne(credentialQuery);
  // await dbCredClient.close();
  const credentialRecord = {
    name: "Digital ID",
    description:
      "This is an Ontario Digital ID Credential issued by Ontario Digital Services",
    issuanceDate: "2022-02-14T19:25:35Z",
    issuer: {
      name: "Ontario Digital Services",
      url: "https://ontario.ca",
      image:
        "https://www.ontario.ca/themes/ontario_2021/assets/ontario-logo--desktop.svg",
    },
    credentialSubject: {
      name: "Brian Richter",
      hasCredential: {
        type: ["Person"],
        givenName: "Brian",
        familyName: "Richter",
        birthDate: "02-21-1989",
        address: "1208 Wharf St.",
      },
    },
  };
  if (!credentialRecord) {
    return Promise.resolve({});
  }

  // Populate credential config
  const credentialConfig = {
    ISSUER_DID: issuerId,
    LEARNER_DID: holderId,
    CREDENTIAL_NAME: credentialRecord.name,
    CREDENTIAL_DESC: credentialRecord.description,
    ISSUANCE_DATE: credentialRecord.issuanceDate,
    ISSUER_NAME: credentialRecord.issuer.name,
    ISSUER_URL: credentialRecord.issuer.url,
    ISSUER_IMAGE: credentialRecord.issuer.image,
    LEARNER_NAME: credentialRecord.credentialSubject.name,
    LEARNER_GIVEN_NAME:
      credentialRecord.credentialSubject.hasCredential.givenName,
    LEARNER_FAMILY_NAME:
      credentialRecord.credentialSubject.hasCredential.familyName,
    LEARNER_BIRTH_DATE:
      credentialRecord.credentialSubject.hasCredential.birthDate,
    LEARNER_ADDRESS: credentialRecord.credentialSubject.hasCredential.address,
  };

  // Select desired credential template
  const templateFileName = path.resolve(
    __dirname,
    `./templates/${credentialType}.json`
  );
  const template = fs.readFileSync(templateFileName, { encoding: "utf8" });
  const templateHbars = Handlebars.compile(template);
  const credential = JSON.parse(templateHbars(credentialConfig));
  return Promise.resolve(credential);
};

export { credentialRequestHandler };
