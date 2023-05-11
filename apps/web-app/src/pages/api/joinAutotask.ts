import { Contract, providers } from "ethers"
import type { NextApiRequest, NextApiResponse } from "next"
import Post from "../../../contract-artifacts/Post.json"
import SemaphoreAbi from "../../../contract-artifacts/Semaphore.json"

const semaphoreStartBlock = 35252642
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (typeof process.env.POST_CONTRACT_ADDRESS !== "string") {
    throw new Error("Please, define POST_CONTRACT_ADDRESS in your .env file")
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

  if (typeof process.env.OPENZEPPELIN_AUTOTASK_WEBHOOK !== "string") {
    throw new Error("Please, define OPENZEPPELIN_AUTOTASK_WEBHOOK in your .env file")
  }

  const { identityCommitment } = req.body

  // Check if the user already in the group
  const semaphoreContract = new Contract(
    process.env.SEMAPHORE_CONTRACT_ADDRESS,
    SemaphoreAbi,
    new providers.AlchemyProvider("maticmum", process.env.INFURA_API_KEY)
  )
  const eventName = "MemberAdded"
  const filter = semaphoreContract.filters[eventName]()
  const events = await semaphoreContract.queryFilter(filter, semaphoreStartBlock) // TODO: queryFilter pagination / max returned data?

  const members = events
    .filter((e) => e.args?.groupId.toString() === process.env.GROUP_ID)
    .map((e) => e.args?.identityCommitment.toString())

  const inGroup = members.includes(identityCommitment)

  // join if not yet in group
  if (inGroup) {
    console.log(`User ${identityCommitment} has joined the group ${process.env.GROUP_ID} already.`)
    res.status(200).json({ inGroup: true })
  } else {
    console.log(`Let user ${identityCommitment} join the group ${process.env.GROUP_ID} now.`)
    try {
      const response = await fetch(process.env.OPENZEPPELIN_AUTOTASK_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          abi: Post.abi,
          address: process.env.POST_CONTRACT_ADDRESS,
          functionName: "joinGroup",
          functionParameters: [identityCommitment]
        })
      })
      const resJson = await response.json()
      if (resJson.status === "error") throw Error("Autotask failed")
      res.status(200).json({ inGroup: true })
    } catch (error: any) {
      console.error(error)
      res.status(500).end()
    }
  }
}
