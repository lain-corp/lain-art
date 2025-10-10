export const idlFactory = ({ IDL }) => {
  const RewardResult = IDL.Record({
    'token_id' : IDL.Nat,
    'reward_txid' : IDL.Text,
  });
  const FeeInvoice = IDL.Record({
    'memo' : IDL.Opt(IDL.Nat),
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'amount' : IDL.Nat,
  });
  const ArtMeta = IDL.Record({
    'sha256' : IDL.Vec(IDL.Nat8),
    'mime' : IDL.Text,
    'size' : IDL.Nat,
    'chunks' : IDL.Nat,
  });
  const Status = IDL.Variant({
    'Rewarded' : IDL.Null,
    'Rejected' : IDL.Record({ 'reason' : IDL.Text }),
    'PendingUpload' : IDL.Null,
    'AwaitingFee' : IDL.Null,
    'Verified' : IDL.Record({
      'originality' : IDL.Nat16,
      'visibility' : IDL.Nat16,
    }),
    'Verifying' : IDL.Null,
  });
  const Submission = IDL.Record({
    'id' : IDL.Nat,
    'art' : IDL.Opt(ArtMeta),
    'status' : Status,
    'updated_at' : IDL.Nat64,
    'creator' : IDL.Principal,
    'nft_token_id' : IDL.Opt(IDL.Nat),
    'created_at' : IDL.Nat64,
    'fee_paid' : IDL.Bool,
  });
  return IDL.Service({
    'confirm_fee' : IDL.Func([IDL.Nat], [], []),
    'finalize_asset' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [],
        [],
      ),
    'finalize_reward' : IDL.Func([IDL.Nat], [RewardResult], []),
    'get_fee_invoice' : IDL.Func([IDL.Nat], [FeeInvoice], ['query']),
    'get_submission' : IDL.Func([IDL.Nat], [IDL.Opt(Submission)], ['query']),
    'override_verdict' : IDL.Func([IDL.Nat, Status, IDL.Text], [], []),
    'put_chunk' : IDL.Func([IDL.Nat, IDL.Nat, IDL.Vec(IDL.Nat8)], [], []),
    'set_verdict' : IDL.Func([IDL.Nat, IDL.Nat16, IDL.Nat16, IDL.Text], [], []),
    'start_submission' : IDL.Func([], [IDL.Nat], []),
    'trigger_verification' : IDL.Func([IDL.Nat], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
