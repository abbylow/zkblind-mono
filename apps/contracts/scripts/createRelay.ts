import { RelayClient } from 'defender-relay-client';
import { appendFileSync, writeFileSync } from 'fs';
import { Network } from 'defender-base-client';
import * as dotenv from 'dotenv'

dotenv.config()

async function run() {
  const { DEFENDER_API_KEY: apiKey, DEFENDER_API_SECRET: apiSecret } = process.env;
  if (!apiKey || !apiSecret) {
    console.error('Lack of defender API key or secret');
    return;
  }
  const relayClient = new RelayClient({ apiKey, apiSecret });

  // create relay using defender client
  const requestParams = {
    name: 'ZkBlindTestnetRelayer',
    network: 'mumbai' as Network,
    minBalance: BigInt(1e17).toString(),
  };
  const relayer = await relayClient.create(requestParams);
  
  // store relayer info in file (optional)
  writeFileSync('relay.json', JSON.stringify({
    relayer
  }, null, 2));
  console.log('Relayer ID: ', relayer);
  appendFileSync('.env', relayer.relayerId);

  // create and save the api key to .env - needed for sending tx
  const {apiKey: relayerKey, secretKey: relayerSecret} = await relayClient.createKey(relayer.relayerId);
  appendFileSync('.env', `\nRELAYER_KEY=${relayerKey}\nRELAYER_SECRET=${relayerSecret}`);
}

run()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })

// Command: npx hardhat run scripts/createRelay.ts