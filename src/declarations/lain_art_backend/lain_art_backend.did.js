export const idlFactory = ({ IDL }) => {
  const Embedding = IDL.Record({ 'v0' : IDL.Vec(IDL.Float32) });
  const RewardResult = IDL.Record({
    'token_id' : IDL.Nat,
    'reward_txid' : IDL.Text,
  });
  const ApprovedArtwork = IDL.Record({
    'id' : IDL.Nat,
    'approved_at' : IDL.Nat64,
    'mime_type' : IDL.Text,
    'image_data' : IDL.Vec(IDL.Nat8),
    'submission_id' : IDL.Nat,
    'confidence_score' : IDL.Float32,
    'recognized_as' : IDL.Text,
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
  const Person = IDL.Record({ 'label' : IDL.Text, 'score' : IDL.Float32 });
  return IDL.Service({
    'add' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Nat8)],
        [IDL.Variant({ 'Ok' : Embedding, 'Err' : IDL.Text })],
        [],
      ),
    'confirm_fee' : IDL.Func([IDL.Nat], [], []),
    'detect' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [
          IDL.Variant({
            'Ok' : IDL.Vec(
              IDL.Tuple(IDL.Float32, IDL.Float32, IDL.Float32, IDL.Float32)
            ),
            'Err' : IDL.Text,
          }),
        ],
        [],
      ),
    'finalize_asset' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [],
        [],
      ),
    'finalize_reward' : IDL.Func([IDL.Nat], [RewardResult], []),
    'get_approved_artwork' : IDL.Func(
        [],
        [IDL.Vec(ApprovedArtwork)],
        ['query'],
      ),
    'get_artwork_by_id' : IDL.Func(
        [IDL.Nat],
        [IDL.Opt(ApprovedArtwork)],
        ['query'],
      ),
    'get_artwork_count' : IDL.Func([], [IDL.Nat], ['query']),
    'get_face_count' : IDL.Func([], [IDL.Nat], ['query']),
    'get_fee_invoice' : IDL.Func([IDL.Nat], [FeeInvoice], ['query']),
    'get_submission' : IDL.Func([IDL.Nat], [IDL.Opt(Submission)], ['query']),
    'list_stored_faces' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'override_verdict' : IDL.Func([IDL.Nat, Status, IDL.Text], [], []),
    'put_chunk' : IDL.Func([IDL.Nat, IDL.Nat, IDL.Vec(IDL.Nat8)], [], []),
    'recognize' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [IDL.Variant({ 'Ok' : Person, 'Err' : IDL.Text })],
        [],
      ),
    'remove_face' : IDL.Func([IDL.Text], [], []),
    'set_verdict' : IDL.Func([IDL.Nat, IDL.Nat16, IDL.Nat16, IDL.Text], [], []),
    'setup_models' : IDL.Func(
        [],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
    'start_submission' : IDL.Func([], [IDL.Nat], []),
    'trigger_verification' : IDL.Func([IDL.Nat], [], []),
    'verify_and_store_artwork' : IDL.Func(
        [IDL.Nat],
        [IDL.Variant({ 'Ok' : ApprovedArtwork, 'Err' : IDL.Text })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
