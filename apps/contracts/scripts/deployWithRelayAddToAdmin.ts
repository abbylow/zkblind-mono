import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers"
import { ethers } from "hardhat"
import { writeFileSync } from "fs"
import * as dotenv from "dotenv"

dotenv.config()

async function main() {
  const { RELAYER_KEY: apiKey, RELAYER_SECRET: apiSecret, GROUP_ID: groupId, SEMAPHORE_CONTRACT_ADDRESS: semaphoreAddress } = process.env

  if (!apiKey || !apiSecret) {
    console.error("Lack of defender API key or secret")
    return
  }

  const provider = new DefenderRelayProvider({ apiKey, apiSecret })
  const relaySigner = new DefenderRelaySigner({ apiKey, apiSecret }, provider, { speed: "fast" })

  if (!semaphoreAddress || !groupId) {
    console.error('Lack of Semaphore address or group id')
    return;
  }

  // Deploy contracts with Relay
  const PostFactory = await ethers.getContractFactory("Post")
  const postContract = await PostFactory.connect(relaySigner)
    .deploy(semaphoreAddress, groupId)
    .then((f) => f.deployed())

  writeFileSync(
    "deploy.json",
    JSON.stringify(
      {
        PostContract: postContract.address
      },
      null,
      2
    )
  )
  console.log(`PostContract deployed: ${postContract.address}\n`)
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

// To deploy: npx hardhat run scripts/deployWithRelayAddToAdmin.ts
// To verify: npx hardhat verify --network mumbai [DEPLOYED ADDRESS] [SEMAPHORE_CONTRACT_ADDRESS] [GROUP_ID]