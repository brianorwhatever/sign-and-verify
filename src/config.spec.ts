import { expect, assert } from 'chai';
import { createSandbox } from 'sinon';
import 'mocha';

import { parseConfig, getConfig, resetConfig, Config } from './config';
import { credentialRequestHandler } from './issuer-helper';
import { ConfigurationError } from './errors';

const sandbox = createSandbox();

const didSeed = 'DsnrHBHFQP0ab59dQELh3uEwy7i5ArcOTwxkwRO2hM87CBRGWBEChPO7AjmwkAZ2';
const expectedConfig: Config = {
  port: 5000,
  didSeed,
  hmacSecret: null,
  hmacRequiredHeaders: ["date", "digest"],
  digestCheck: false,
  digestAlorithms: ["SHA256", "SHA512"],
  demoIssuerMethod: null,
  issuerMembershipRegistryUrl: "https://digitalcredentials.github.io/issuer-registry/registry.json",
  credentialRequestHandler
};
const validEnv = {
  DID_SEED: didSeed
};

describe("config", () => {
  beforeEach(() => {
    sandbox.stub(process, "env").value(validEnv);
    resetConfig();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe("#parseConfig()", () => {
    it("should use defaults if optional variables not set", () => {
      expect(parseConfig()).to.deep.equal(expectedConfig);
    });

    it("should parse env.PORT", () => {
      sandbox.stub(process, "env").value({
        ...validEnv,
        PORT: "6739"
      });
      expect(parseConfig()).to.deep.equal({
        ...expectedConfig,
        port: 6739,
      });
    });

    it("should parse env.HMAC_SECRET", () => {
      const hmacSecret = "abc123";
      sandbox.stub(process, "env").value({
        ...validEnv,
        HMAC_SECRET: hmacSecret
      });
      expect(parseConfig()).to.deep.equal({
        ...expectedConfig,
        hmacSecret
      });
    });

    it("should parse env.HMAC_REQUIRED_HEADERS", () => {
      sandbox.stub(process, "env").value({
        ...validEnv,
        HMAC_REQUIRED_HEADERS: "abc,def, gher, asf"
      });
      expect(parseConfig()).to.deep.equal({
        ...expectedConfig,
        hmacRequiredHeaders: ["abc", "def", "gher", "asf"],
      });
    });

    ;[
      ['true', true],
      ['True', true],
      ['TRUE', true],
      ['false', false],
      ['123', false],
      ['', false],
      [undefined, false],
    ].forEach(([value, expected]) => {
      it(`should parse env.DIGEST_CHECK with value=${value}`, () => {
        sandbox.stub(process, "env").value({
          ...validEnv,
          DIGEST_CHECK: value,
        });
        expect(parseConfig()).to.deep.equal({
          ...expectedConfig,
          digestCheck: expected
        });
      });
    });

    it("should parse env.DIGEST_ALGORITHMS", () => {
      sandbox.stub(process, "env").value({
        ...validEnv,
        HMAC_REQUIRED_HEADERS: "abc,def, gher, asf"
      });
      expect(parseConfig()).to.deep.equal({
        ...expectedConfig,
        hmacRequiredHeaders: ["abc", "def", "gher", "asf"],
      });
    });

    it("should parse env.DEMO_ISSUER_METHOD", () => {
      sandbox.stub(process, "env").value({
        ...validEnv,
        DEMO_ISSUER_METHOD: "did:example:123#abc"
      });
      expect(parseConfig()).to.deep.equal({
        ...expectedConfig,
        demoIssuerMethod: "did:example:123#abc"
      });
    });

    it("should throw an exception if env.DID_SEED isn't set", () => {
      sandbox.stub(process, "env").value({});
      assert.throws(parseConfig, ConfigurationError, "Environment variable 'DID_SEED' is not set");
    });
  });

  describe("#getConfig()", () => {
    it("only calls parseConfig() once", () => {
      expect(getConfig()).to.deep.equal(expectedConfig);
      // specify a new port to test that this isn't re-parsed
      sandbox.stub(process, "env").value({
        ...validEnv,
        PORT: "6739"
      });
      expect(getConfig()).to.deep.equal(expectedConfig);
    });
  });
});
