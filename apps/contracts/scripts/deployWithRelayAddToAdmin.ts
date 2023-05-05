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
  const FeedbackFactory = await ethers.getContractFactory("Feedback")
  const feedbackContract = await FeedbackFactory.connect(relaySigner)
    .deploy(semaphoreAddress, groupId)
    .then((f) => f.deployed())

  writeFileSync(
    "deploy.json",
    JSON.stringify(
      {
        FeedbackContract: feedbackContract.address
      },
      null,
      2
    )
  )
  console.log(`FeedbackContract deployed: ${feedbackContract.address}\n`)
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

// Command: npx hardhat run scripts/deployWithRelayAddToAdmin.ts
