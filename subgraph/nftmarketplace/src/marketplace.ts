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
  MarketplaceStats,
  CollectionStats,
} from "../generated/schema"
import { BigInt, Address } from "@graphprotocol/graph-ts"

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

  // Update marketplace stats
  updateMarketplaceStats("listing", BigInt.zero())
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

  // 🔥 Track volume only for ETH sales (paymentToken == 0x0)
  if (event.params.paymentToken.equals(Address.zero())) {
    updateMarketplaceStats("sale", event.params.price)
    updateCollectionStats(event.params.nftContract, event.params.price)
  }
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

// Helper functions for stats tracking
function updateMarketplaceStats(action: string, salePrice: BigInt): void {
  let stats = MarketplaceStats.load("marketplace-stats")
  if (stats == null) {
    stats = new MarketplaceStats("marketplace-stats")
    stats.totalVolume = BigInt.zero()
    stats.totalSales = BigInt.zero()
    stats.totalListings = BigInt.zero()
    stats.totalCollections = BigInt.zero()
  }

  if (action == "sale") {
    stats.totalVolume = stats.totalVolume.plus(salePrice)
    stats.totalSales = stats.totalSales.plus(BigInt.fromI32(1))
  } else if (action == "listing") {
    stats.totalListings = stats.totalListings.plus(BigInt.fromI32(1))
  }

  stats.save()
}

function updateCollectionStats(collectionAddress: Address, salePrice: BigInt): void {
  let stats = CollectionStats.load(collectionAddress)
  if (stats == null) {
    stats = new CollectionStats(collectionAddress)
    stats.collection = collectionAddress
    stats.totalVolume = BigInt.zero()
    stats.totalSales = BigInt.zero()
    stats.floorPrice = BigInt.zero()
    stats.totalSupply = BigInt.zero()
    stats.creator = Address.zero()
  }

  stats.totalVolume = stats.totalVolume.plus(salePrice)
  stats.totalSales = stats.totalSales.plus(BigInt.fromI32(1))
  
  // Update floor price if this is lower (or first sale)
  if (stats.floorPrice.equals(BigInt.zero()) || salePrice.lt(stats.floorPrice)) {
    stats.floorPrice = salePrice
  }

  stats.save()
}
