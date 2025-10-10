import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface ArtMeta {
  'sha256' : Uint8Array | number[],
  'mime' : string,
  'size' : bigint,
  'chunks' : bigint,
}
export interface FeeInvoice {
  'memo' : [] | [bigint],
  'subaccount' : [] | [Uint8Array | number[]],
  'amount' : bigint,
}
export interface RewardResult { 'token_id' : bigint, 'reward_txid' : string }
export type Status = { 'Rewarded' : null } |
  { 'Rejected' : { 'reason' : string } } |
  { 'PendingUpload' : null } |
  { 'AwaitingFee' : null } |
  { 'Verified' : { 'originality' : number, 'visibility' : number } } |
  { 'Verifying' : null };
export interface Submission {
  'id' : bigint,
  'art' : [] | [ArtMeta],
  'status' : Status,
  'updated_at' : bigint,
  'creator' : Principal,
  'nft_token_id' : [] | [bigint],
  'created_at' : bigint,
  'fee_paid' : boolean,
}
export interface _SERVICE {
  'confirm_fee' : ActorMethod<[bigint], undefined>,
  'finalize_asset' : ActorMethod<
    [bigint, string, bigint, Uint8Array | number[]],
    undefined
  >,
  /**
   * --- Reward flow ---
   */
  'finalize_reward' : ActorMethod<[bigint], RewardResult>,
  /**
   * --- Fee flow ---
   */
  'get_fee_invoice' : ActorMethod<[bigint], FeeInvoice>,
  /**
   * --- Queries ---
   */
  'get_submission' : ActorMethod<[bigint], [] | [Submission]>,
  'override_verdict' : ActorMethod<[bigint, Status, string], undefined>,
  'put_chunk' : ActorMethod<[bigint, bigint, Uint8Array | number[]], undefined>,
  'set_verdict' : ActorMethod<[bigint, number, number, string], undefined>,
  /**
   * --- Upload flow ---
   */
  'start_submission' : ActorMethod<[], bigint>,
  /**
   * --- Verification flow ---
   */
  'trigger_verification' : ActorMethod<[bigint], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
