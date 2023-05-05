import type { NextApiRequest, NextApiResponse } from "next"
import { SemaphoreEthers } from "@semaphore-protocol/data"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (typeof process.env.ALCHEMY_URL !== "string") {
    throw new Error("Please, define ALCHEMY_URL in your .env file")
  }

  if (typeof process.env.SEMAPHORE_CONTRACT_ADDRESS !== "string") {
    throw new Error("Please, define SEMAPHORE_CONTRACT_ADDRESS in your .env file")
  }

  if (typeof process.env.GROUP_ID !== "string") {
    throw new Error("Please, define GROUP_ID in your .env file")
  }

  if (typeof process.env.INFURA_API_KEY !== "string") {
    throw new Error("Please, define INFURA_API_KEY in your .env file")
  }
  console.log('process.env.ALCHEMY_URL', process.env.ALCHEMY_URL)
  console.log('process.env.INFURA_API_KEY', process.env.INFURA_API_KEY)
  try {
    // const semaphore = new SemaphoreEthers(process.env.NEXT_PUBLIC_NETWORK, {
    //   address: process.env.SEMAPHORE_CONTRACT_ADDRESS,
    // })
    const semaphore = new SemaphoreEthers(process.env.ALCHEMY_URL, {
      address: process.env.SEMAPHORE_CONTRACT_ADDRESS,
      provider: "alchemy",
      apiKey: process.env.INFURA_API_KEY
    })
    const groupMembers = await semaphore.getGroupMembers(process.env.GROUP_ID)
    
    const { identityCommitment } = req.body
    
    const userAlreadyInGroup = groupMembers.includes(identityCommitment)
    
    res.status(200).json({ userAlreadyInGroup })
  } catch (error: any) {
    console.error(error)
    res.status(500).end()
  }
}
