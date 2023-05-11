import { SemaphoreEthers } from "@semaphore-protocol/data"
import { Contract } from "@ethersproject/contracts"
import { BigNumber, utils } from "ethers"
import getNextConfig from "next/config"
import { useCallback, useState } from "react"
import { useProvider } from "wagmi"
import { SemaphoreContextType } from "@/context/SemaphoreContext"
import Post from "../../contract-artifacts/Post.json"

const { publicRuntimeConfig: env } = getNextConfig()

// const ethereumNetwork = env.DEFAULT_NETWORK === "localhost" ? "http://localhost:8545" : env.DEFAULT_NETWORK
const ethereumNetwork = process.env.NEXT_PUBLIC_NETWORK
// const ethereumNetwork = "http://localhost:8545";

const postContractStartBlock = 35347713

// TODO: change the data structure to adapt more than 1 group
export default function useSemaphore(): SemaphoreContextType {
  const [_users, setUsers] = useState<any[]>([])
  const [_feedback, setFeedback] = useState<string[]>([])
  const [_arweaveMap, setArweaveMap] = useState<Record<string, string>>({})

  const refreshUsers = useCallback(async (): Promise<void> => {
    const semaphore = new SemaphoreEthers(ethereumNetwork, {
      address: env.SEMAPHORE_CONTRACT_ADDRESS
    })

    const members = await semaphore.getGroupMembers(env.GROUP_ID)

    setUsers(members)
  }, [])

  const addUser = useCallback(
    (user: any) => {
      setUsers([..._users, user])
    },
    [_users]
  )

  const provider = useProvider()
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
    const semaphore = new SemaphoreEthers(ethereumNetwork, {
      address: env.SEMAPHORE_CONTRACT_ADDRESS
    })

    const proofs = await semaphore.getGroupVerifiedProofs(env.GROUP_ID)

    const signals = proofs.reverse().map(({ signal }: any) => signal)

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
