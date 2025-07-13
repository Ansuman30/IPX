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

- **Creator Campaigns**: Creators can launch funding campaigns with customizable revenue sharing percentages
- **NFT-Based Investment**: Each investment is represented by an ICRC-7 compliant NFT
- **Real-Time Revenue Tracking**: Oracle integration with major platforms for automatic revenue updates
- **Streaming Payouts**: Automated distribution of revenue shares to NFT holders
- **DAO Governance**: Community governance for dispute resolution and protocol upgrades

## Architecture

The IPX Protocol consists of six main canisters that work together to provide a complete decentralized finance solution:

```
┌─────────────────────────────────────────────────────────────┐
│                    IPX Protocol Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend/dApp                                              │
│       ↓                                                     │
│  Campaign Factory ──→ Vault Canisters (per campaign)       │
│       ↓                    ↓                                │
│  NFT Registry         Oracle Aggregator                     │
│       ↓                    ↓                                │
│  BeamFi Stream       SNS DAO Governance                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Campaign Creation**: Creator uses Campaign Factory to spawn a new Vault canister
2. **Investment**: Users invest in campaigns, receiving ICRC-7 NFTs as proof of ownership
3. **Revenue Tracking**: Oracle Aggregator monitors external platforms and updates Vault
4. **Payout Distribution**: Vault calculates shares and initiates streaming via BeamFi
5. **Governance**: SNS DAO handles disputes and protocol decisions

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

### 4. Oracle Aggregator Canister

**Purpose**: Fetch and verify revenue data from external platforms.

**Key Responsibilities**:
- Make HTTPS outcalls to platform APIs
- Verify and normalize revenue data
- Push updates to vault canisters
- Maintain audit trail of revenue updates

### 5. BeamFi Stream Canister

**Purpose**: Handle time-locked vesting and streaming payments.

**Key Responsibilities**:
- Create vesting schedules for revenue distributions
- Process claims from NFT holders
- Manage streaming payment calculations
- Handle emergency stops and modifications

### 6. SNS DAO Canister

**Purpose**: Decentralized governance for protocol decisions.

**Key Responsibilities**:
- Handle governance proposals
- Manage voting and execution
- Resolve disputes between creators and investors
- Control protocol upgrades and parameters

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

### Creating a Campaign

```rust
// 1. Create campaign via factory
let campaign_id = campaign_factory::create_campaign(
    "Tech Startup Blog".to_string(),
    "Funding my technology blog on Substack".to_string(),
    50000, // 50,000 tokens goal
    30,    // 30% revenue share
    vec!["https://api.substack.com/user/123/stats".to_string()]
).await?;

// 2. Configure vault canister references
vault::set_canister_refs(
    Some(nft_registry_principal),
    Some(stream_canister_principal),
    Some(oracle_principal)
)?;
```

### Making an Investment

```rust
// 1. Invest in campaign
let investment_result = vault::invest(5000).await; // 5000 tokens

if investment_result.success {
    // 2. NFT is automatically minted
    let nft_id = investment_result.nft_token_id.unwrap();
    
    // 3. Check NFT ownership
    let owner = nft_registry::icrc7_owner_of(nft_id);
    assert_eq!(owner, Some(investor_principal));
    
    // 4. View investment details
    let backer_info = vault::get_backer_info(investor_principal);
    println!("Investment share: {}%", backer_info.share_percentage);
}
```

### Revenue Distribution Flow

```rust
// 1. Oracle updates revenue (automated)
oracle::fetch_and_update_revenue(campaign_id).await?;

// 2. Vault processes the update
vault::update_revenue(15000, "Spotify".to_string(), true)?;

// 3. Distribute payouts to investors
let payouts = vault::distribute_payouts().await?;

// 4. BeamFi creates streaming schedules
for (investor, amount) in payouts {
    stream::create_stream(investor, amount, vesting_schedule).await?;
}

// 5. Investors can claim their streams
let claimable = stream::get_claimable_amount(investor_principal)?;
stream::claim(claimable).await?;
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