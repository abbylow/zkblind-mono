//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Post is Ownable {
  ISemaphore public semaphore;
  uint256 public groupId;

  mapping(uint256 => string) public signalToArweaveTxs;

  event PostSent(uint256 indexed signal, string indexed arweaveId);

  constructor(address semaphoreAddress, uint256 _groupId) Ownable() {
    semaphore = ISemaphore(semaphoreAddress);
    groupId = _groupId;

    semaphore.createGroup(groupId, 20, address(this));
  }

  function joinGroup(uint256 identityCommitment) external onlyOwner {
    semaphore.addMember(groupId, identityCommitment);
  }

  function sendPost(
    uint256 merkleTreeRoot,
    uint256 nullifierHash,
    uint256[8] calldata proof,
    string memory arweaveId
  ) external {
    uint256 signal = uint256(keccak256(abi.encode(arweaveId)));

    // ensure signalToArweaveTxs[signal] is empty
    require(keccak256(bytes(signalToArweaveTxs[signal])) == keccak256(bytes("")));
    signalToArweaveTxs[signal] = arweaveId;

    semaphore.verifyProof(groupId, merkleTreeRoot, signal, nullifierHash, signal, proof); // use signal as external nullifier so user can post multi posts

    require(keccak256(bytes(signalToArweaveTxs[signal])) == keccak256(bytes(arweaveId)));

    emit PostSent(signal, arweaveId);
  }
}
