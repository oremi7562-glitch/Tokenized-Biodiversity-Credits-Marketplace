import { describe, it, expect, beforeEach } from "vitest";
import { uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_PROJECT_ID = 101;
const ERR_INVALID_AMOUNT = 102;
const ERR_ORACLE_NOT_CONFIRMED = 103;
const ERR_PROJECT_NOT_REGISTERED = 104;
const ERR_MINT_PAUSED = 105;
const ERR_EXCEEDS_MAX_MINT = 106;
const ERR_INVALID_TIMESTAMP = 107;
const ERR_AUTHORITY_NOT_VERIFIED = 108;
const ERR_INVALID_MIN_AMOUNT = 109;
const ERR_INVALID_MAX_PROJ_MINT = 110;
const ERR_UPDATE_NOT_ALLOWED = 111;
const ERR_INVALID_UPDATE_PARAM = 112;
const ERR_MAX_MINTS_EXCEEDED = 113;
const ERR_INVALID_VERIF_LEVEL = 114;
const ERR_INVALID_ECO_IMPACT = 115;
const ERR_INVALID_ORACLE_PRINC = 116;
const ERR_INVALID_TOKEN_CONTRACT = 117;
const ERR_INVALID_REGISTRY_CONTRACT = 118;
const ERR_INVALID_STATUS = 119;
const ERR_INVALID_BATCH_SIZE = 120;

interface MintedCredit {
  amount: number;
  timestamp: number;
  ecoImpact: number;
  verifLevel: number;
}

interface MintHistoryEntry {
  batchId: number;
  amount: number;
  timestamp: number;
}

interface BatchMint {
  totalAmount: number;
  count: number;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class CreditMinterMock {
  state: {
    minterAdmin: string;
    mintPaused: boolean;
    maxMintPerProject: number;
    minMintAmount: number;
    totalMinted: number;
    maxGlobalMint: number;
    oracleContract: string;
    tokenContract: string;
    registryContract: string;
    mintFee: number;
    lastMintTimestamp: number;
    mintedCredits: Map<number, MintedCredit>;
    mintHistory: Map<number, MintHistoryEntry[]>;
    projectMintTotals: Map<number, number>;
    projectStatus: Map<number, boolean>;
    batchMints: Map<number, BatchMint>;
  } = {
    minterAdmin: "ST1TEST",
    mintPaused: false,
    maxMintPerProject: 1000000,
    minMintAmount: 100,
    totalMinted: 0,
    maxGlobalMint: 100000000,
    oracleContract: "SP000000000000000000002Q6VF78.bogus-oracle",
    tokenContract: "SP000000000000000000002Q6VF78.biodiversity-token",
    registryContract: "SP000000000000000000002Q6VF78.project-registry",
    mintFee: 500,
    lastMintTimestamp: 0,
    mintedCredits: new Map(),
    mintHistory: new Map(),
    projectMintTotals: new Map(),
    projectStatus: new Map(),
    batchMints: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  stxTransfers: Array<{ amount: number; from: string; to: string }> = [];
  tokenMints: Array<{ amount: number; to: string }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      minterAdmin: "ST1TEST",
      mintPaused: false,
      maxMintPerProject: 1000000,
      minMintAmount: 100,
      totalMinted: 0,
      maxGlobalMint: 100000000,
      oracleContract: "SP000000000000000000002Q6VF78.bogus-oracle",
      tokenContract: "SP000000000000000000002Q6VF78.biodiversity-token",
      registryContract: "SP000000000000000000002Q6VF78.project-registry",
      mintFee: 500,
      lastMintTimestamp: 0,
      mintedCredits: new Map(),
      mintHistory: new Map(),
      projectMintTotals: new Map(),
      projectStatus: new Map(),
      batchMints: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.stxTransfers = [];
    this.tokenMints = [];
  }

  mockProjectDetails(projectId: number): boolean {
    return projectId > 0;
  }

  mockIsVerified(projectId: number): boolean {
    return projectId % 2 === 0;
  }

  setMinterAdmin(newAdmin: string): Result<boolean> {
    if (this.caller !== this.state.minterAdmin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newAdmin === this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.minterAdmin = newAdmin;
    return { ok: true, value: true };
  }

  setMintPaused(paused: boolean): Result<boolean> {
    if (this.caller !== this.state.minterAdmin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.mintPaused = paused;
    return { ok: true, value: true };
  }

  setMaxMintPerProject(newMax: number): Result<boolean> {
    if (this.caller !== this.state.minterAdmin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newMax <= 0) return { ok: false, value: ERR_INVALID_UPDATE_PARAM };
    this.state.maxMintPerProject = newMax;
    return { ok: true, value: true };
  }

  setMinMintAmount(newMin: number): Result<boolean> {
    if (this.caller !== this.state.minterAdmin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newMin <= 0) return { ok: false, value: ERR_INVALID_MIN_AMOUNT };
    this.state.minMintAmount = newMin;
    return { ok: true, value: true };
  }

  setOracleContract(newOracle: string): Result<boolean> {
    if (this.caller !== this.state.minterAdmin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newOracle === this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.oracleContract = newOracle;
    return { ok: true, value: true };
  }

  setTokenContract(newToken: string): Result<boolean> {
    if (this.caller !== this.state.minterAdmin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newToken === this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.tokenContract = newToken;
    return { ok: true, value: true };
  }

  setRegistryContract(newRegistry: string): Result<boolean> {
    if (this.caller !== this.state.minterAdmin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newRegistry === this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    this.state.registryContract = newRegistry;
    return { ok: true, value: true };
  }

  setMintFee(newFee: number): Result<boolean> {
    if (this.caller !== this.state.minterAdmin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (newFee < 0) return { ok: false, value: ERR_INVALID_UPDATE_PARAM };
    this.state.mintFee = newFee;
    return { ok: true, value: true };
  }

  activateProject(projectId: number): Result<boolean> {
    if (this.caller !== this.state.minterAdmin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (projectId <= 0) return { ok: false, value: ERR_INVALID_PROJECT_ID };
    this.state.projectStatus.set(projectId, true);
    return { ok: true, value: true };
  }

  deactivateProject(projectId: number): Result<boolean> {
    if (this.caller !== this.state.minterAdmin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (projectId <= 0) return { ok: false, value: ERR_INVALID_PROJECT_ID };
    this.state.projectStatus.set(projectId, false);
    return { ok: true, value: true };
  }

  mintCredits(projectId: number, amount: number, ecoImpact: number, verifLevel: number): Result<boolean> {
    if (this.state.mintPaused) return { ok: false, value: ERR_MINT_PAUSED };
    if (projectId <= 0) return { ok: false, value: ERR_INVALID_PROJECT_ID };
    if (amount < this.state.minMintAmount || amount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
    if (ecoImpact <= 0) return { ok: false, value: ERR_INVALID_ECO_IMPACT };
    if (verifLevel < 1 || verifLevel > 5) return { ok: false, value: ERR_INVALID_VERIF_LEVEL };
    if (this.blockHeight <= this.state.lastMintTimestamp) return { ok: false, value: ERR_INVALID_TIMESTAMP };
    if (!this.mockProjectDetails(projectId)) return { ok: false, value: ERR_PROJECT_NOT_REGISTERED };
    if (!this.mockIsVerified(projectId)) return { ok: false, value: ERR_ORACLE_NOT_CONFIRMED };
    if (!this.state.projectStatus.get(projectId)) return { ok: false, value: ERR_INVALID_STATUS };
    const currentTotal = this.state.projectMintTotals.get(projectId) || 0;
    if (currentTotal + amount > this.state.maxMintPerProject) return { ok: false, value: ERR_EXCEEDS_MAX_MINT };
    if (this.state.totalMinted + amount > this.state.maxGlobalMint) return { ok: false, value: ERR_MAX_MINTS_EXCEEDED };
    this.stxTransfers.push({ amount: this.state.mintFee, from: this.caller, to: this.state.minterAdmin });
    this.tokenMints.push({ amount, to: this.caller });
    this.state.mintedCredits.set(projectId, { amount, timestamp: this.blockHeight, ecoImpact, verifLevel });
    this.state.projectMintTotals.set(projectId, currentTotal + amount);
    this.state.totalMinted += amount;
    this.state.lastMintTimestamp = this.blockHeight;
    return { ok: true, value: true };
  }

  batchMintCredits(projectId: number, amounts: number[], ecoImpacts: number[], verifLevels: number[]): Result<boolean> {
    const size = amounts.length;
    if (this.state.mintPaused) return { ok: false, value: ERR_MINT_PAUSED };
    if (projectId <= 0) return { ok: false, value: ERR_INVALID_PROJECT_ID };
    if (size <= 0 || size > 50) return { ok: false, value: ERR_INVALID_BATCH_SIZE };
    if (!this.mockProjectDetails(projectId)) return { ok: false, value: ERR_PROJECT_NOT_REGISTERED };
    if (!this.mockIsVerified(projectId)) return { ok: false, value: ERR_ORACLE_NOT_CONFIRMED };
    if (!this.state.projectStatus.get(projectId)) return { ok: false, value: ERR_INVALID_STATUS };
    const batchTotal = amounts.reduce((a, b) => a + b, 0);
    const currentTotal = this.state.projectMintTotals.get(projectId) || 0;
    if (currentTotal + batchTotal > this.state.maxMintPerProject) return { ok: false, value: ERR_EXCEEDS_MAX_MINT };
    if (this.state.totalMinted + batchTotal > this.state.maxGlobalMint) return { ok: false, value: ERR_MAX_MINTS_EXCEEDED };
    this.stxTransfers.push({ amount: this.state.mintFee * size, from: this.caller, to: this.state.minterAdmin });
    let history: MintHistoryEntry[] = this.state.mintHistory.get(projectId) || [];
    for (let i = 0; i < size; i++) {
      const amount = amounts[i];
      const ecoImpact = ecoImpacts[i];
      const verifLevel = verifLevels[i];
      if (amount < this.state.minMintAmount || amount <= 0) return { ok: false, value: ERR_INVALID_AMOUNT };
      if (ecoImpact <= 0) return { ok: false, value: ERR_INVALID_ECO_IMPACT };
      if (verifLevel < 1 || verifLevel > 5) return { ok: false, value: ERR_INVALID_VERIF_LEVEL };
      this.tokenMints.push({ amount, to: this.caller });
      history.push({ batchId: i, amount, timestamp: this.blockHeight });
    }
    this.state.mintHistory.set(projectId, history);
    this.state.projectMintTotals.set(projectId, currentTotal + batchTotal);
    this.state.totalMinted += batchTotal;
    this.state.lastMintTimestamp = this.blockHeight;
    this.state.batchMints.set(projectId, { totalAmount: batchTotal, count: size });
    return { ok: true, value: true };
  }

  getMintedCredits(projectId: number): MintedCredit | undefined {
    return this.state.mintedCredits.get(projectId);
  }

  getMintHistory(projectId: number): MintHistoryEntry[] | undefined {
    return this.state.mintHistory.get(projectId);
  }

  getProjectMintTotal(projectId: number): number {
    return this.state.projectMintTotals.get(projectId) || 0;
  }

  getTotalMinted(): number {
    return this.state.totalMinted;
  }

  getMintPaused(): boolean {
    return this.state.mintPaused;
  }

  getMaxMintPerProject(): number {
    return this.state.maxMintPerProject;
  }

  isProjectActive(projectId: number): boolean {
    return this.state.projectStatus.get(projectId) || false;
  }
}

describe("CreditMinter", () => {
  let contract: CreditMinterMock;
  beforeEach(() => {
    contract = new CreditMinterMock();
    contract.reset();
  });

  it("mints credits successfully", () => {
    contract.activateProject(2);
    contract.blockHeight = 10;
    const result = contract.mintCredits(2, 200, 500, 3);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const minted = contract.getMintedCredits(2);
    expect(minted?.amount).toBe(200);
    expect(minted?.timestamp).toBe(10);
    expect(minted?.ecoImpact).toBe(500);
    expect(minted?.verifLevel).toBe(3);
    expect(contract.getProjectMintTotal(2)).toBe(200);
    expect(contract.getTotalMinted()).toBe(200);
    expect(contract.stxTransfers).toEqual([{ amount: 500, from: "ST1TEST", to: "ST1TEST" }]);
    expect(contract.tokenMints).toEqual([{ amount: 200, to: "ST1TEST" }]);
  });

  it("rejects mint when paused", () => {
    contract.setMintPaused(true);
    const result = contract.mintCredits(2, 200, 500, 3);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MINT_PAUSED);
  });

  it("rejects invalid project id", () => {
    const result = contract.mintCredits(0, 200, 500, 3);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_PROJECT_ID);
  });

  it("rejects invalid amount", () => {
    contract.activateProject(2);
    const result = contract.mintCredits(2, 50, 500, 3);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_AMOUNT);
  });

  it("activates and deactivates project", () => {
    contract.activateProject(4);
    expect(contract.isProjectActive(4)).toBe(true);
    contract.deactivateProject(4);
    expect(contract.isProjectActive(4)).toBe(false);
  });

  it("sets min mint amount", () => {
    const result = contract.setMinMintAmount(200);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.minMintAmount).toBe(200);
  });

  it("rejects non-admin setting min mint", () => {
    contract.caller = "ST2FAKE";
    const result = contract.setMinMintAmount(200);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("batch mints credits successfully", () => {
    contract.activateProject(4);
    contract.blockHeight = 20;
    const amounts = [150, 250];
    const ecoImpacts = [300, 400];
    const verifLevels = [2, 4];
    const result = contract.batchMintCredits(4, amounts, ecoImpacts, verifLevels);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const history = contract.getMintHistory(4);
    expect(history?.length).toBe(2);
    expect(history?.[0].amount).toBe(150);
    expect(history?.[1].amount).toBe(250);
    expect(contract.getProjectMintTotal(4)).toBe(400);
    expect(contract.getTotalMinted()).toBe(400);
    const batch = contract.state.batchMints.get(4);
    expect(batch?.totalAmount).toBe(400);
    expect(batch?.count).toBe(2);
    expect(contract.stxTransfers).toEqual([{ amount: 1000, from: "ST1TEST", to: "ST1TEST" }]);
    expect(contract.tokenMints).toEqual([{ amount: 150, to: "ST1TEST" }, { amount: 250, to: "ST1TEST" }]);
  });

  it("rejects batch mint with invalid size", () => {
    const amounts = Array(51).fill(100);
    const ecoImpacts = Array(51).fill(200);
    const verifLevels = Array(51).fill(3);
    const result = contract.batchMintCredits(4, amounts, ecoImpacts, verifLevels);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_BATCH_SIZE);
  });

  it("rejects batch mint with invalid amount in batch", () => {
    contract.activateProject(4);
    const amounts = [150, 50];
    const ecoImpacts = [300, 400];
    const verifLevels = [2, 4];
    const result = contract.batchMintCredits(4, amounts, ecoImpacts, verifLevels);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_AMOUNT);
  });

  it("uses clarity types for parameters", () => {
    const projectId = uintCV(5);
    const amount = uintCV(300);
    expect(projectId.value).toEqual(BigInt(5));
    expect(amount.value).toEqual(BigInt(300));
  });
});