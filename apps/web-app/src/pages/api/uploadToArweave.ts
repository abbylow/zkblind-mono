import type { NextApiRequest, NextApiResponse } from "next"
import Arweave from "arweave"
import crypto from "crypto"
import { utils } from "ethers/lib/ethers"

const arweave = Arweave.init({
  host: "arweave.net", // Hostname or IP address for a Arweave host
  port: 443, // Port
  protocol: "https" // Network protocol http or https
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (typeof process.env.ARWEAVE_APP_KEY !== "string") {
    throw new Error("Please, define ARWEAVE_APP_KEY in your .env file")
  }

  const privateKey = JSON.parse(process.env.ARWEAVE_APP_KEY)
  const { postBody, postTags, postParentId } = req.body

  try {
    // create post uuid using crypto.randomUUID
    const uuid = crypto.randomUUID()
    const removedHyphen = uuid.replace(/-/g, "")
    const postId = Buffer.from(removedHyphen, "hex").toString("base64")

    // Create a data transaction
    const tx = await arweave.createTransaction(
      {
        data: JSON.stringify({
          id: postId,
          content: postBody,
          tags: postTags,
          parentId: postParentId
        })
      },
      privateKey
    )
    tx.addTag("Content-Type", "text/json")
    tx.addTag("App-Name", "ZkBlind")
    tx.addTag("App-Version", "v1")

    await arweave.transactions.sign(tx, privateKey)

    const uploader = await arweave.transactions.getUploader(tx)

    while (!uploader.isComplete) {
      await uploader.uploadChunk()
      console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`)
    }

    res.status(200).json({
      postId,
      arTxId: tx.id
    })
  } catch (error: any) {
    console.error(error)
    res.status(500).end()
  }
}
