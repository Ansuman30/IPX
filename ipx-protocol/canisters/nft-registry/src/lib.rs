use ic_cdk::export::{candid::CandidType, Principal};
use ic_cdk_macros::*;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap,
};

type Memory = VirtualMemory<DefaultMemoryImpl>;
type TokenId = u64;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TokenMetadata {
    pub token_id: TokenId,
    pub owner: Principal,
    pub campaign_id: u64,
    pub vault_canister: Principal,
    pub investment_amount: u64,
    pub share_percentage: f64,
    pub metadata_json: String,
    pub created_at: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TransferArgs {
    pub token_id: TokenId,
    pub from: Principal,
    pub to: Principal,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ApprovalArgs {
    pub token_id: TokenId,
    pub approved: Principal,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CollectionMetadata {
    pub name: String,
    pub description: String,
    pub image: String,
    pub total_supply: u64,
}

thread_local! {
    static MEMORY_MANAGER: MemoryManager<DefaultMemoryImpl> = MemoryManager::init(DefaultMemoryImpl::default());
    
    static TOKENS: StableBTreeMap<TokenId, TokenMetadata, Memory> = StableBTreeMap::init(
        MEMORY_MANAGER.with(|m| m.get(MemoryId::new(0)))
    );
    
    static TOKEN_APPROVALS: StableBTreeMap<TokenId, Principal, Memory> = StableBTreeMap::init(
        MEMORY_MANAGER.with(|m| m.get(MemoryId::new(1)))
    );
    
    static OPERATOR_APPROVALS: StableBTreeMap<(Principal, Principal), bool, Memory> = StableBTreeMap::init(
        MEMORY_MANAGER.with(|m| m.get(MemoryId::new(2)))
    );
    
    static TOKEN_COUNTER: std::cell::RefCell<TokenId> = std::cell::RefCell::new(0);
    
    static COLLECTION_METADATA: std::cell::RefCell<CollectionMetadata> = std::cell::RefCell::new(
        CollectionMetadata {
            name: "IPX Campaign NFTs".to_string(),
            description: "NFTs representing investments in IPX Protocol campaigns".to_string(),
            image: "https://ipx-protocol.com/collection-image.png".to_string(),
            total_supply: 0,
        }
    );
}

#[init]
fn init() {
    ic_cdk::println!("NFT Registry (ICRC-7 compliant) initialized");
}

// ICRC-7 Standard Methods

#[query]
fn icrc7_collection_metadata() -> CollectionMetadata {
    COLLECTION_METADATA.with(|metadata| metadata.borrow().clone())
}

#[query]
fn icrc7_name() -> String {
    COLLECTION_METADATA.with(|metadata| metadata.borrow().name.clone())
}

#[query]
fn icrc7_description() -> String {
    COLLECTION_METADATA.with(|metadata| metadata.borrow().description.clone())
}

#[query]
fn icrc7_total_supply() -> u64 {
    TOKENS.with(|tokens| tokens.len())
}

#[query]
fn icrc7_owner_of(token_id: TokenId) -> Option<Principal> {
    TOKENS.with(|tokens| {
        tokens.get(&token_id).map(|token| token.owner)
    })
}

#[query]
fn icrc7_balance_of(owner: Principal) -> u64 {
    TOKENS.with(|tokens| {
        tokens.iter()
            .filter(|(_, token)| token.owner == owner)
            .count() as u64
    })
}

#[query]
fn icrc7_tokens_of(owner: Principal) -> Vec<TokenId> {
    TOKENS.with(|tokens| {
        tokens.iter()
            .filter(|(_, token)| token.owner == owner)
            .map(|(token_id, _)| token_id)
            .collect()
    })
}

#[query]
fn icrc7_token_metadata(token_id: TokenId) -> Option<TokenMetadata> {
    TOKENS.with(|tokens| tokens.get(&token_id))
}

#[update]
fn icrc7_transfer(args: TransferArgs) -> Result<TokenId, String> {
    let caller = ic_cdk::caller();
    
    // Verify ownership or approval
    let token = TOKENS.with(|tokens| tokens.get(&args.token_id));
    
    match token {
        Some(mut token_data) => {
            if token_data.owner != caller && !is_approved(args.token_id, caller) {
                return Err("Caller is not owner or approved".to_string());
            }
            
            if token_data.owner != args.from {
                return Err("From address doesn't match token owner".to_string());
            }
            
            // Update ownership
            token_data.owner = args.to;
            
            TOKENS.with(|tokens| {
                tokens.insert(args.token_id, token_data);
            });
            
            // Clear approvals
            TOKEN_APPROVALS.with(|approvals| {
                approvals.remove(&args.token_id);
            });
            
            ic_cdk::println!("Token {} transferred from {} to {}", 
                args.token_id, args.from.to_text(), args.to.to_text());
            
            Ok(args.token_id)
        }
        None => Err("Token not found".to_string()),
    }
}

#[update]
fn icrc7_approve(args: ApprovalArgs) -> Result<TokenId, String> {
    let caller = ic_cdk::caller();
    
    let token = TOKENS.with(|tokens| tokens.get(&args.token_id));
    
    match token {
        Some(token_data) => {
            if token_data.owner != caller {
                return Err("Only token owner can approve".to_string());
            }
            
            TOKEN_APPROVALS.with(|approvals| {
                approvals.insert(args.token_id, args.approved);
            });
            
            Ok(args.token_id)
        }
        None => Err("Token not found".to_string()),
    }
}

#[query]
fn icrc7_get_approved(token_id: TokenId) -> Option<Principal> {
    TOKEN_APPROVALS.with(|approvals| approvals.get(&token_id))
}

#[update]
fn icrc7_set_approval_for_all(operator: Principal, approved: bool) -> Result<(), String> {
    let caller = ic_cdk::caller();
    
    OPERATOR_APPROVALS.with(|approvals| {
        approvals.insert((caller, operator), approved);
    });
    
    Ok(())
}

#[query]
fn icrc7_is_approved_for_all(owner: Principal, operator: Principal) -> bool {
    OPERATOR_APPROVALS.with(|approvals| {
        approvals.get(&(owner, operator)).unwrap_or(false)
    })
}


#[update]
fn mint(
    to: Principal,
    campaign_id: u64,
    vault_canister: Principal,
    investment_amount: u64,
    share_percentage: f64,
    metadata_json: String,
) -> Result<TokenId, String> {
    let caller = ic_cdk::caller();
    

    
    let token_id = TOKEN_COUNTER.with(|counter| {
        let current = *counter.borrow();
        let next = current + 1;
        *counter.borrow_mut() = next;
        next
    });
    
    let token_metadata = TokenMetadata {
        token_id,
        owner: to,
        campaign_id,
        vault_canister,
        investment_amount,
        share_percentage,
        metadata_json,
        created_at: ic_cdk::api::time(),
    };
    
    TOKENS.with(|tokens| {
        tokens.insert(token_id, token_metadata);
    });
    
    // Update total supply
    COLLECTION_METADATA.with(|metadata| {
        metadata.borrow_mut().total_supply += 1;
    });
    
    ic_cdk::println!("NFT {} minted for {} (campaign {})", token_id, to.to_text(), campaign_id);
    
    Ok(token_id)
}

