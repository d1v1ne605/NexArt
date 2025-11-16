import {
  CollectionCreated as CollectionCreatedEvent,
  DeploymentFeeUpdated as DeploymentFeeUpdatedEvent,
  FeeRecipientUpdated as FeeRecipientUpdatedEvent,
  MaxCollectionsPerCreatorUpdated as MaxCollectionsPerCreatorUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  Unpaused as UnpausedEvent,
} from "../generated/NFTCollectionFactory/NFTCollectionFactory";
import {
  CollectionCreated,
  DeploymentFeeUpdated,
  NFTCollectionFactoryFeeRecipientUpdated,
  MaxCollectionsPerCreatorUpdated,
  NFTCollectionFactoryOwnershipTransferred,
  NFTCollectionFactoryPaused,
  NFTCollectionFactoryUnpaused,
  MarketplaceStats,
  CollectionStats,
} from "../generated/schema";
import { NFTCollection } from "../generated/templates";
import { Address, BigInt } from "@graphprotocol/graph-ts";

export function handleCollectionCreated(event: CollectionCreatedEvent): void {
  let entity = new CollectionCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.collection = event.params.collection;
  entity.creator = event.params.creator;
  entity.avatarCollection = event.params.avatarCollection;
  entity.description = event.params.description;
  entity.name = event.params.name;
  entity.symbol = event.params.symbol;
  entity.maxSupply = event.params.maxSupply;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();

  // Update marketplace stats - collection count
  let stats = MarketplaceStats.load("marketplace-stats");
  if (stats == null) {
    stats = new MarketplaceStats("marketplace-stats");
    stats.totalVolume = BigInt.zero();
    stats.totalSales = BigInt.zero();
    stats.totalListings = BigInt.zero();
    stats.totalCollections = BigInt.zero();
  }
  stats.totalCollections = stats.totalCollections.plus(BigInt.fromI32(1));
  stats.save();

  // Spawn dynamic data source for the new NFT collection
  NFTCollection.create(event.params.collection);
}

export function handleDeploymentFeeUpdated(
  event: DeploymentFeeUpdatedEvent
): void {
  let entity = new DeploymentFeeUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldFee = event.params.oldFee;
  entity.newFee = event.params.newFee;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleFeeRecipientUpdated(
  event: FeeRecipientUpdatedEvent
): void {
  let entity = new NFTCollectionFactoryFeeRecipientUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldRecipient = event.params.oldRecipient;
  entity.newRecipient = event.params.newRecipient;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMaxCollectionsPerCreatorUpdated(
  event: MaxCollectionsPerCreatorUpdatedEvent
): void {
  let entity = new MaxCollectionsPerCreatorUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.oldMax = event.params.oldMax;
  entity.newMax = event.params.newMax;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new NFTCollectionFactoryOwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.previousOwner = event.params.previousOwner;
  entity.newOwner = event.params.newOwner;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handlePaused(event: PausedEvent): void {
  let entity = new NFTCollectionFactoryPaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.account = event.params.account;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new NFTCollectionFactoryUnpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.account = event.params.account;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}