//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Post is Ownable {
  ISemaphore public semaphore;
  uint256 public groupId;
  uint public minCommitmentAge;
  uint public maxCommitmentAge;
  mapping(bytes32 => uint) public commitments;
  mapping(bytes32 => string) public postIdToArweaveTxs;

  event Committed(bytes32 commitment);
  event PostSent(bytes32 indexed postId, string indexed arweaveId);

  constructor(address semaphoreAddress, uint256 _groupId, uint _minCommitmentAge, uint _maxCommitmentAge) Ownable() {
    require(_maxCommitmentAge > _minCommitmentAge);
    minCommitmentAge = _minCommitmentAge;
    maxCommitmentAge = _maxCommitmentAge;

    semaphore = ISemaphore(semaphoreAddress);
    groupId = _groupId;

    semaphore.createGroup(groupId, 20, address(this));
  }

  function joinGroup(uint256 identityCommitment) external onlyOwner {
    semaphore.addMember(groupId, identityCommitment);
  }

  function _makeCommitment(bytes32 postId, string memory arweaveId) internal pure returns (bytes32) {
    bytes32 postIdBytes = keccak256(abi.encode(postId));
    bytes32 arweaveIdBytes = keccak256(bytes(arweaveId));
    return keccak256(abi.encode(postIdBytes, arweaveIdBytes));
  }

  function commit(bytes32 commitment) external {
    // if commitments[commitment] is within maxCommitmentAge, don't allow commit (to avoid overwriting other's commitment)
    require(commitments[commitment] + maxCommitmentAge < block.timestamp);
    commitments[commitment] = block.timestamp;
    emit Committed(commitment);
  }

  function _consumeCommitment(bytes32 commitment) internal {
    // Require a valid commitment that wait at least minCommitmentAge
    require(commitments[commitment] + minCommitmentAge <= block.timestamp);

    // If the commitment is too old, stop
    require(commitments[commitment] + maxCommitmentAge > block.timestamp);

    delete (commitments[commitment]);
  }

  // to allow user post multi times, externalNullifier is postId
  function sendPost(
    uint256 signal,
    uint256 merkleTreeRoot,
    uint256 nullifierHash,
    uint256 externalNullifier,
    uint256[8] calldata proof,
    bytes32 postId,
    string memory arweaveId
  ) external {
    // ensure the post commitment is submitted and valid
    bytes32 commitment = _makeCommitment(postId, arweaveId);
    _consumeCommitment(commitment);

    // check if the proof's signal is the post id
    require(postId == bytes32(signal));

    // ensure the postIdToArweaveTxs[postId] is not yet stored
    require(keccak256(bytes(postIdToArweaveTxs[postId])) == keccak256(bytes("")));

    postIdToArweaveTxs[postId] = arweaveId;

    semaphore.verifyProof(groupId, merkleTreeRoot, signal, nullifierHash, externalNullifier, proof);

    require(keccak256(bytes(postIdToArweaveTxs[postId])) == keccak256(bytes(arweaveId)));

    emit PostSent(postId, arweaveId);
  }
}
