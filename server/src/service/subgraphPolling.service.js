import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';
import { itemExists, partialUpdateObject, saveObjects } from './algolia.service.js';

dotenv.config();

const NFT_INDEX_NAME = process.env.ALGOLIA_NFT_INDEX_NAME || 'nfts_index';
const COLLECTION_INDEX_NAME = process.env.ALGOLIA_COLLECTION_INDEX_NAME || 'collections_index';

/**
 * @class SubgraphPollingService
 * @description Service to poll subgraph for new events and update Algolia
 */
class SubgraphPollingService {
  constructor() {
    this.subgraphClient = null;
    this.SUBGRAPH_URL = process.env.SUBGRAPH_URL || 'http://localhost:8000/subgraphs/name/nftmarketplace';
    this.isPolling = false;
    this.pollInterval = parseInt(process.env.SUBGRAPH_POLL_INTERVAL) || 5000; // 5 seconds
    this.lastProcessedBlock = 0;
    this.processedEvents = new Set(); // Track processed events to avoid duplicates
    this.contractEventListener = null; // Will be injected
  }

  /**
   * @dev Initialize subgraph client
   */
  async init() {
    try {
      // Initialize subgraph client
      this.subgraphClient = new GraphQLClient(this.SUBGRAPH_URL);

      // Test subgraph connection
      await this.testSubgraphConnection();

      // Initialize last processed block
      await this.initializeLastProcessedBlock();

      console.log('✅ SubgraphPollingService initialized successfully');
    } catch (error) {
      console.warn('⚠️ Failed to initialize SubgraphPollingService (subgraph may not be available):', error.message);
    }
  }

  /**
   * @dev Test subgraph connection
   */
  async testSubgraphConnection() {
    try {
      const query = `
        query TestConnection {
          _meta {
            block {
              number
            }
            deployment
            hasIndexingErrors
          }
        }
      `;

      const result = await this.subgraphClient.request(query);

      if (result._meta && !result._meta.hasIndexingErrors) {
        console.log(`Subgraph connected successfully at block ${result._meta.block.number}`);
        return true;
      } else {
        throw new Error('Subgraph has indexing errors');
      }
    } catch (error) {
      console.error('Failed to connect to subgraph:', error);
      throw error;
    }
  }

  /**
   * @dev Initialize last processed block from subgraph
   */
  async initializeLastProcessedBlock() {
    try {
      const query = `
        query GetLatestBlock {
          _meta {
            block {
              number
            }
          }
        }
      `;

      const result = await this.subgraphClient.request(query);
      // Start from 10 blocks back for safety
      this.lastProcessedBlock = result._meta.block.number - 10;
      console.log(`📍 Starting polling from block: ${this.lastProcessedBlock}`);
    } catch (error) {
      console.error('Failed to initialize last processed block:', error);
      this.lastProcessedBlock = 0;
    }
  }

  /**
   * @dev Inject ContractEventListener instance for metadata fetching
   */
  setContractEventListener(contractEventListener) {
    this.contractEventListener = contractEventListener;
  }

  /**
   * @dev Start polling subgraph for new events
   */
  startPolling() {
    if (this.isPolling) {
      console.log('Polling already started');
      return;
    }

    if (!this.subgraphClient) {
      console.warn('Cannot start polling: Subgraph client not initialized');
      return;
    }

    this.isPolling = true;
    console.log('Starting subgraph polling...');

    this.pollSubgraph();
  }

  /**
   * @dev Stop polling subgraph
   */
  stopPolling() {
    this.isPolling = false;
    console.log('Subgraph polling stopped');
  }

  /**
   * @dev Poll subgraph for new events
   */
  async pollSubgraph() {
    if (!this.isPolling) return;

    try {
      // Get new events from subgraph
      const newEvents = await this.getNewEventsFromSubgraph();

      // Process each event
      for (const event of newEvents) {
        await this.processSubgraphEvent(event);
      }

      // Update last processed block
      if (newEvents.length > 0) {
        const latestBlock = Math.max(...newEvents.map(e => parseInt(e.blockNumber)));
        this.lastProcessedBlock = latestBlock;
        console.log(`Updated last processed block to: ${this.lastProcessedBlock}`);
      }

    } catch (error) {
      console.error('Error polling subgraph:', error);
    }

    // Schedule next poll
    setTimeout(() => this.pollSubgraph(), this.pollInterval);
  }

  /**
   * @dev Get new events from subgraph since last processed block
   */
  async getNewEventsFromSubgraph() {
    const query = `
      query GetNewEvents($lastBlock: BigInt!) {
        tokenMinteds(
          where: { blockNumber_gt: $lastBlock }
          orderBy: blockNumber
          orderDirection: asc
          first: 100
        ) {
          id
          tokenId
          to
          tokenURI
          collection
          blockNumber
          blockTimestamp
          transactionHash
        }
        
        collectionInfoUpdateds(
          where: { blockNumber_gt: $lastBlock }
          orderBy: blockNumber
          orderDirection: asc
          first: 100
        ) {
          id
          description
          externalUrl
          collection
          blockNumber
          blockTimestamp
          transactionHash
        }
        
        transfers(
          where: { 
            blockNumber_gt: $lastBlock
            from_not: "0x0000000000000000000000000000000000000000"
          }
          orderBy: blockNumber
          orderDirection: asc
          first: 100
        ) {
          id
          from
          to
          tokenId
          collection
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    `;

    try {
      const result = await this.subgraphClient.request(query, {
        lastBlock: this.lastProcessedBlock.toString()
      });

      // Combine all events and sort by block number
      const allEvents = [
        ...result.tokenMinteds.map(e => ({ ...e, eventType: 'TokenMinted' })),
        ...result.collectionInfoUpdateds.map(e => ({ ...e, eventType: 'CollectionInfoUpdated' })),
        ...result.transfers.map(e => ({ ...e, eventType: 'Transfer' }))
      ].sort((a, b) => parseInt(a.blockNumber) - parseInt(b.blockNumber));

      if (allEvents.length > 0) {
        console.log(`Found ${allEvents.length} new events from subgraph`);
      }

      return allEvents;
    } catch (error) {
      console.error('Error querying subgraph:', error);
      return [];
    }
  }

  /**
   * @dev Process individual event from subgraph
   */
  async processSubgraphEvent(event) {
    try {
      // Create unique event ID to prevent duplicates
      const eventId = `${event.transactionHash}-${event.id}`;

      if (this.processedEvents.has(eventId)) {
        console.log(`Event already processed, skipping: ${eventId}`);
        return;
      }

      console.log(`Processing ${event.eventType} event from subgraph:`, event.id);

      switch (event.eventType) {
        case 'TokenMinted':
          await this.processTokenMintedFromSubgraph(event);
          break;
        case 'CollectionInfoUpdated':
          await this.processCollectionInfoUpdatedFromSubgraph(event);
          break;
        case 'Transfer':
          await this.processTransferFromSubgraph(event);
          break;
        default:
          console.warn(`⚠️ Unknown event type: ${event.eventType}`);
      }

      // Mark as processed
      this.processedEvents.add(eventId);

    } catch (error) {
      console.error(`Error processing ${event.eventType} event:`, error);
    }
  }

  /**
   * @dev Process TokenMinted event from subgraph
   */
  async processTokenMintedFromSubgraph(event) {
    try {
      // Get additional NFT metadata using ContractEventListener
      let nftMetadata = null;
      if (this.contractEventListener) {
        nftMetadata = await this.contractEventListener.getNFTMetadata(event.collection, event.tokenId);
      }

      const objectID = `${event.collection.toLowerCase()}_${event.tokenId}`;
      const isDataExist = await itemExists({
        indexName: NFT_INDEX_NAME,
        objectID: objectID
      });

      const metadataUpdate = {
        objectID: objectID, // Bắt buộc phải có để Algolia định danh
        title: nftMetadata?.metadata?.name || '',
        description: nftMetadata?.metadata?.description || '',
        collectionName: nftMetadata?.collectionName || '',
        collectionSymbol: nftMetadata?.collectionSymbol || '',
        collectionAddress: event.collection,
        creator: event.to,
        owner: event.to,
        attributes: nftMetadata?.metadata?.attributes || [],
        image: nftMetadata?.metadata?.image || '',
        minted_at: new Date(parseInt(event.blockTimestamp) * 1000).toISOString()
      };


      if (isDataExist) {
        await partialUpdateObject({
          indexName: NFT_INDEX_NAME,
          objectID: objectID,
          partialObject: metadataUpdate,
        });
        console.log(`🛡️ Race condition handled: Only metadata updated for ${objectID}`);
      } else {
        const fullNewItem = {
          ...metadataUpdate,
          price: 0,
          is_for_sale: false
        };
        await saveObjects({
          indexName: NFT_INDEX_NAME,
          objects: [fullNewItem]
        });
        console.log(`🆕 New NFT created with default market state: ${objectID}`);
      }

      // Update totalItems of collection search index
      if (this.contractEventListener) {
        const collectionStats = await this.contractEventListener.getCollectionStats(event.collection);
        if (collectionStats) {
          await partialUpdateObject({
            indexName: COLLECTION_INDEX_NAME,
            objectID: event.collection.toLowerCase(),
            partialObject: {
              totalItems: Number(collectionStats.totalSupply)
            }
          });
        }
      }

      console.log('TokenMinted from subgraph processed successfully');

    } catch (error) {
      console.error('Error processing TokenMinted from subgraph:', error);
    }
  }

  /**
   * @dev Process CollectionInfoUpdated event from subgraph
   */
  async processCollectionInfoUpdatedFromSubgraph(event) {
    try {
      // Update collection info in search index
      await partialUpdateObject({
        indexName: COLLECTION_INDEX_NAME,
        objectID: event.collection.toLowerCase(),
        partialObject: {
          description: event.description || '',
        }
      });

      console.log('CollectionInfoUpdated from subgraph processed successfully');

    } catch (error) {
      console.error('Error processing CollectionInfoUpdated from subgraph:', error);
    }
  }

  /**
   * @dev Process Transfer event from subgraph
   */
  async processTransferFromSubgraph(event) {
    try {
      // Update owner in NFT search index
      await partialUpdateObject({
        indexName: NFT_INDEX_NAME,
        objectID: `${event.collection.toLowerCase()}_${event.tokenId}`,
        partialObject: {
          owner: event.to,
          is_for_sale: false // Reset sale status on transfer
        }
      });

      console.log('Transfer from subgraph processed successfully');

    } catch (error) {
      console.error('Error processing Transfer from subgraph:', error);
    }
  }

  /**
   * @dev Get polling status
   */
  getStatus() {
    return {
      isPolling: this.isPolling,
      lastProcessedBlock: this.lastProcessedBlock,
      processedEventsCount: this.processedEvents.size,
      subgraphUrl: this.SUBGRAPH_URL,
      pollInterval: this.pollInterval,
      subgraphConnected: !!this.subgraphClient
    };
  }
}

export default new SubgraphPollingService();