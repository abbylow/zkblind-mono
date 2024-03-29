import { Contract, providers, Wallet } from "ethers"
import type { NextApiRequest, NextApiResponse } from "next"
import Post from "../../../contract-artifacts/Post.json"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (typeof process.env.POST_CONTRACT_ADDRESS !== "string") {
        throw new Error("Please, define POST_CONTRACT_ADDRESS in your .env file")
    }

    if (typeof process.env.DEFAULT_NETWORK !== "string") {
        throw new Error("Please, define DEFAULT_NETWORK in your .env file")
    }

    if (typeof process.env.INFURA_API_KEY !== "string") {
        throw new Error("Please, define INFURA_API_KEY in your .env file")
    }

    if (typeof process.env.ETHEREUM_PRIVATE_KEY !== "string") {
        throw new Error("Please, define ETHEREUM_PRIVATE_KEY in your .env file")
    }

    const ethereumPrivateKey = process.env.ETHEREUM_PRIVATE_KEY
    const ethereumNetwork = process.env.DEFAULT_NETWORK
    const infuraApiKey = process.env.INFURA_API_KEY
    const contractAddress = process.env.POST_CONTRACT_ADDRESS

    const provider =
        ethereumNetwork === "localhost"
            ? new providers.JsonRpcProvider()
            : new providers.InfuraProvider(ethereumNetwork, infuraApiKey)

    const signer = new Wallet(ethereumPrivateKey, provider)
    const contract = new Contract(contractAddress, Post.abi, signer)

    const { merkleTreeRoot, nullifierHash, proof, arweaveId } = req.body

    try {
        const transaction = await contract.sendPost(merkleTreeRoot, nullifierHash, proof, arweaveId)

        await transaction.wait()

        res.status(200).end()
    } catch (error: any) {
        console.error(error)

        res.status(500).end()
    }
}
