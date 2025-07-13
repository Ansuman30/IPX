use ic_cdk::export::{candid::CandidType, Principal};
use ic_cdk_macros::*;
use ic_cdk::api::management_canister::main::{
    create_canister, install_code, CanisterInstallMode, CreateCanisterArgument,
    InstallCodeArgument,
};
use ic_cdk::api::call::CallResult;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap,
};

type Memory = VirtualMemory<DefaultMemoryImpl>;
type IdCell = ic_stable_structures::Cell<u64, Memory>;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct CampaignMetadata {
    pub creator: Principal,
    pub title: String,
    pub description: String,
    pub funding_goal: u64,
    pub revenue_share_percentage: u8, // 1-100
    pub oracle_endpoints: Vec<String>,
    pub vault_canister_id: Option<Principal>,
    pub created_at: u64,
    pub status: CampaignStatus,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum CampaignStatus {
    Draft,
    Active,
    Funded,
    Completed,
    Cancelled,
}

thread_local! {
    static MEMORY_MANAGER: MemoryManager<DefaultMemoryImpl> = MemoryManager::init(DefaultMemoryImpl::default());
    
    static CAMPAIGN_COUNTER: IdCell = IdCell::init(
        MEMORY_MANAGER.with(|m| m.get(MemoryId::new(0))), 0
    ).expect("Failed to initialize campaign counter");
    
    static CAMPAIGNS: StableBTreeMap<u64, CampaignMetadata, Memory> = StableBTreeMap::init(
        MEMORY_MANAGER.with(|m| m.get(MemoryId::new(1)))
    );
}

#[init]
fn init() {
    ic_cdk::println!("Campaign Factory initialized");
}

#[update]
async fn create_campaign(
    title: String,
    description: String,
    funding_goal: u64,
    revenue_share_percentage: u8,
    oracle_endpoints: Vec<String>,
) -> Result<u64, String> {
    let caller = ic_cdk::caller();
    
    if revenue_share_percentage == 0 || revenue_share_percentage > 100 {
        return Err("Revenue share must be between 1-100%".to_string());
    }
    
    // Generate unique campaign ID
    let campaign_id = CAMPAIGN_COUNTER.with(|counter| {
        let current = counter.get();
        let next = current + 1;
        counter.set(next).expect("Failed to increment counter");
        next
    });
    
    // Create campaign metadata
    let metadata = CampaignMetadata {
        creator: caller,
        title: title.clone(),
        description,
        funding_goal,
        revenue_share_percentage,
        oracle_endpoints,
        vault_canister_id: None,
        created_at: ic_cdk::api::time(),
        status: CampaignStatus::Draft,
    };
    
    // Store campaign
    CAMPAIGNS.with(|campaigns| {
        campaigns.insert(campaign_id, metadata.clone());
    });
    
    // Create vault canister for this campaign
    match create_vault_canister(campaign_id, metadata).await {
        Ok(vault_id) => {
            // Update campaign with vault canister ID
            CAMPAIGNS.with(|campaigns| {
                if let Some(mut campaign) = campaigns.get(&campaign_id) {
                    campaign.vault_canister_id = Some(vault_id);
                    campaign.status = CampaignStatus::Active;
                    campaigns.insert(campaign_id, campaign);
                }
            });
            
            ic_cdk::println!("Campaign {} created with vault {}", campaign_id, vault_id.to_text());
            Ok(campaign_id)
        }
        Err(e) => {
            // Remove campaign if vault creation failed
            CAMPAIGNS.with(|campaigns| {
                campaigns.remove(&campaign_id);
            });
            Err(format!("Failed to create vault canister: {}", e))
        }
    }
}

async fn create_vault_canister(
    campaign_id: u64,
    metadata: CampaignMetadata,
) -> Result<Principal, String> {
    // Create canister with cycles
    let create_args = CreateCanisterArgument {
        settings: None,
    };
    
    let (canister_id,): (Principal,) = create_canister(create_args, 1_000_000_000_000u64)
        .await
        .map_err(|e| format!("Failed to create canister: {:?}", e))?;
    
    // Install vault code
    let vault_wasm = include_bytes!("../../vault/target/wasm32-unknown-unknown/release/vault.wasm");
    
    let install_args = InstallCodeArgument {
        mode: CanisterInstallMode::Install,
        canister_id,
        wasm_module: vault_wasm.to_vec(),
        arg: candid::encode_args((campaign_id, metadata)).unwrap(),
    };
    
    install_code(install_args)
        .await
        .map_err(|e| format!("Failed to install vault code: {:?}", e))?;
    
    Ok(canister_id)
}

#[query]
fn get_campaign(campaign_id: u64) -> Option<CampaignMetadata> {
    CAMPAIGNS.with(|campaigns| campaigns.get(&campaign_id))
}

#[query]
fn get_campaigns_by_creator(creator: Principal) -> Vec<(u64, CampaignMetadata)> {
    CAMPAIGNS.with(|campaigns| {
        campaigns
            .iter()
            .filter(|(_, metadata)| metadata.creator == creator)
            .collect()
    })
}

#[query]
fn get_all_campaigns() -> Vec<(u64, CampaignMetadata)> {
    CAMPAIGNS.with(|campaigns| campaigns.iter().collect())
}

#[query]
fn get_active_campaigns() -> Vec<(u64, CampaignMetadata)> {
    CAMPAIGNS.with(|campaigns| {
        campaigns
            .iter()
            .filter(|(_, metadata)| metadata.status == CampaignStatus::Active)
            .collect()
    })
}

#[update]
fn update_campaign_status(campaign_id: u64, status: CampaignStatus) -> Result<(), String> {
    let caller = ic_cdk::caller();
    
    CAMPAIGNS.with(|campaigns| {
        if let Some(mut campaign) = campaigns.get(&campaign_id) {
            if campaign.creator != caller {
                return Err("Only campaign creator can update status".to_string());
            }
            
            campaign.status = status;
            campaigns.insert(campaign_id, campaign);
            Ok(())
        } else {
            Err("Campaign not found".to_string())
        }
    })
}