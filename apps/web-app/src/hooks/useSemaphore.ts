import { SemaphoreEthers } from "@semaphore-protocol/data"
import { BigNumber, utils } from "ethers"
import getNextConfig from "next/config"
import { useCallback, useState } from "react"
import { SemaphoreContextType } from "@/context/SemaphoreContext"

const { publicRuntimeConfig: env } = getNextConfig()

// const ethereumNetwork = env.DEFAULT_NETWORK === "localhost" ? "http://localhost:8545" : env.DEFAULT_NETWORK

const ethereumNetwork = process.env.NEXT_PUBLIC_NETWORK;
// const ethereumNetwork = "http://localhost:8545";

// TODO: change the data structure to adapt more than 1 group
export default function useSemaphore(): SemaphoreContextType {
    const [_users, setUsers] = useState<any[]>([])
    const [_feedback, setFeedback] = useState<string[]>([])

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

    const refreshFeedback = useCallback(async (): Promise<void> => {
        const semaphore = new SemaphoreEthers(ethereumNetwork, {
            address: env.SEMAPHORE_CONTRACT_ADDRESS
        })

        const proofs = await semaphore.getGroupVerifiedProofs(env.GROUP_ID)

        setFeedback(proofs.reverse().map(({ signal }: any) => utils.parseBytes32String(BigNumber.from(signal).toHexString())))
    }, [])

    const addFeedback = useCallback(
        (feedback: string) => {
            setFeedback([feedback, ..._feedback])
        },
        [_feedback]
    )

    return {
        _users,
        _feedback,
        refreshUsers,
        addUser,
        refreshFeedback,
        addFeedback
    }
}
