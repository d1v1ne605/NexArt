import {
  TokenMinted as TokenMintedEvent,
  Transfer as TransferEvent,
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  BaseURIUpdated as BaseURIUpdatedEvent,
  RoyaltySet as RoyaltySetEvent,
  CollectionInfoUpdated as CollectionInfoUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  Unpaused as UnpausedEvent,
} from "../generated/templates/NFTCollection/NFTCollection"
import {
  TokenMinted,
  Transfer,
  Approval,
  ApprovalForAll,
  BaseURIUpdated,
  RoyaltySet,
  CollectionInfoUpdated,
  NFTCollectionOwnershipTransferred,
  NFTCollectionPaused,
  NFTCollectionUnpaused,
} from "../generated/schema"

export function handleTokenMinted(event: TokenMintedEvent): void {
  let entity = new TokenMinted(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.tokenId = event.params.tokenId
  entity.to = event.params.to
  entity.tokenURI = event.params.tokenURI
  entity.collection = event.address

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId
  entity.collection = event.address

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.owner = event.params.owner
  entity.approved = event.params.approved
  entity.tokenId = event.params.tokenId
  entity.collection = event.address

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.owner = event.params.owner
  entity.operator = event.params.operator
  entity.approved = event.params.approved
  entity.collection = event.address

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBaseURIUpdated(event: BaseURIUpdatedEvent): void {
  let entity = new BaseURIUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.newBaseURI = event.params.newBaseURI
  entity.collection = event.address

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoyaltySet(event: RoyaltySetEvent): void {
  let entity = new RoyaltySet(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.tokenId = event.params.tokenId
  entity.royaltyBps = event.params.royaltyBps
  entity.collection = event.address

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCollectionInfoUpdated(event: CollectionInfoUpdatedEvent): void {
  let entity = new CollectionInfoUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.description = event.params.description
  entity.externalUrl = event.params.externalUrl
  entity.collection = event.address

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {
  let entity = new NFTCollectionOwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner
  entity.collection = event.address

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new NFTCollectionPaused(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.account = event.params.account
  entity.collection = event.address

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new NFTCollectionUnpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.account = event.params.account
  entity.collection = event.address

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}