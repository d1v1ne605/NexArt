import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  FeeRecipientUpdated,
  FeeUpdated,
  FeesWithdrawn,
  MinimumFeeUpdated,
  OwnershipTransferred,
  Paused,
  Unpaused
} from "../generated/MarketplaceFeeManager/MarketplaceFeeManager"

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

export function createFeeUpdatedEvent(
  oldFeeBps: BigInt,
  newFeeBps: BigInt
): FeeUpdated {
  let feeUpdatedEvent = changetype<FeeUpdated>(newMockEvent())

  feeUpdatedEvent.parameters = new Array()

  feeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldFeeBps",
      ethereum.Value.fromUnsignedBigInt(oldFeeBps)
    )
  )
  feeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newFeeBps",
      ethereum.Value.fromUnsignedBigInt(newFeeBps)
    )
  )

  return feeUpdatedEvent
}

export function createFeesWithdrawnEvent(
  recipient: Address,
  amount: BigInt
): FeesWithdrawn {
  let feesWithdrawnEvent = changetype<FeesWithdrawn>(newMockEvent())

  feesWithdrawnEvent.parameters = new Array()

  feesWithdrawnEvent.parameters.push(
    new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient))
  )
  feesWithdrawnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return feesWithdrawnEvent
}

export function createMinimumFeeUpdatedEvent(
  oldMinimumFee: BigInt,
  newMinimumFee: BigInt
): MinimumFeeUpdated {
  let minimumFeeUpdatedEvent = changetype<MinimumFeeUpdated>(newMockEvent())

  minimumFeeUpdatedEvent.parameters = new Array()

  minimumFeeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldMinimumFee",
      ethereum.Value.fromUnsignedBigInt(oldMinimumFee)
    )
  )
  minimumFeeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newMinimumFee",
      ethereum.Value.fromUnsignedBigInt(newMinimumFee)
    )
  )

  return minimumFeeUpdatedEvent
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
