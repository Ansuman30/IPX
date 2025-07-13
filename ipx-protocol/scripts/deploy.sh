#!/bin/bash

echo " Starting IPX Protocol deployment..."

# Stop any running dfx
dfx stop

# Start dfx in background
dfx start --clean --background

echo " Building all canisters..."
dfx build

echo "Deploying all canisters..."
dfx deploy

echo " Deployment complete!"
echo " Check canister status:"
dfx canister status --all

echo " Test with:"
echo "dfx canister call campaign_factory greet '(\"IPX Protocol\")'"
