use candid::{CandidType, Deserialize, Nat};

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct FeeInvoice {
    pub amount: Nat,
    pub subaccount: Option<Vec<u8>>,
    pub memo: Option<Nat>,
}

// Dummy implementation: always returns 0.1 ICP, no subaccount, no memo
pub fn get_fee_invoice(_submission_id: Nat) -> FeeInvoice {
    FeeInvoice {
        amount: Nat::from(100_000_000u64), // 0.1 ICP in e8s
        subaccount: None,
        memo: None,
    }
}
