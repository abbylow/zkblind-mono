import { Contract } from "@ethersproject/contracts"
import { BigNumber, utils } from "ethers"
import getNextConfig from "next/config"
import { useCallback, useState } from "react"
import { useProvider } from "wagmi"
import { SemaphoreContextType } from "@/context/SemaphoreContext"
import Post from "../../contract-artifacts/Post.json"
import SemaphoreAbi from "../../contract-artifacts/Semaphore.json"
import { postContractStartBlock, semaphoreStartBlock } from "@/constants/contractStartBlocks"

const { publicRuntimeConfig: env } = getNextConfig()

// TODO: change the data structure to adapt more than 1 group
export default function useSemaphore(): SemaphoreContextType {
  const [_users, setUsers] = useState<any[]>([])
  const [_feedback, setFeedback] = useState<string[]>([])
  const [_arweaveMap, setArweaveMap] = useState<Record<string, string>>({})

  const provider = useProvider()
  const semaphoreContract = new Contract(env.SEMAPHORE_CONTRACT_ADDRESS, SemaphoreAbi, provider)

  const refreshUsers = useCallback(async (): Promise<void> => {
    // TODO: handle not only added event, but also udpated and removed
    const eventName = "MemberAdded"
    const filter = semaphoreContract.filters[eventName]([env.GROUP_ID])
    const events = await semaphoreContract.queryFilter(filter, semaphoreStartBlock) // TODO: queryFilter pagination / max returned data?

    const members = events.map((e) => e.args?.identityCommitment.toString())
    setUsers(members)
  }, [])

  const addUser = useCallback(
    (user: any) => {
      setUsers([..._users, user])
    },
    [_users]
  )

  const postContract = new Contract(env.POST_CONTRACT_ADDRESS, Post.abi, provider)

  const refreshPostSentEvents = useCallback(async (): Promise<void> => {
    const eventName = "PostSent"
    const filter = postContract.filters[eventName]()
    const events = await postContract.queryFilter(filter, postContractStartBlock) // TODO: queryFilter pagination / max returned data?

    const arMap: Record<string, string> = {}
    events.forEach(({ data, topics }) => {
      const arKey = BigNumber.from(topics[1]).toString()
      const arValue = utils.toUtf8String(`0x${data.slice(130)}`)
      arMap[arKey] = arValue.replace(/\0/g, "")
    })
    setArweaveMap(arMap)
  }, [])

  const refreshFeedback = useCallback(async (): Promise<void> => {
    const eventName = "ProofVerified"
    const filter = semaphoreContract.filters[eventName]([env.GROUP_ID])
    const proofVerifiedEvents = await semaphoreContract.queryFilter(filter, semaphoreStartBlock) // TODO: queryFilter pagination / max returned data?

    const signals = proofVerifiedEvents.reverse().map((event) => event.args?.signal.toString())
    setFeedback(signals)
  }, [])

  const addFeedback = useCallback(
    (feedback: string) => {
      setFeedback([feedback, ..._feedback])
    },
    [_feedback]
  )

  const addArweaveMap = useCallback(
    (signal: string, arTxId: string) => {
      setArweaveMap((prev) => {
        const newMap = prev
        newMap[signal] = arTxId
        return newMap
      })
    },
    [_feedback]
  )

  return {
    _users,
    _feedback,
    refreshUsers,
    addUser,
    refreshFeedback,
    addFeedback,
    refreshPostSentEvents,
    _arweaveMap,
    addArweaveMap
  }
}
