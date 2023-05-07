import { utils } from "ethers"
import { defaultAbiCoder } from "ethers/lib/utils.js"

const makeCommitment = (postId: string, arweaveId: string) => {
  const postIdBytes = utils.keccak256(defaultAbiCoder.encode(['bytes32'], [postId]))
  const arweaveIdBytes = utils.keccak256(utils.toUtf8Bytes(arweaveId))
  return utils.keccak256(defaultAbiCoder.encode(["bytes32", "bytes32"], [postIdBytes, arweaveIdBytes]))
}

export default makeCommitment
