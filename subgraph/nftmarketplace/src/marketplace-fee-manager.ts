import {
  FeeRecipientUpdated as FeeRecipientUpdatedEvent,
  FeeUpdated as FeeUpdatedEvent,
  FeesWithdrawn as FeesWithdrawnEvent,
  MinimumFeeUpdated as MinimumFeeUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  Unpaused as UnpausedEvent
} from "../generated/MarketplaceFeeManager/MarketplaceFeeManager"
import {
  MarketplaceFeeManagerFeeRecipientUpdated,
  FeeUpdated,
  FeesWithdrawn,
  MinimumFeeUpdated,
  MarketplaceFeeManagerOwnershipTransferred,
  MarketplaceFeeManagerPaused,
  MarketplaceFeeManagerUnpaused
} from "../generated/schema"

export function handleFeeRecipientUpdated(
  event: FeeRecipientUpdatedEvent
): void {
  let entity = new MarketplaceFeeManagerFeeRecipientUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldRecipient = event.params.oldRecipient
  entity.newRecipient = event.params.newRecipient

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFeeUpdated(event: FeeUpdatedEvent): void {
  let entity = new FeeUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldFeeBps = event.params.oldFeeBps
  entity.newFeeBps = event.params.newFeeBps

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFeesWithdrawn(event: FeesWithdrawnEvent): void {
  let entity = new FeesWithdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.recipient = event.params.recipient
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMinimumFeeUpdated(event: MinimumFeeUpdatedEvent): void {
  let entity = new MinimumFeeUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldMinimumFee = event.params.oldMinimumFee
  entity.newMinimumFee = event.params.newMinimumFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new MarketplaceFeeManagerOwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new MarketplaceFeeManagerPaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new MarketplaceFeeManagerUnpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
