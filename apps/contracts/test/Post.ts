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

const makeCommitment = (postId: string, arweaveId: string) => {
  const postIdBytes = utils.keccak256(defaultAbiCoder.encode(["bytes32"], [postId]))
  const arweaveIdBytes = utils.keccak256(utils.toUtf8Bytes(arweaveId))
  return utils.keccak256(defaultAbiCoder.encode(["bytes32", "bytes32"], [postIdBytes, arweaveIdBytes]))
}

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
      semaphore: semaphore.address,
      minCommitmentAge: 0, // for testing purpose, so only 0 seconds
      maxCommitmentAge: 604800
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

  describe("# commit", () => {
    it("Should only allow users to commit when there is no a recent commitment", async () => {
      const arTxId = "bnZvTjHTwirSLdqKtveRmPvH6PTOJPpa6n0kGCx5O4o"
      const postId = "X2auKXcXR7GEcN1XQZN7UQ=="
      const postCommitment = makeCommitment(utils.formatBytes32String(postId), arTxId)
      const transaction1 = postContract.commit(postCommitment) // first commit
      await expect(transaction1).to.emit(postContract, "Committed").withArgs(postCommitment)

      // Attempt to commit the same commitment again within maxCommitmentAge timeframe
      await expect(postContract.commit(postCommitment)).to.be.revertedWithoutReason()
    })
  })

  describe("# sendFeedback", () => {
    const wasmFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.wasm`
    const zkeyFilePath = `${config.paths.build["snark-artifacts"]}/semaphore.zkey`

    it("Should allow users to send post anonymously", async () => {
      // this commitment is submitted by last test case 'Should only allow users to commit when there is no a recent commitment'
      const arTxId = "bnZvTjHTwirSLdqKtveRmPvH6PTOJPpa6n0kGCx5O4o"
      const postId = "X2auKXcXR7GEcN1XQZN7UQ=="

      const postBytes = utils.formatBytes32String(postId)
      const postIdBigInt = BigNumber.from(postBytes).toString()

      const fullProof = await generateProof(
        users[1],
        group,
        postIdBigInt, // external nullifier - allow user post multi posts
        postIdBigInt, // signal
        {
          wasmFilePath,
          zkeyFilePath
        }
      )
      
      const transaction = postContract.sendPost(
        postIdBigInt,
        fullProof.merkleTreeRoot,
        fullProof.nullifierHash,
        postIdBigInt,
        fullProof.proof,
        postBytes,
        arTxId
      )

      await expect(transaction)
        .to.emit(semaphoreContract, "ProofVerified")
        .withArgs(groupId, fullProof.merkleTreeRoot, fullProof.nullifierHash, postIdBigInt, fullProof.signal)

      await expect(transaction).to.emit(postContract, "PostSent").withArgs(postBytes, arTxId)
    })

    it("Should not allow users to send post if there is no commitment", async () => {
      const arTxId = "bnZvTjHTwirSLdqKtveRmPvH6PTOJPpa6n0kGCx5O4o"
      const postId = "X2auKXcXR7GEcN1XQZNABC=="

      const postBytes = utils.formatBytes32String(postId)
      const postIdBigInt = BigNumber.from(postBytes).toString()

      const fullProof = await generateProof(
        users[1],
        group,
        postIdBigInt, // external nullifier - allow user post multi posts
        postIdBigInt, // signal
        {
          wasmFilePath,
          zkeyFilePath
        }
      )      
      const transaction = postContract.sendPost(
        postIdBigInt,
        fullProof.merkleTreeRoot,
        fullProof.nullifierHash,
        postIdBigInt,
        fullProof.proof,
        postBytes,
        arTxId
      )

      await expect(transaction).to.be.revertedWithoutReason()
    })

    it("Should not allow users to send post if mapping existed", async () => {
      // this commitment is submitted by last test case 'Should only allow users to commit when there is no a recent commitment'
      const arTxId = "bnZvTjHTwirSLdqKtveRmPvH6PTOJPpa6n0kGCx5ab1"
      const postId = "X2auKXcXR7GEcN1XQZN7UQ==" // same key with successful case

      const postCommitment = makeCommitment(utils.formatBytes32String(postId), arTxId)
      const transaction1 = postContract.commit(postCommitment)
      await expect(transaction1).to.emit(postContract, "Committed").withArgs(postCommitment)

      const postBytes = utils.formatBytes32String(postId)
      const postIdBigInt = BigNumber.from(postBytes).toString()

      const fullProof = await generateProof(
        users[1],
        group,
        postIdBigInt, // external nullifier - allow user post multi posts
        postIdBigInt, // signal
        {
          wasmFilePath,
          zkeyFilePath
        }
      )
      
      const transaction = postContract.sendPost(
        postIdBigInt,
        fullProof.merkleTreeRoot,
        fullProof.nullifierHash,
        postIdBigInt,
        fullProof.proof,
        postBytes,
        arTxId
      )

      await expect(transaction).to.be.revertedWithoutReason()
    })

    it("Should not allow users to send post if signal is not post id", async () => {
      // this commitment is submitted by last test case 'Should only allow users to commit when there is no a recent commitment'
      const arTxId = "bnZvTjHTwirSLdqKtveRmPvH6PTOJPpa6n0kGCx5111"
      const postId = "X2auKXcXR7GEcN1XQZN7UQ==" // same key with successful case

      const postCommitment = makeCommitment(utils.formatBytes32String(postId), arTxId)
      const transaction1 = postContract.commit(postCommitment)
      await expect(transaction1).to.emit(postContract, "Committed").withArgs(postCommitment)

      const postBytes = utils.formatBytes32String(postId)
      const postIdBigInt = BigNumber.from(utils.formatBytes32String("X2auKXcXR7G2421XQZN7UQ==")).toString()

      const fullProof = await generateProof(
        users[1],
        group,
        postIdBigInt, // external nullifier - allow user post multi posts
        postIdBigInt, // signal
        {
          wasmFilePath,
          zkeyFilePath
        }
      )
      
      const transaction = postContract.sendPost(
        postIdBigInt,
        fullProof.merkleTreeRoot,
        fullProof.nullifierHash,
        postIdBigInt,
        fullProof.proof,
        postBytes,
        arTxId
      )

      await expect(transaction).to.be.revertedWithoutReason()
    })
  })
})
