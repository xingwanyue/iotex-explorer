// @flow

import type {TWallet, TRawTransfer, TRawVote, TRawExecutionRequest} from '../../../entities/wallet-types';
import {logger} from '../../../lib/integrated-gateways/logger';
import type {GExecution} from '../iotex-core/iotex-core-types';

const grpc = require('grpc');
const messages = require('./rpc_pb');
const services = require('./rpc_grpc_pb');

type Opts = {
  serverUrl: string,
}

function makeMessagesAddress(wallet: TWallet): any {
  const address = new messages.Address();
  address.setPublickey(wallet.publicKey);
  address.setPrivatekey(wallet.privateKey);
  address.setRawaddress(wallet.rawAddress);
  return address;
}

type WalletTransfer = {
  nonce: number,
  signature: string,
  amount: string,
  sender: string,
  recipient: string,
  payload: string,
  gasLimit: number,
  gasPrice: string,
  version: number,
  isCoinbase: boolean,
  senderPubKey: string,
}

function makeMessagesTransfer(transfer: WalletTransfer): any {
  const t = new messages.Transfer();
  t.setNonce(transfer.nonce);
  t.setSignature(transfer.signature);
  t.setAmount(transfer.amount);
  t.setSender(transfer.sender);
  t.setRecipient(transfer.recipient);
  t.setPayload(transfer.payload);
  t.setGaslimit(transfer.gasLimit);
  t.setGasprice(transfer.gasPrice);
  t.setVersion(transfer.version);
  t.setIscoinbase(transfer.isCoinbase);
  t.setSenderpubkey(transfer.senderPubKey);
  return t;
}

type WalletVote = {
  nonce: number,
  signature: string,
  voterAddress: string,
  voteeAddress: string,
  gasLimit: number,
  gasPrice: string,
  version: number,
  selfPubKey: string,
}

function makeMessagesVote(vote: WalletVote): any {
  const v = new messages.Vote();
  v.setNonce(vote.nonce);
  v.setSignature(vote.signature);
  v.setVoteraddress(vote.voterAddress);
  v.setVoteeaddress(vote.voteeAddress);
  v.setGaslimit(vote.gasLimit);
  v.setGasprice(vote.gasPrice);
  v.setVersion(vote.selfPubKey);
  return v;
}

type WalletSmartContract = {
  nonce: number,
  signature: string,
  amount: string,
  executor: string,
  contract: string,
  gasLimit: number,
  gasPrice: string,
  data: string,
  version: number,
  executorPubKey: string,
}

function makeMessagesExecution(smartContract: WalletSmartContract, executor: string): any {
  const sc = new messages.Execution();
  sc.setNonce(smartContract.nonce);
  sc.setSignature(smartContract.signature);
  sc.setAmount(smartContract.amount);
  sc.setExecutor(executor);
  sc.setContract(smartContract.contract);
  sc.setGaslimit(smartContract.gasLimit);
  sc.setGasprice(smartContract.gasPrice);
  sc.setData(smartContract.data);
  sc.setVersion(smartContract.version);
  sc.setExecutorpubkey(smartContract.executorPubKey);
  return sc;
}

export class WalletCore {
  client: any;
  logger: any;

  constructor(opts: Opts) {
    logger.info('Initializing Wallet Core on:', opts.serverUrl);
    // eslint-disable-next-line new-cap
    this.client = new services.walletServiceClient(opts.serverUrl, grpc.credentials.createInsecure());
  }

  // get the address detail of an iotex address
  async generateWallet(): Promise<TWallet> {
    const request = new messages.NewWalletRequest();

    return new Promise((resolve, reject) => {
      this.client.newWallet(request, (error, response) => {
        if (!error) {
          const address = response.getAddress();
          const wallet = {
            publicKey: address.getPublickey(),
            privateKey: address.getPrivatekey(),
            rawAddress: address.getRawaddress(),
          };
          resolve(wallet);
        } else {
          logger.error(error);
          reject(error.details);
        }
      });
    });
  }

  // get list of transfers by start block height, transfer offset and limit
  async unlockWallet(priKey: string): Promise<TWallet> {
    const request = new messages.UnlockRequest();
    request.setPrivatekey(priKey);

    return new Promise((resolve, reject) => {
      this.client.unlock(request, (error, response) => {
        if (!error) {
          const address = response.getAddress();
          const wallet = {
            publicKey: address.getPublickey(),
            privateKey: address.getPrivatekey(),
            rawAddress: address.getRawaddress(),
          };
          resolve(wallet);
        } else {
          logger.error(error);
          reject(error.details);
        }
      });
    });
  }

  async signTransfer(wallet: TWallet, transfer: TRawTransfer): Promise<TRawTransfer> {
    const request = new messages.SignTransferRequest();
    const address = makeMessagesAddress(wallet);
    const t = makeMessagesTransfer(transfer);
    request.setAddress(address);
    request.setTransfer(t);

    return new Promise((resolve, reject) => {
      this.client.signTransfer(request, (error, response) => {
        if (!error) {
          const res = response.getTransfer();
          const signedTransfer: TRawTransfer = {
            nonce: res.getNonce(),
            signature: res.getSignature(),
            amount: res.getAmount(),
            sender: res.getSender(),
            recipient: res.getRecipient(),
            payload: res.getPayload(),
            gasLimit: res.getGaslimit(),
            gasPrice: res.getGasprice(),
            version: res.getVersion(),
            senderPubKey: res.getSenderpubkey(),
            isCoinbase: res.getIscoinbase(),
          };
          resolve(signedTransfer);
        } else {
          logger.error(error);
          reject(error.details);
        }
      });
    });
  }

  async signVote(wallet: TWallet, vote: TRawVote): Promise<TRawVote> {
    const request = new messages.SignVoteRequest();
    const address = makeMessagesAddress(wallet);
    const v = makeMessagesVote(vote);
    request.setAddress(address);
    request.setVote(v);

    return new Promise((resolve, reject) => {
      this.client.signVote(request, (error, response) => {
        if (!error) {
          const res = response.getVote();
          const signedVote: TRawVote = {
            nonce: res.getNonce(),
            signature: res.getSignature(),
            voter: res.getVoteraddress(),
            votee: res.getVoteeaddress(),
            voterPubKey: res.getSelfpubkey(),
            gasLimit: res.getGaslimit(),
            gasPrice: res.getGasprice(),
          };
          resolve(signedVote);
        } else {
          logger.error(error);
          reject(error.details);
        }
      });
    });
  }

  async signSmartContract(wallet: TWallet, smartContract: TRawExecutionRequest): Promise<GExecution> {
    const request = new messages.SignExecutionRequest();
    const address = makeMessagesAddress(wallet);
    const sc = makeMessagesExecution(smartContract, wallet.rawAddress);
    request.setAddress(address);
    request.setExecution(sc);

    return new Promise((resolve, reject) => {
      this.client.signExecution(request, (error, response) => {
        if (!error) {
          const res = response.getExecution();
          const signedExecution = {
            version: res.getVersion(),
            nonce: res.getNonce(),
            signature: res.getSignature(),
            executorPubKey: res.getExecutorpubkey(),
            amount: res.getAmount(),
            executor: res.getExecutor(),
            contract: res.getContract(),
            gasLimit: res.getGaslimit(),
            gasPrice: res.getGasprice(),
            data: res.getData(),
          };
          resolve(signedExecution);
        } else {
          logger.error(error);
          reject(error.details);
        }
      });
    });
  }
}
