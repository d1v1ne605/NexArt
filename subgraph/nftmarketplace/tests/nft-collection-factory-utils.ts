import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  CollectionCreated,
  DeploymentFeeUpdated,
  FeeRecipientUpdated,
  MaxCollectionsPerCreatorUpdated,
  OwnershipTransferred,
  Paused,
  Unpaused
} from "../generated/NFTCollectionFactory/NFTCollectionFactory"

export function createCollectionCreatedEvent(
  collection: Address,
  creator: Address,
  name: string,
  symbol: string,
  maxSupply: BigInt
): CollectionCreated {
  let collectionCreatedEvent = changetype<CollectionCreated>(newMockEvent())

  collectionCreatedEvent.parameters = new Array()

  collectionCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "collection",
      ethereum.Value.fromAddress(collection)
    )
  )
  collectionCreatedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  collectionCreatedEvent.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name))
  )
  collectionCreatedEvent.parameters.push(
    new ethereum.EventParam("symbol", ethereum.Value.fromString(symbol))
  )
  collectionCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "maxSupply",
      ethereum.Value.fromUnsignedBigInt(maxSupply)
    )
  )

  return collectionCreatedEvent
}

export function createDeploymentFeeUpdatedEvent(
  oldFee: BigInt,
  newFee: BigInt
): DeploymentFeeUpdated {
  let deploymentFeeUpdatedEvent =
    changetype<DeploymentFeeUpdated>(newMockEvent())

  deploymentFeeUpdatedEvent.parameters = new Array()

  deploymentFeeUpdatedEvent.parameters.push(
    new ethereum.EventParam("oldFee", ethereum.Value.fromUnsignedBigInt(oldFee))
  )
  deploymentFeeUpdatedEvent.parameters.push(
    new ethereum.EventParam("newFee", ethereum.Value.fromUnsignedBigInt(newFee))
  )

  return deploymentFeeUpdatedEvent
}

export function createFeeRecipientUpdatedEvent(
  oldRecipient: Address,
  newRecipient: Address
): FeeRecipientUpdated {
  let feeRecipientUpdatedEvent = changetype<FeeRecipientUpdated>(newMockEvent())

  feeRecipientUpdatedEvent.parameters = new Array()

  feeRecipientUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldRecipient",
      ethereum.Value.fromAddress(oldRecipient)
    )
  )
  feeRecipientUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newRecipient",
      ethereum.Value.fromAddress(newRecipient)
    )
  )

  return feeRecipientUpdatedEvent
}

export function createMaxCollectionsPerCreatorUpdatedEvent(
  oldMax: BigInt,
  newMax: BigInt
): MaxCollectionsPerCreatorUpdated {
  let maxCollectionsPerCreatorUpdatedEvent =
    changetype<MaxCollectionsPerCreatorUpdated>(newMockEvent())

  maxCollectionsPerCreatorUpdatedEvent.parameters = new Array()

  maxCollectionsPerCreatorUpdatedEvent.parameters.push(
    new ethereum.EventParam("oldMax", ethereum.Value.fromUnsignedBigInt(oldMax))
  )
  maxCollectionsPerCreatorUpdatedEvent.parameters.push(
    new ethereum.EventParam("newMax", ethereum.Value.fromUnsignedBigInt(newMax))
  )

  return maxCollectionsPerCreatorUpdatedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPausedEvent(account: Address): Paused {
  let pausedEvent = changetype<Paused>(newMockEvent())

  pausedEvent.parameters = new Array()

  pausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return pausedEvent
}

export function createUnpausedEvent(account: Address): Unpaused {
  let unpausedEvent = changetype<Unpaused>(newMockEvent())

  unpausedEvent.parameters = new Array()

  unpausedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )

  return unpausedEvent
}
