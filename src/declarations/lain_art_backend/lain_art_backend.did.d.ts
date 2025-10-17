import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface ApprovedArtwork {
  'id' : bigint,
  'approved_at' : bigint,
  'mime_type' : string,
  'image_data' : Uint8Array | number[],
  'submission_id' : bigint,
  'confidence_score' : number,
  'recognized_as' : string,
}
export interface ArtMeta {
  'sha256' : Uint8Array | number[],
  'mime' : string,
  'size' : bigint,
  'chunks' : bigint,
}
export interface Embedding { 'v0' : Array<number> }
export interface FeeInvoice {
  'memo' : [] | [bigint],
  'subaccount' : [] | [Uint8Array | number[]],
  'amount' : bigint,
}
export interface Person { 'label' : string, 'score' : number }
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
  'add' : ActorMethod<
    [string, Uint8Array | number[]],
    { 'Ok' : Embedding } |
      { 'Err' : string }
  >,
  'confirm_fee' : ActorMethod<[bigint], undefined>,
  'detect' : ActorMethod<
    [Uint8Array | number[]],
    { 'Ok' : Array<[number, number, number, number]> } |
      { 'Err' : string }
  >,
  'finalize_asset' : ActorMethod<
    [bigint, string, bigint, Uint8Array | number[]],
    undefined
  >,
  'finalize_reward' : ActorMethod<[bigint], RewardResult>,
  'get_approved_artwork' : ActorMethod<[], Array<ApprovedArtwork>>,
  'get_artwork_by_id' : ActorMethod<[bigint], [] | [ApprovedArtwork]>,
  'get_artwork_count' : ActorMethod<[], bigint>,
  'get_face_count' : ActorMethod<[], bigint>,
  'get_fee_invoice' : ActorMethod<[bigint], FeeInvoice>,
  'get_submission' : ActorMethod<[bigint], [] | [Submission]>,
  'list_stored_faces' : ActorMethod<[], Array<string>>,
  'override_verdict' : ActorMethod<[bigint, Status, string], undefined>,
  'put_chunk' : ActorMethod<[bigint, bigint, Uint8Array | number[]], undefined>,
  'recognize' : ActorMethod<
    [Uint8Array | number[]],
    { 'Ok' : Person } |
      { 'Err' : string }
  >,
  'remove_face' : ActorMethod<[string], undefined>,
  'set_verdict' : ActorMethod<[bigint, number, number, string], undefined>,
  'setup_models' : ActorMethod<[], { 'Ok' : null } | { 'Err' : string }>,
  'start_submission' : ActorMethod<[], bigint>,
  'trigger_verification' : ActorMethod<[bigint], undefined>,
  'verify_and_store_artwork' : ActorMethod<
    [bigint],
    { 'Ok' : ApprovedArtwork } |
      { 'Err' : string }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
