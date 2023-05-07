import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"
import { generateProof } from "@semaphore-protocol/proof"
import { expect } from "chai"
import { BigNumber, utils } from "ethers"
import { ethers, run } from "hardhat"
import { defaultAbiCoder } from "ethers/lib/utils.js"
// @ts-ignore: typechain folder will be generated after contracts compilation
import { Post } from "../build/typechain"
import { config } from "../package.json"

describe("Post", () => {
  let postContract: Post
  let semaphoreContract: string

  const groupId = "2"
  const group = new Group(groupId)
  const users: Identity[] = []

  before(async () => {
    const { semaphore } = await run("deploy:semaphore", {
      logs: false
    })

    postContract = await run("deploy", {
      logs: false,
      group: groupId,
      semaphore: semaphore.address
    })
    semaphoreContract = semaphore

    users.push(new Identity())
    users.push(new Identity())
  })

  describe("# joinGroup", async () => {
    it("Should allow owner add member to group", async () => {
      for await (const [i, user] of users.entries()) {
        const transaction = postContract.joinGroup(user.commitment)

        group.addMember(user.commitment)

        await expect(transaction)
          .to.emit(semaphoreContract, "MemberAdded")
          .withArgs(groupId, i, user.commitment, group.root)
      }
    })

    it("Should not allow non-owner add member to group", async () => {
      const [_owner, account2] = await ethers.getSigners()
      const postContractConnected = postContract.connect(account2)

      for await (const [i, user] of users.entries()) {
        const transaction = postContractConnected.joinGroup(user.commitment)

        await expect(transaction).to.be.revertedWith("Ownable: caller is not the owner")
      }
    })
  })

  describe("# sendFeedback", () => {
    const wasmFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.wasm`
    const zkeyFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.zkey`

    it("Should allow users to send post anonymously", async () => {
      const arTxId = "bnZvTjHTwirSLdqKtveRmPvH6PTOJPpa6n0kGCx5O4o"
      const arBytes32 = utils.keccak256(defaultAbiCoder.encode(["string"], [arTxId]))
      const arBigNum = BigNumber.from(arBytes32).toString()

      const fullProof = await generateProof(
        users[1],
        group,
        arBigNum, // external nullifier - allow user post multi posts
        arBigNum, // signal
        {
          wasmFilePath,
          zkeyFilePath
        }
      )

      const transaction = postContract.sendPost(
        fullProof.merkleTreeRoot,
        fullProof.nullifierHash,
        fullProof.proof,
        arTxId
      )

      await expect(transaction)
        .to.emit(semaphoreContract, "ProofVerified")
        .withArgs(groupId, fullProof.merkleTreeRoot, fullProof.nullifierHash, arBigNum, fullProof.signal)

      await expect(transaction).to.emit(postContract, "PostSent").withArgs(arBigNum, arTxId)
    })

    it("Should not allow users to send post if mapping existed", async () => {
      const arTxId = "bnZvTjHTwirSLdqKtveRmPvH6PTOJPpa6n0kGCx5O4o"
      const arBytes32 = utils.keccak256(defaultAbiCoder.encode(["string"], [arTxId]))
      const arBigNum = BigNumber.from(arBytes32).toString()

      const fullProof = await generateProof(
        users[1],
        group,
        arBigNum, // external nullifier - allow user post multi posts
        arBigNum, // signal
        {
          wasmFilePath,
          zkeyFilePath
        }
      )

      const transaction = postContract.sendPost(
        fullProof.merkleTreeRoot,
        fullProof.nullifierHash,
        fullProof.proof,
        arTxId
      )

      await expect(transaction).to.be.revertedWithoutReason()
    })
  })
})
