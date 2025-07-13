use ic_cdk::export::{candid::CandidType, Principal};
use ic_cdk_macros::*;
use ic_cdk::api::call::CallResult;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap,
};

type Memory = VirtualMemory<DefaultMemoryImpl>;
type ProposalId = u64;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Proposal {
    pub id: ProposalId,
    pub proposer: Principal,
    pub title: String,
    pub description: String,
    pub proposal_type: ProposalType,
    pub campaign_id: Option<u64>,
    pub target_canister: Option<Principal>,
    pub payload: Vec<u8>,
    pub created_at: u64,
    pub voting_deadline: u64,
    pub status: ProposalStatus,
    pub votes_for: u64,
    pub votes_against: u64,
    pub total_voting_power: u64,
    pub execution_delay: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ProposalType {
    EarlyUnlock {
        stream_id: u64,
        reason: String,
    },
    CampaignRefund {
        campaign_id: u64,
        reason: String,
    },
    UpdateRevenueShare {
        campaign_id: u64,
        new_percentage: u8,
    },
    DisputeResolution {
        campaign_id: u64,
        disputed_amount: u64,
        resolution: String,
    },
    OracleUpdate {
        campaign_id: u64,
        new_endpoints: Vec<String>,
    },
    Emergency {
        action: String,
        justification: String,
    },
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ProposalStatus {
    Open,
    Passed,
    Rejected,
    Executed,
    Failed,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Vote {
    pub proposal_id: ProposalId,
    pub voter: Principal,
    pub vote: VoteOption,
    pub voting_power: u64,
    pub timestamp: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum VoteOption {
    For,
    Against,
    Abstain,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct VotingPower {
    pub holder: Principal,
    pub power: u64,
    pub campaign_investments: HashMap<u64, u64>, // campaign_id -> invested_amount
    pub nft_holdings: Vec<u64>, // NFT token IDs
    pub last_updated: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct DAOConfig {
    pub min_proposal_threshold: u64, // Minimum voting power to create proposal
    pub quorum_threshold: u64,       // Minimum participation for valid vote
    pub pass_threshold: u64,         // Percentage needed to pass (e.g., 51)
    pub voting_period: u64,          // Voting period in nanoseconds
    pub execution_delay: u64,        // Delay before execution in nanoseconds
    pub emergency_threshold: u64,    // Higher threshold for emergency proposals
}

thread_local! {
    static MEMORY_MANAGER: MemoryManager<DefaultMemoryImpl> = MemoryManager::init(DefaultMemoryImpl::default());
    
    static PROPOSALS: StableBTreeMap<ProposalId, Proposal, Memory> = StableBTreeMap::init(
        MEMORY_MANAGER.with(|m| m.get(MemoryId::new(0)))
    );
    
    static VOTES: StableBTreeMap<(ProposalId, Principal), Vote, Memory> = StableBTreeMap::init(
        MEMORY_MANAGER.with(|m| m.get(MemoryId::new(1)))
    );
    
    static VOTING_POWER: StableBTreeMap<Principal, VotingPower, Memory> = StableBTreeMap::init(
        MEMORY_MANAGER.with(|m| m.get(MemoryId::new(2)))
    );
    
    static PROPOSAL_COUNTER: std::cell::RefCell<ProposalId> = std::cell::RefCell::new(0);
    
    static DAO_CONFIG: std::cell::RefCell<DAOConfig> = std::cell::RefCell::new(
        DAOConfig {
            min_proposal_threshold: 1000,  // 1000 units of voting power
            quorum_threshold: 20,          // 20% participation
            pass_threshold: 51,            // 51% to pass
            voting_period: 7 * 24 * 60 * 60 * 1_000_000_000, // 7 days
            execution_delay: 2 * 24 * 60 * 60 * 1_000_000_000, // 2 days
            emergency_threshold: 75,       // 75% for emergency proposals
        }
    );
}

#[init]
fn init() {
    ic_cdk::println!("SNS DAO canister initialized");
}

#[update]
fn submit_proposal(
    title: String,
    description: String,
    proposal_type: ProposalType,
    target_canister: Option<Principal>,
    payload: Vec<u8>,
) -> Result<ProposalId, String> {
    let caller = ic_cdk::caller();
    
    // Check if caller has enough voting power to submit proposal
    let caller_power = get_voting_power(caller);
    let config = DAO_CONFIG.with(|c| c.borrow().clone());
    
    if caller_power < config.min_proposal_threshold {
        return Err(format!("Insufficient voting power. Required: {}, Have: {}", 
                          config.min_proposal_threshold, caller_power));
    }
    
    let proposal_id = PROPOSAL_COUNTER.with(|counter| {
        let current = *counter.borrow();
        let next = current + 1;
        *counter.borrow_mut() = next;
        next
    });
    
    let current_time = ic_cdk::api::time();
    let voting_deadline = current_time + config.voting_period;
    
    // Determine execution delay based on proposal type
    let execution_delay = match proposal_type {
        ProposalType::Emergency { .. } => config.execution_delay / 2, // Faster for emergencies
        _ => config.execution_delay,
    };
    
    let campaign_id = match &proposal_type {
        ProposalType::CampaignRefund { campaign_id, .. } => Some(*campaign_id),
        ProposalType::UpdateRevenueShare { campaign_id, .. } => Some(*campaign_id),
        ProposalType::DisputeResolution { campaign_id, .. } => Some(*campaign_id),
        ProposalType::OracleUpdate { campaign_id, .. } => Some(*campaign_id),
        _ => None,
    };
    
    let proposal = Proposal {
        id: proposal_id,
        proposer: caller,
        title,
        description,
        proposal_type,
        campaign_id,
        target_canister,
        payload,
        created_at: current_time,
        voting_deadline,
        status: ProposalStatus::Open,
        votes_for: 0,
        votes_against: 0,
        total_voting_power: calculate_total_voting_power(),
        execution_delay,
    };
    
    PROPOSALS.with(|proposals| {
        proposals.insert(proposal_id, proposal);
    });
    
    ic_cdk::println!("Proposal {} submitted by {}", proposal_id, caller.to_text());
    Ok(proposal_id)
}

#[update]
fn vote_on_proposal(proposal_id: ProposalId, vote_option: VoteOption) -> Result<(), String> {
    let caller = ic_cdk::caller();
    let current_time = ic_cdk::api::time();
    
    // Check if proposal exists and is still open
    let mut proposal = PROPOSALS.with(|proposals| {
        proposals.get(&proposal_id)
            .ok_or_else(|| "Proposal not found".to_string())
    })?;
    
    if proposal.status != ProposalStatus::Open {
        return Err("Proposal is not open for voting".to_string());
    }
    
    if current_time > proposal.voting_deadline {
        return Err("Voting period has ended".to_string());
    }
    
    // Check if user already voted
    if VOTES.with(|votes| votes.get(&(proposal_id, caller)).is_some()) {
        return Err("User has already voted on this proposal".to_string());
    }
    
    let voting_power = get_voting_power(caller);
    if voting_power == 0 {
        return Err("No voting power".to_string());
    }
    
    // Record the vote
    let vote = Vote {
        proposal_id,
        voter: caller,
        vote: vote_option.clone(),
        voting_power,
        timestamp: current_time,
    };
    
    VOTES.with(|votes| {
        votes.insert((proposal_id, caller), vote);
    });
    
    // Update proposal vote counts
    match vote_option {
        VoteOption::For => proposal.votes_for += voting_power,
        VoteOption::Against => proposal.votes_against += voting_power,
        VoteOption::Abstain => {}, // Abstain doesn't count toward for/against
    }
    
    // Check if proposal should be finalized
    let total_votes = proposal.votes_for + proposal.votes_against;
    let config = DAO_CONFIG.with(|c| c.borrow().clone());
    let quorum_met = (total_votes * 100) >= (proposal.total_voting_power * config.quorum_threshold);
    
    if quorum_met {
        let pass_threshold = match proposal.proposal_type {
            ProposalType::Emergency { .. } => config.emergency_threshold,
            _ => config.pass_threshold,
        };
        
        let passed = (proposal.votes_for * 100) >= (total_votes * pass_threshold);
        
        if passed {
            proposal.status = ProposalStatus::Passed;
        } else {
            proposal.status = ProposalStatus::Rejected;
        }
    }
    
    PROPOSALS.with(|proposals| {
        proposals.insert(proposal_id, proposal);
    });
    
    ic_cdk::println!("Vote recorded for proposal {} by {}", proposal_id, caller.to_text());
    Ok(())
}

#[update]
async fn execute_proposal(proposal_id: ProposalId) -> Result<(), String> {
    let current_time = ic_cdk::api::time();
    
    let mut proposal = PROPOSALS.with(|proposals| {
        proposals.get(&proposal_id)
            .ok_or_else(|| "Proposal not found".to_string())
    })?;
    
    if proposal.status != ProposalStatus::Passed {
        return Err("Proposal has not passed".to_string());
    }
    
    // Check execution delay
    let execution_time = proposal.voting_deadline + proposal.execution_delay;
    if current_time < execution_time {
        return Err("Execution delay period has not passed".to_string());
    }
    
    // Execute based on proposal type
    let execution_result = match &proposal.proposal_type {
        ProposalType::EarlyUnlock { stream_id, .. } => {
            execute_early_unlock(*stream_id).await
        }
        ProposalType::CampaignRefund { campaign_id, .. } => {
            execute_campaign_refund(*campaign_id).await
        }
        ProposalType::UpdateRevenueShare { campaign_id, new_percentage } => {
            execute_revenue_share_update(*campaign_id, *new_percentage).await
        }
        ProposalType::DisputeResolution { campaign_id, disputed_amount, .. } => {
            execute_dispute_resolution(*campaign_id, *disputed_amount).await
        }
        ProposalType::OracleUpdate { campaign_id, new_endpoints } => {
            execute_oracle_update(*campaign_id, new_endpoints.clone()).await
        }
        ProposalType::Emergency { action, .. } => {
            execute_emergency_action(action.clone()).await
        }
    };
    
    match execution_result {
        Ok(_) => {
            proposal.status = ProposalStatus::Executed;
            ic_cdk::println!("Proposal {} executed successfully", proposal_id);
        }
        Err(e) => {
            proposal.status = ProposalStatus::Failed;
            ic_cdk::println!("Proposal {} execution failed: {}", proposal_id, e);
            return Err(e);
        }
    }
    
    PROPOSALS.with(|proposals| {
        proposals.insert(proposal_id, proposal);
    });
    
    Ok(())
}

async fn execute_early_unlock(stream_id: u64) -> Result<(), String> {
    // Call BeamFi stream canister to unlock stream early
    let stream_canister = get_stream_canister()?;
    let result: CallResult<(Result<(), String>,)> = ic_cdk::api::call::call(
        stream_canister,
        "unlock_stream_early",
        (stream_id,),
    ).await;
    
    match result {
        Ok((Ok(()),)) => Ok(()),
        Ok((Err(e),)) => Err(e),
        Err(e) => Err(format!("Failed to call stream canister: {:?}", e)),
    }
}

async fn execute_campaign_refund(campaign_id: u64) -> Result<(), String> {
    // Call vault canister to initiate refund process
    let vault_canister = get_vault_canister(campaign_id)?;
    let result: CallResult<(Result<(), String>,)> = ic_cdk::api::call::call(
        vault_canister,
        "initiate_refund",
        (),
    ).await;
    
    match result {
        Ok((Ok(()),)) => Ok(()),
        Ok((Err(e),)) => Err(e),
        Err(e) => Err(format!("Failed to call vault canister: {:?}", e)),
    }
}

async fn execute_revenue_share_update(campaign_id: u64, new_percentage: u8) -> Result<(), String> {
    let vault_canister = get_vault_canister(campaign_id)?;
    let result: CallResult<(Result<(), String>,)> = ic_cdk::api::call::call(
        vault_canister,
        "update_revenue_share",
        (new_percentage,),
    ).await;
    
    match result {
        Ok((Ok(()),)) => Ok(()),
        Ok((Err(e),)) => Err(e),
        Err(e) => Err(format!("Failed to update revenue share: {:?}", e)),
    }
}

async fn execute_dispute_resolution(campaign_id: u64, disputed_amount: u64) -> Result<(), String> {
    let vault_canister = get_vault_canister(campaign_id)?;
    let result: CallResult<(Result<(), String>,)> = ic_cdk::api::call::call(
        vault_canister,
        "resolve_dispute",
        (disputed_amount,),
    ).await;
    
    match result {
        Ok((Ok(()),)) => Ok(()),
        Ok((Err(e),)) => Err(e),
        Err(e) => Err(format!("Failed to resolve dispute: {:?}", e)),
    }
}

async fn execute_oracle_update(campaign_id: u64, new_endpoints: Vec<String>) -> Result<(), String> {
    let oracle_canister = get_oracle_canister()?;
    let result: CallResult<(Result<(), String>,)> = ic_cdk::api::call::call(
        oracle_canister,
        "update_endpoints",
        (campaign_id, new_endpoints),
    ).await;
    
    match result {
        Ok((Ok(()),)) => Ok(()),
        Ok((Err(e),)) => Err(e),
        Err(e) => Err(format!("Failed to update oracle endpoints: {:?}", e)),
    }
}

async fn execute_emergency_action(action: String) -> Result<(), String> {
    // Emergency actions would be implemented based on specific needs
    ic_cdk::println!("Emergency action executed: {}", action);
    Ok(())
}

#[update]
fn update_voting_power(
    holder: Principal,
    campaign_investments: HashMap<u64, u64>,
    nft_holdings: Vec<u64>,
) -> Result<(), String> {
    let caller = ic_cdk::caller();
    
    // TODO: Add authorization - only trusted canisters should update voting power
    
    let total_power = calculate_user_voting_power(&campaign_investments, &nft_holdings);
    
    let voting_power = VotingPower {
        holder,
        power: total_power,
        campaign_investments,
        nft_holdings,
        last_updated: ic_cdk::api::time(),
    };
    
    VOTING_POWER.with(|power| {
        power.insert(holder, voting_power);
    });
    
    Ok(())
}

fn calculate_user_voting_power(
    investments: &HashMap<u64, u64>,
    nft_holdings: &Vec<u64>,
) -> u64 {
    let investment_power: u64 = investments.values().sum();
    let nft_power = nft_holdings.len() as u64 * 100; // Each NFT gives 100 voting power
    investment_power + nft_power
}

fn calculate_total_voting_power() -> u64 {
    VOTING_POWER.with(|power| {
        power.iter().map(|(_, vp)| vp.power).sum()
    })
}

fn get_voting_power(user: Principal) -> u64 {
    VOTING_POWER.with(|power| {
        power.get(&user).map(|vp| vp.power).unwrap_or(0)
    })
}

// Helper functions to get canister references
fn get_stream_canister() -> Result<Principal, String> {
    // TODO: Store and return actual stream canister principal
    Err("Stream canister not configured".to_string())
}

fn get_vault_canister(campaign_id: u64) -> Result<Principal, String> {
    // TODO: Lookup vault canister for campaign_id
    Err("Vault canister not found".to_string())
}

fn get_oracle_canister() -> Result<Principal, String> {
    // TODO: Store and return actual oracle canister principal
    Err("Oracle canister not configured".to_string())
}

#[query]
fn get_proposal(proposal_id: ProposalId) -> Option<Proposal> {
    PROPOSALS.with(|proposals| proposals.get(&proposal_id))
}

#[query]
fn get_all_proposals() -> Vec<Proposal> {
    PROPOSALS.with(|proposals| {
        proposals.iter().map(|(_, proposal)| proposal).collect()
    })
}

#[query]
fn get_open_proposals() -> Vec<Proposal> {
    PROPOSALS.with(|proposals| {
        proposals.iter()
            .map(|(_, proposal)| proposal)
            .filter(|p| p.status == ProposalStatus::Open)
            .collect()
    })
}

#[query]
fn get_user_votes(user: Principal) -> Vec<Vote> {
    VOTES.with(|votes| {
        votes.iter()
            .filter(|((_, voter), _)| *voter == user)
            .map(|(_, vote)| vote)
            .collect()
    })
}

#[query]
fn get_proposal_votes(proposal_id: ProposalId) -> Vec<Vote> {
    VOTES.with(|votes| {
        votes.iter()
            .filter(|((pid, _), _)| *pid == proposal_id)
            .map(|(_, vote)| vote)
            .collect()
    })
}

#[query]
fn get_dao_config() -> DAOConfig {
    DAO_CONFIG.with(|config| config.borrow().clone())
}

#[update]
fn update_dao_config(new_config: DAOConfig) -> Result<(), String> {
    let caller = ic_cdk::caller();
    
    // TODO: Add proper authorization - only DAO itself should update config
    
    DAO_CONFIG.with(|config| {
        *config.borrow_mut() = new_config;
    });
    
    Ok(())
}