# IPX Protocol Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Canister Documentation](#canister-documentation)
4. [API Reference](#api-reference)
5. [Usage Examples](#usage-examples)
6. [Deployment Guide](#deployment-guide)
7. [Integration Guide](#integration-guide)

## Overview

IPX Protocol is a decentralized platform built on the Internet Computer (ICP) that enables creators to tokenize their future revenue streams through NFT-based investment campaigns. The protocol allows creators to raise funding by offering investors NFTs that represent a share in their future earnings from platforms like YouTube, Spotify, and Substack.

### Key Features

- **Revenue Tokenization**: Creators tokenize future revenue streams through dedicated Vault Canisters
- **NFT-Based Investment**: Each investment is represented by an ICRC-7 compliant NFT with embedded metadata
- **Real-Time Oracle Integration**: HTTPS outcalls to YouTube, Spotify, and Substack APIs for live revenue tracking
- **BeamFi Streaming Payouts**: Time-locked payment schedules with real-time adjustments
- **SNS DAO Governance**: Decentralized governance for disputes, unlocks, and protocol decisions
- **Modular Canister Architecture**: Six specialized canisters working in concert for scalability

## Protocol Mechanics

### 1. Revenue Tokenization via Canisters

When a creator launches a campaign, a **dedicated Vault Canister** is instantiated via the Campaign Factory's factory method. This architectural approach ensures:

- **Campaign Isolation**: Each campaign operates independently with its own state and logic
- **Scalability**: No single point of failure or bottleneck
- **Upgradability**: Individual campaigns can be upgraded without affecting others
- **Security**: Isolated attack surface per campaign

The **Vault Canister** contains campaign-specific logic for:
- **NFT Minting**: Creates ICRC-7 compliant tokens for each investment
- **Oracle Registration**: Connects to specified revenue data sources
- **Revenue Share Tracking**: Maintains investor allocation percentages
- **Payout Management**: Coordinates with BeamFi Stream Canister for distributions

#### NFT Metadata Structure
Each minted NFT contains comprehensive metadata:
```json
{
  "campaign_id": "12345",
  "oracle_source": ["youtube_api", "spotify_artists", "substack_metrics"],
  "revenue_share": "2.5%",
  "stream_contract_id": "stream_789",
  "vesting_period": "12_months",
  "investment_amount": "1000",
  "mint_timestamp": "1704067200",
  "vault_canister": "rdmx6-jaaaa-aaaah-qcaiq-cai"
}
```

### 2. Campaign Lifecycle Using Canisters

#### Phase 1: Campaign Creation
1. **Factory Instantiation**: Campaign Factory spawns new Vault Canister
2. **Initialization**: Vault receives campaign metadata and oracle endpoints
3. **Canister Linking**: Vault connects to NFT Registry, Oracle Aggregator, and Stream canisters
4. **Registration**: Campaign appears in active campaigns registry

#### Phase 2: Investment Period
1. **Investment Processing**: Vault Canister accepts and validates investments
2. **NFT Minting**: Vault calls NFT Registry to mint ownership tokens
3. **Share Calculation**: Investment percentage calculated based on funding goal
4. **State Updates**: Backer information stored in Vault's stable storage

#### Phase 3: Revenue Tracking
1. **Oracle Activation**: Oracle Aggregator begins monitoring specified endpoints
2. **Data Verification**: Revenue data normalized and verified for authenticity
3. **Vault Updates**: Oracle pushes verified revenue data to Vault Canister
4. **Distribution Calculation**: Vault recalculates owed amounts per NFT holder

#### Phase 4: Payout Distribution
1. **Stream Creation**: Vault instructs BeamFi Stream to create payment schedules
2. **Real-time Adjustments**: Streams automatically adjust based on new revenue data
3. **Claim Processing**: NFT holders can claim vested amounts at any time
4. **Audit Trail**: All transactions recorded immutably on-chain

## Architecture

### Modular Canister Architecture

The IPX Protocol implements a sophisticated modular architecture with six specialized canisters that work in concert to provide a complete decentralized revenue tokenization solution:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IPX Protocol Architecture                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Creator/Investor Frontend                                                  │
│           ↓                                                                 │
│  ┌─────────────────┐    ┌──────────────────────────────────────────────┐   │
│  │ Campaign Factory│───→│ Vault Canisters (one per campaign)          │   │
│  │   Canister      │    │  • NFT minting logic                        │   │
│  └─────────────────┘    │  • Revenue share tracking                   │   │
│           ↓              │  • Payout coordination                      │   │
│  ┌─────────────────┐    │  • Oracle integration                       │   │
│  │ NFT Registry    │←───┤  • Stream management                        │   │
│  │   Canister      │    └──────────────────────────────────────────────┘   │
│  │ (ICRC-7)        │                         ↑           ↓                 │
│  └─────────────────┘    ┌─────────────────┐  │  ┌─────────────────┐        │
│                         │ Oracle          │──┘  │ BeamFi Stream   │        │
│  ┌─────────────────┐    │ Aggregator      │     │   Canister      │        │
│  │ SNS DAO         │    │ • YouTube API   │     │ • Time-locked   │        │
│  │ Governance      │    │ • Spotify API   │     │   payments      │        │
│  │ • Proposals     │    │ • Substack API  │     │ • Vesting       │        │
│  │ • Voting        │    │ • Data verify   │     │ • Claims        │        │
│  │ • Execution     │    └─────────────────┘     └─────────────────┘        │
│  └─────────────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Canister Responsibilities

#### **Campaign Factory Canister**
- Spawns a new Vault Canister per campaign using `create_canister` API
- Maintains global registry of all campaigns for discovery
- Handles campaign metadata and lifecycle management
- Provides factory methods for scalable campaign creation

#### **Vault Canister (Core Protocol Logic)**
- **NFT Minting**: Coordinates with NFT Registry for investment token creation
- **Oracle Integration**: Receives and validates revenue updates from Oracle Aggregator
- **Revenue Share Management**: Tracks investor allocations and calculates distributions
- **Stream Coordination**: Instructs BeamFi Stream Canister for payout scheduling
- **State Management**: Maintains campaign funding progress and backer information

#### **NFT Registry Canister (ICRC-7 Compliance)**
- Full ICRC-7 standard implementation for interoperability
- Stores comprehensive metadata including campaign details and vesting info
- Handles transfers, approvals, and ownership queries
- Maintains collection-level statistics and metadata

#### **Oracle Aggregator Canister**
- **HTTPS Outcalls** to external revenue APIs:
  - **YouTube Data API**: Channel analytics and revenue data
  - **Spotify for Artists**: Streaming statistics and earnings
  - **Substack Metrics**: Subscription and payment data
- **Data Normalization**: Converts different API formats to standard schema
- **Verification**: Validates data authenticity and prevents manipulation
- **Push Updates**: Sends verified revenue data to relevant Vault Canisters

#### **BeamFi Stream Canister**
- **Time-locked Payment Schedules**: Creates vesting contracts for revenue distribution
- **Real-time Adjustments**: Automatically updates streams based on new revenue data
- **Claim Processing**: Handles NFT holder claims for vested amounts
- **Stream Management**: Provides queries for `stream_id`, `total_owed`, `vested_so_far`, `claimable_now`

#### **SNS DAO Canister (Governance)**
- **Service Nervous System Integration**: Each Vault connects to SNS governance
- **Proposal Management**: Handles governance proposals from NFT holders
- **Voting Mechanisms**: Weighted voting based on NFT ownership
- **Automatic Execution**: Proposals modify canister behavior through SNS hooks

### Data Flow & Inter-Canister Communication

1. **Campaign Initialization**: Factory → Vault creation → Canister linking
2. **Investment Flow**: User → Vault → NFT Registry (minting) 
3. **Revenue Updates**: External APIs → Oracle Aggregator → Vault → Stream adjustments
4. **Payout Distribution**: Vault → BeamFi Stream → NFT holder claims
5. **Governance Actions**: NFT holders → SNS DAO → Vault modifications

## Canister Documentation

### 1. Campaign Factory Canister

**Purpose**: Central registry and factory for creating new campaign vaults.

**Key Responsibilities**:
- Create new vault canisters for each campaign
- Maintain registry of all campaigns
- Manage campaign metadata and status
- Handle campaign lifecycle management

**State Management**:
- Uses stable storage for persistence across upgrades
- Maintains campaign counter for unique IDs
- Stores campaign metadata in stable BTreeMap

### 2. Vault Canister

**Purpose**: Core logic for individual campaigns, handling investments, NFT minting, and revenue distribution.

**Key Responsibilities**:
- Accept and track investments
- Coordinate NFT minting for backers
- Process revenue updates from oracles
- Calculate and distribute revenue shares
- Manage campaign funding progress

**State Management**:
- Stores campaign metadata and funding state
- Tracks backer investments and share percentages
- Maintains revenue history and distribution records

### 3. NFT Registry Canister

**Purpose**: ICRC-7 compliant NFT management for investment proof-of-ownership.

**Key Responsibilities**:
- Mint NFTs representing investment shares
- Handle NFT transfers and approvals
- Maintain token metadata and ownership records
- Provide ICRC-7 standard compliance

**Standards Compliance**:
- Fully implements ICRC-7 NFT standard
- Supports all required methods for transfers and approvals
- Maintains collection-level metadata

### 4. Real-time Revenue Tracking via Oracle Canister

The Oracle Aggregator Canister provides the critical bridge between Web2 platforms and the on-chain protocol through sophisticated HTTPS outcall mechanisms:

#### Supported Revenue Sources
- **YouTube Data API**: 
  - Channel analytics (views, subscribers, watch time)
  - Revenue data from YouTube Partner Program
  - Content performance metrics
- **Spotify for Artists**:
  - Streaming statistics and play counts
  - Revenue from Spotify streams
  - Audience demographics and engagement
- **Substack Metrics**:
  - Subscription counts and revenue
  - Post engagement statistics
  - Payment processing data

#### Oracle Operation Flow
1. **Periodic Polling**: Oracle makes scheduled HTTPS outcalls to configured endpoints
2. **Data Normalization**: Converts different API response formats to standard schema
3. **Verification Process**: Validates data authenticity and checks for anomalies
4. **Vault Updates**: Pushes verified revenue data to appropriate Vault Canisters
5. **State Synchronization**: Vault recalculates distribution amounts and updates internal state

#### Data Integrity Measures
- **API Authentication**: Secure token-based authentication with platforms
- **Anomaly Detection**: Identifies unusual revenue spikes or drops for manual review
- **Multi-source Verification**: Cross-references data across platforms when possible
- **Audit Trail**: Complete history of all oracle updates with timestamps and sources

### 5. BeamFi Streams from Stream Canister

The BeamFi Stream Canister implements sophisticated time-locked payment distribution with real-time adjustments based on revenue updates:

#### Stream Architecture
Each NFT holder receives a personalized stream with the following attributes:
- **`stream_id`**: Unique identifier for the payment stream
- **`total_owed`**: Total amount owed based on revenue share percentage
- **`vested_so_far`**: Amount that has vested according to time schedule
- **`claimable_now`**: Immediately claimable amount (vested - already claimed)

#### Dynamic Stream Adjustments
- **Revenue Updates**: Streams automatically recalculate when Oracle provides new revenue data
- **Proportional Distribution**: Each stream adjusts proportionally to maintain fair share allocation
- **Vesting Schedules**: Configurable vesting periods (linear, cliff, or custom curves)
- **Emergency Controls**: DAO can pause, modify, or terminate streams through governance

#### Claim Mechanisms
```rust
// Example stream query
let stream_info = stream_canister.get_stream_info(nft_holder_principal);
println!("Claimable now: {} tokens", stream_info.claimable_now);

// Claim vested amounts
stream_canister.claim_stream(stream_info.stream_id, stream_info.claimable_now).await?;
```

### 6. Governance via SNS DAO Canister

Each Vault Canister is connected to a **Service Nervous System (SNS)** governance canister, enabling decentralized decision-making by NFT holders:

#### Governance Scope
NFT holders can vote on critical campaign decisions:
- **Early Unlocks**: Accelerate vesting schedules under special circumstances
- **Performance Disputes**: Resolve disagreements about revenue reporting or distribution
- **Stream Modifications**: Adjust payment schedules or vesting parameters  
- **Campaign Refunds**: Authorize partial or full refunds to investors
- **Oracle Changes**: Update or add new revenue data sources

#### Voting Mechanisms
- **Weighted Voting**: Vote weight proportional to NFT ownership percentage
- **Proposal Lifecycle**: Submission → Discussion → Voting → Execution
- **Quorum Requirements**: Minimum participation thresholds for proposal validity
- **Time Locks**: Mandatory waiting periods before proposal execution

#### Automatic Execution
Approved proposals automatically modify canister behavior through SNS-exposed hooks:
```rust
// Example governance hook implementation
#[update]
fn execute_governance_proposal(proposal_id: u64, action: GovernanceAction) -> Result<(), String> {
    // Verify proposal was approved by SNS DAO
    let proposal_status = sns_dao.get_proposal_status(proposal_id)?;
    if !proposal_status.approved {
        return Err("Proposal not approved".to_string());
    }
    
    match action {
        GovernanceAction::EarlyUnlock { beneficiary, amount } => {
            // Modify stream to allow early claiming
            stream_canister.modify_vesting_schedule(beneficiary, amount).await?;
        },
        GovernanceAction::RefundCampaign { percentage } => {
            // Process refunds to NFT holders
            process_campaign_refund(percentage).await?;
        },
        // Additional governance actions...
    }
    
    Ok(())
}
```

#### Governance Token Integration
- **NFT-based Voting**: NFT ownership directly translates to governance participation
- **Delegation Support**: NFT holders can delegate voting rights to other participants
- **Proposal Incentives**: Reward mechanisms for active governance participation

## API Reference

### Campaign Factory API

#### `create_campaign`
Creates a new campaign and spawns a vault canister.

**Parameters**:
```rust
create_campaign(
    title: String,
    description: String,
    funding_goal: u64,
    revenue_share_percentage: u8,
    oracle_endpoints: Vec<String>
) -> Result<u64, String>
```

**Returns**: Campaign ID or error message

**Example**:
```rust
let campaign_id = create_campaign(
    "My Music Album".to_string(),
    "Funding my next album release".to_string(),
    10000, // 10,000 tokens funding goal
    25,    // 25% revenue share
    vec!["https://api.spotify.com/v1/artists/123".to_string()]
).await?;
```

#### `get_campaign`
Retrieves campaign metadata by ID.

**Parameters**:
```rust
get_campaign(campaign_id: u64) -> Option<CampaignMetadata>
```

#### `get_campaigns_by_creator`
Gets all campaigns created by a specific principal.

**Parameters**:
```rust
get_campaigns_by_creator(creator: Principal) -> Vec<(u64, CampaignMetadata)>
```

#### `get_active_campaigns`
Returns all currently active campaigns.

**Parameters**:
```rust
get_active_campaigns() -> Vec<(u64, CampaignMetadata)>
```

### Vault Canister API

#### `invest`
Make an investment in the campaign.

**Parameters**:
```rust
invest(amount: u64) -> InvestmentResult
```

**Returns**: Investment result with NFT token ID and share percentage

**Example**:
```rust
let result = invest(1000).await; // Invest 1000 tokens
if result.success {
    println!("Investment successful! Share: {}%", result.share_percentage);
}
```

#### `update_revenue`
Update campaign revenue (called by oracle).

**Parameters**:
```rust
update_revenue(amount: u64, source: String, verified: bool) -> Result<(), String>
```

#### `distribute_payouts`
Calculate and initiate revenue distribution.

**Parameters**:
```rust
distribute_payouts() -> Result<Vec<(Principal, u64)>, String>
```

#### `get_vault_state`
Get complete vault state information.

**Parameters**:
```rust
get_vault_state() -> Option<VaultState>
```

#### `get_funding_progress`
Get current funding progress.

**Parameters**:
```rust
get_funding_progress() -> (u64, u64, f64) // (current, goal, percentage)
```

### NFT Registry API (ICRC-7 Compliant)

#### Standard ICRC-7 Methods

```rust
// Collection information
icrc7_name() -> String
icrc7_description() -> String  
icrc7_total_supply() -> u64

// Token queries
icrc7_owner_of(token_id: u64) -> Option<Principal>
icrc7_balance_of(owner: Principal) -> u64
icrc7_tokens_of(owner: Principal) -> Vec<u64>
icrc7_token_metadata(token_id: u64) -> Option<TokenMetadata>

// Transfers and approvals
icrc7_transfer(args: TransferArgs) -> Result<u64, String>
icrc7_approve(args: ApprovalArgs) -> Result<u64, String>
icrc7_get_approved(token_id: u64) -> Option<Principal>
```

#### Custom Methods

```rust
mint(
    to: Principal,
    campaign_id: u64,
    vault_canister: Principal,
    investment_amount: u64,
    share_percentage: f64,
    metadata_json: String
) -> Result<u64, String>
```

## Usage Examples

### Creating a Campaign with Full Protocol Integration

```rust
// 1. Create campaign via factory with oracle endpoints
let campaign_id = campaign_factory::create_campaign(
    "Tech Startup Blog".to_string(),
    "Funding my technology blog on Substack".to_string(),
    50000, // 50,000 tokens goal
    30,    // 30% revenue share to investors
    vec![
        "https://api.substack.com/user/123/stats".to_string(),
        "https://api.youtube.com/v3/channels/UC123/statistics".to_string()
    ]
).await?;

// 2. Configure vault canister references for full protocol integration
let vault_canister = get_vault_canister_for_campaign(campaign_id)?;
vault_canister.set_canister_refs(
    Some(nft_registry_principal),
    Some(stream_canister_principal), 
    Some(oracle_principal)
)?;

// 3. Initialize oracle endpoints for this campaign
oracle_aggregator::register_campaign(
    campaign_id,
    vault_canister,
    vec![
        OracleEndpoint {
            platform: "substack".to_string(),
            api_url: "https://api.substack.com/user/123/stats".to_string(),
            auth_token: creator_api_token,
            update_frequency: Duration::from_hours(6),
        },
        OracleEndpoint {
            platform: "youtube".to_string(), 
            api_url: "https://api.youtube.com/v3/channels/UC123/statistics".to_string(),
            auth_token: youtube_api_key,
            update_frequency: Duration::from_hours(12),
        }
    ]
).await?;

println!("Campaign {} fully configured with oracle integration", campaign_id);
```

### Making an Investment with NFT Metadata

```rust
// 1. Invest in campaign through vault canister
let investment_result = vault::invest(5000).await; // 5000 tokens

if investment_result.success {
    // 2. NFT is automatically minted with comprehensive metadata
    let nft_id = investment_result.nft_token_id.unwrap();
    
    // 3. Verify NFT contains full protocol metadata
    let nft_metadata = nft_registry::icrc7_token_metadata(nft_id).unwrap();
    
    println!("NFT Metadata:");
    println!("  Campaign ID: {}", nft_metadata.campaign_id);
    println!("  Investment: {} tokens", nft_metadata.investment_amount);
    println!("  Share: {:.2}%", nft_metadata.share_percentage);
    println!("  Vault Canister: {}", nft_metadata.vault_canister.to_text());
    
    // 4. Check BeamFi stream creation
    let stream_info = stream_canister::get_stream_by_nft(nft_id)?;
    println!("Stream ID: {}", stream_info.stream_id);
    println!("Vesting Period: {} months", stream_info.vesting_period_months);
    
    // 5. View comprehensive investment details
    let backer_info = vault::get_backer_info(investor_principal).unwrap();
    println!("Total investment share: {}%", backer_info.share_percentage);
    println!("Investment timestamp: {}", backer_info.investment_timestamp);
}
```

### Complete Revenue Distribution Flow with Oracle Integration

```rust
// 1. Oracle automatically fetches revenue data (runs periodically)
let revenue_updates = oracle_aggregator::fetch_all_revenue_updates().await?;

for update in revenue_updates {
    println!("Revenue update from {}: {} tokens", update.platform, update.amount);
    
    // 2. Oracle pushes verified data to appropriate vault
    vault::update_revenue(
        update.amount,
        update.platform,
        true // Oracle verified
    ).await?;
}

// 3. Vault processes revenue and calculates new distributions
let vault_state = vault::get_vault_state().unwrap();
println!("Total campaign revenue: {} tokens", vault_state.total_revenue);

let distributable = (vault_state.total_revenue * vault_state.revenue_share_percentage as u64) / 100;
println!("Distributable to investors: {} tokens", distributable);

// 4. Distribute payouts via BeamFi streams
let payouts = vault::distribute_payouts().await?;
println!("Payout distribution:");

for (investor, amount) in &payouts {
    println!("  {}: {} tokens", investor.to_text(), amount);
    
    // 5. BeamFi creates/updates streaming schedules automatically
    let stream_update = stream_canister::update_stream_for_investor(
        *investor,
        *amount,
        vault_state.campaign_id
    ).await?;
    
    println!("    Stream updated: {} total owed, {} claimable now", 
             stream_update.total_owed, stream_update.claimable_now);
}

// 6. Investors can claim their vested amounts
let investor_stream = stream_canister::get_stream_info(investor_principal)?;
if investor_stream.claimable_now > 0 {
    let claim_result = stream_canister::claim_stream(
        investor_stream.stream_id,
        investor_stream.claimable_now
    ).await?;
    
    println!("Claimed {} tokens from stream", claim_result.amount_claimed);
}
```

### Governance Integration Example

```rust
// 1. NFT holder creates governance proposal
let proposal_id = sns_dao::submit_proposal(
    ProposalType::EarlyUnlock {
        campaign_id: 12345,
        beneficiary: struggling_investor_principal,
        unlock_percentage: 50, // Unlock 50% of vested amount early
        reason: "Financial hardship due to medical emergency".to_string()
    }
).await?;

// 2. Other NFT holders vote on the proposal
// Vote weight is proportional to NFT ownership percentage
sns_dao::vote_on_proposal(
    proposal_id,
    VoteOption::Yes,
    "Supporting early unlock for valid emergency".to_string()
).await?;

// 3. After voting period, proposal automatically executes if approved
let proposal_result = sns_dao::execute_proposal(proposal_id).await?;

if proposal_result.executed {
    // 4. Governance action automatically modifies stream canister
    let early_unlock_result = stream_canister::process_early_unlock(
        struggling_investor_principal,
        50 // percentage
    ).await?;
    
    println!("Early unlock processed: {} tokens now claimable", 
             early_unlock_result.additional_claimable);
}
```

### Advanced Oracle Configuration and Monitoring

```rust
// Configure multiple revenue sources with different update frequencies
let oracle_config = OracleConfiguration {
    campaign_id: 12345,
    endpoints: vec![
        OracleEndpoint {
            platform: "youtube".to_string(),
            api_url: "https://www.googleapis.com/youtube/v3/channels/{channel_id}/statistics".to_string(),
            headers: vec![("Authorization".to_string(), format!("Bearer {}", youtube_token))],
            update_frequency: Duration::from_hours(6),
            data_path: "items[0].statistics.viewCount".to_string(),
            verification_required: true,
        },
        OracleEndpoint {
            platform: "spotify".to_string(),
            api_url: "https://api.spotify.com/v1/artists/{artist_id}/top-tracks".to_string(),
            headers: vec![("Authorization".to_string(), format!("Bearer {}", spotify_token))],
            update_frequency: Duration::from_hours(12),
            data_path: "tracks[*].popularity".to_string(),
            verification_required: true,
        },
        OracleEndpoint {
            platform: "substack".to_string(),
            api_url: "https://api.substack.com/user/{user_id}/stats".to_string(),
            headers: vec![("Authorization".to_string(), format!("Bearer {}", substack_token))],
            update_frequency: Duration::from_hours(24),
            data_path: "revenue.total".to_string(),
            verification_required: true,
        }
    ],
    anomaly_detection: AnomalyConfig {
        max_increase_percentage: 200.0, // Flag increases over 200%
        max_decrease_percentage: 50.0,  // Flag decreases over 50%
        require_manual_verification: true,
    }
};

oracle_aggregator::configure_campaign_oracles(oracle_config).await?;

// Monitor oracle performance and data integrity
let oracle_stats = oracle_aggregator::get_campaign_oracle_stats(campaign_id)?;
println!("Oracle Statistics:");
println!("  Total updates: {}", oracle_stats.total_updates);
println!("  Failed requests: {}", oracle_stats.failed_requests);
println!("  Anomalies detected: {}", oracle_stats.anomalies_detected);
println!("  Last successful update: {}", oracle_stats.last_update_timestamp);
```

## Deployment Guide

### Prerequisites

1. **DFX SDK**: Install the latest version
```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

2. **Rust**: Install with wasm32 target
```bash
rustup target add wasm32-unknown-unknown
```

3. **Vessel**: For dependency management (if using Motoko)
```bash
cargo install vessel
```

### Setup Project

1. **Clone and setup directory structure**:
```bash
mkdir ipx-protocol && cd ipx-protocol
# Create the directory structure as shown earlier
```

2. **Configure dfx.json**:
```json
{
  "version": 1,
  "canisters": {
    "campaign_factory": {
      "type": "rust",
      "package": "campaign_factory"
    },
    "vault": {
      "type": "rust", 
      "package": "vault"
    },
    "nft_registry": {
      "type": "rust",
      "package": "nft_registry"
    },
    "oracle_aggregator": {
      "type": "rust",
      "package": "oracle_aggregator"
    },
    "beamfi_stream": {
      "type": "rust",
      "package": "beamfi_stream"
    },
    "sns_dao": {
      "type": "rust",
      "package": "sns_dao"
    }
  }
}
```

3. **Build and deploy**:
```bash
# Start local replica
dfx start --background --clean

# Build all canisters
dfx build

# Deploy all canisters
dfx deploy

# Or deploy individually
dfx deploy campaign_factory
dfx deploy nft_registry
# ... etc
```

### Production Deployment

1. **Configure for mainnet**:
```bash
dfx deploy --network ic --with-cycles 1000000000000
```

2. **Set up canister controllers**:
```bash
dfx canister --network ic update-settings campaign_factory --add-controller <DAO_PRINCIPAL>
```

## Integration Guide

### Frontend Integration

1. **Install agent-js**:
```bash
npm install @dfinity/agent @dfinity/candid @dfinity/principal
```

2. **Create agent and actors**:
```javascript
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as campaignFactoryIdl } from './declarations/campaign_factory';

const agent = new HttpAgent({ host: 'https://ic0.app' });
const campaignFactory = Actor.createActor(campaignFactoryIdl, {
  agent,
  canisterId: 'campaign-factory-canister-id'
});

// Create campaign
const campaignId = await campaignFactory.create_campaign(
  'My Campaign',
  'Description',
  BigInt(10000),
  25,
  ['https://api.example.com']
);
```

### Wallet Integration

1. **Internet Identity**:
```javascript
import { AuthClient } from '@dfinity/auth-client';

const authClient = await AuthClient.create();
await authClient.login({
  identityProvider: 'https://identity.ic0.app'
});
```

2. **Plug Wallet**:
```javascript
const plugConnected = await window.ic.plug.requestConnect({
  whitelist: ['campaign-factory-canister-id'],
  host: 'https://ic0.app'
});
```

### Oracle Integration

1. **Configure API endpoints**:
```rust
// In campaign creation
let oracle_endpoints = vec![
  "https://api.spotify.com/v1/artists/{id}/top-tracks".to_string(),
  "https://www.googleapis.com/youtube/v3/channels/{id}/statistics".to_string(),
  "https://api.substack.com/user/{id}/stats".to_string()
];
```

2. **Set up HTTPS outcalls**:
```rust
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpMethod, HttpHeader
};

let response = http_request(CanisterHttpRequestArgument {
    url: endpoint_url,
    method: HttpMethod::GET,
    headers: vec![
        HttpHeader {
            name: "Authorization".to_string(),
            value: format!("Bearer {}", api_key)
        }
    ],
    body: None,
    max_response_bytes: Some(2048),
    transform: None,
}).await?;
```

## Security Considerations

### Access Control
- Only vault canisters can mint NFTs
- Only oracle canisters can update revenue
- Only campaign creators can modify certain settings
- DAO governance required for critical protocol changes

### Input Validation
- All user inputs are validated and sanitized
- Revenue share percentages are capped at 100%
- Investment amounts are checked against funding goals
- Oracle data is verified before processing

### Upgradability
- All canisters support stable storage for upgrades
- Critical state is preserved across upgrades
- Upgrade proposals go through DAO governance

### Economic Security
- Revenue distributions are calculated deterministically
- All transactions are recorded immutably
- NFT ownership provides cryptographic proof of investment
- Streaming prevents manipulation of payout timing

## Troubleshooting

### Common Issues

1. **Canister out of cycles**:
```bash
dfx canister status campaign_factory
dfx ledger top-up campaign_factory --amount 1.0
```

2. **Wasm module too large**:
```bash
# Optimize build
cargo build --target wasm32-unknown-unknown --release
ic-wasm vault.wasm -o vault_optimized.wasm shrink
```

3. **Inter-canister call failures**:
- Check canister IDs are correct
- Verify network connectivity
- Ensure sufficient cycles for calls

### Monitoring and Logging

1. **View canister logs**:
```bash
dfx canister logs campaign_factory
```

2. **Monitor metrics**:
```rust
ic_cdk::println!("Campaign {} created with vault {}", campaign_id, vault_id);
```

## Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request with detailed description

### Testing
```bash
# Run unit tests
cargo test

# Run integration tests
dfx test
```

### Code Standards
- Follow Rust naming conventions
- Add documentation for public APIs
- Include error handling for all operations
- Use stable storage for persistent data

---

This documentation provides a comprehensive guide to understanding, deploying, and integrating with the IPX Protocol. For additional support, please refer to the Internet Computer documentation or open an issue in the project repository.