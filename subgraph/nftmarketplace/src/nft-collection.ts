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
  Token,
} from "../generated/schema"
import { Address, Bytes, BigInt } from "@graphprotocol/graph-ts"

// Helper function to create token key
function createTokenKey(collection: Address, tokenId: BigInt): string {
  return collection.toHexString() + "-" + tokenId.toString()
}

// Helper function to update or create Token entity
function updateTokenOwnership(
  collection: Address,
  tokenId: BigInt,
  from: Address,
  to: Address,
  blockNumber: BigInt,
  blockTimestamp: BigInt,
  logIndex: BigInt,
  txHash: Bytes,
  tokenURI: string | null = null
): void {
  let tokenKey = createTokenKey(collection, tokenId)
  let token = Token.load(tokenKey)
  
  if (token == null) {
    // Create new token entity
    token = new Token(tokenKey)
    token.collection = collection
    token.tokenId = tokenId
    token.transferCount = BigInt.fromI32(0)
    token.isBurned = false
    token.lastTransferBlock = BigInt.fromI32(0)
    token.lastTransferLogIndex = BigInt.fromI32(0)
  }
  
  // Check if this event is newer than the last processed one
  let isNewer = token.lastTransferBlock.lt(blockNumber) ||
    (token.lastTransferBlock.equals(blockNumber) && token.lastTransferLogIndex.lt(logIndex))
  
  if (!isNewer) {
    // This event is older or equal, don't update to maintain idempotency
    return
  }
  
  // Check if this is a mint (from zero address)
  let zeroAddress = Address.fromString("0x0000000000000000000000000000000000000000")
  let isZeroAddress = from.equals(zeroAddress)
  if (isZeroAddress) {
    token.mintedAt = blockTimestamp
    token.mintedBy = to
    if (tokenURI != null) {
      token.tokenURI = tokenURI
    }
  }
  
  // Check if this is a burn (to zero address)
  let isToBurn = to.equals(zeroAddress)
  if (isToBurn) {
    token.currentOwner = null
    token.isBurned = true
  } else {
    token.currentOwner = to
    token.isBurned = false
  }
  
  // Update tracking fields
  token.lastTransferBlock = blockNumber
  token.lastTransferLogIndex = logIndex
  token.lastTransferTxHash = txHash
  token.lastTransferTimestamp = blockTimestamp
  token.transferCount = token.transferCount.plus(BigInt.fromI32(1))
  
  token.save()
}

export function handleTokenMinted(event: TokenMintedEvent): void {
  // Create immutable TokenMinted event entity
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

  // Update token ownership state (mint is a transfer from zero address)
  let zeroAddress = Address.fromString("0x0000000000000000000000000000000000000000")
  updateTokenOwnership(
    event.address,
    event.params.tokenId,
    zeroAddress,
    event.params.to,
    event.block.number,
    event.block.timestamp,
    event.logIndex,
    event.transaction.hash,
    event.params.tokenURI
  )
}

export function handleTransfer(event: TransferEvent): void {
  // Create immutable Transfer event entity
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

  // Update token ownership state
  updateTokenOwnership(
    event.address,
    event.params.tokenId,
    event.params.from,
    event.params.to,
    event.block.number,
    event.block.timestamp,
    event.logIndex,
    event.transaction.hash
  )
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