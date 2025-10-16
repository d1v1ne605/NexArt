import {
  ItemListed as ItemListedEvent,
  ItemSold as ItemSoldEvent,
  ListingCancelled as ListingCancelledEvent,
  MinimumListingPriceUpdated as MinimumListingPriceUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  PaymentTokenUpdated as PaymentTokenUpdatedEvent,
  Unpaused as UnpausedEvent,
} from "../generated/Marketplace/Marketplace"
import {
  ItemListed,
  ItemSold,
  ListingCancelled,
  MinimumListingPriceUpdated,
  MarketplaceOwnershipTransferred,
  MarketplacePaused,
  PaymentTokenUpdated,
  MarketplaceUnpaused,
} from "../generated/schema"

export function handleItemListed(event: ItemListedEvent): void {
  let entity = new ItemListed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.listingId = event.params.listingId
  entity.seller = event.params.seller
  entity.nftContract = event.params.nftContract
  entity.tokenId = event.params.tokenId
  entity.price = event.params.price
  entity.paymentToken = event.params.paymentToken

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleItemSold(event: ItemSoldEvent): void {
  let entity = new ItemSold(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.listingId = event.params.listingId
  entity.buyer = event.params.buyer
  entity.seller = event.params.seller
  entity.nftContract = event.params.nftContract
  entity.tokenId = event.params.tokenId
  entity.price = event.params.price
  entity.paymentToken = event.params.paymentToken
  entity.marketFee = event.params.marketFee
  entity.royaltyFee = event.params.royaltyFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleListingCancelled(event: ListingCancelledEvent): void {
  let entity = new ListingCancelled(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.listingId = event.params.listingId
  entity.seller = event.params.seller
  entity.nftContract = event.params.nftContract
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaymentTokenUpdated(
  event: PaymentTokenUpdatedEvent,
): void {
  let entity = new PaymentTokenUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.token = event.params.token
  entity.supported = event.params.supported

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMinimumListingPriceUpdated(
  event: MinimumListingPriceUpdatedEvent,
): void {
  let entity = new MinimumListingPriceUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.oldPrice = event.params.oldPrice
  entity.newPrice = event.params.newPrice

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent,
): void {
  let entity = new MarketplaceOwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new MarketplacePaused(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new MarketplaceUnpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
