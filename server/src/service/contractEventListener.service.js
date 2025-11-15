import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import { partialUpdateObject, saveObjects, itemExists } from './algolia.service.js'
import notificationService from './notification.service.js'
const NFT_INDEX_NAME = process.env.ALGOLIA_NFT_INDEX_NAME || 'nfts_index';
const COLLECTION_INDEX_NAME = process.env.ALGOLIA_COLLECTION_INDEX_NAME || 'collections_index';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load contract ABIs
const marketplaceABI = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../artifacts/contracts/Marketplace.sol/Marketplace.json'),
    'utf-8'
  )
).abi;

const nftCollectionABI = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../artifacts/contracts/NFTCollection.sol/NFTCollection.json'),
    'utf-8'
  )
).abi;

const nftCollectionFactoryABI = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../artifacts/contracts/NFTCollectionFactory.sol/NFTCollectionFactory.json'),
    'utf-8'
  )
).abi;

/**
 * @class ContractEventListener
 * @description Service to listen to blockchain events and process them
 */
class ContractEventListener {
  constructor() {
    this.provider = null;
    this.marketplaceContract = null;
    this.nftCollectionFactoryContract = null;
    this.isListening = false;
    this.listeners = new Map();
    this.nftCollectionContracts = new Map();

    // Contract addresses from environment
    this.MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;
    this.NFT_COLLECTION_FACTORY_ADDRESS = process.env.NFT_COLLECTION_FACTORY_ADDRESS;
    this.RPC_URL = process.env.RPC_URL;
  }

  /**
   * @dev Initialize provider and contracts
   */
  async init() {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(this.RPC_URL);

      // Test connection
      const network = await this.provider.getNetwork();
      console.log(`🔗 Connected to network: ${network.name} (chainId: ${network.chainId})`);

      // Initialize marketplace contract
      if (this.MARKETPLACE_ADDRESS) {
        this.marketplaceContract = new ethers.Contract(
          this.MARKETPLACE_ADDRESS,
          marketplaceABI,
          this.provider
        );
        console.log(`📋 Marketplace contract initialized at: ${this.MARKETPLACE_ADDRESS}`);
      } else {
        console.warn('⚠️  MARKETPLACE_ADDRESS not found in environment variables');
      }

      // Initialize NFT Collection Factory contract
      if (this.NFT_COLLECTION_FACTORY_ADDRESS) {
        this.nftCollectionFactoryContract = new ethers.Contract(
          this.NFT_COLLECTION_FACTORY_ADDRESS,
          nftCollectionFactoryABI,
          this.provider
        );
        console.log(`🏭 NFT Collection Factory initialized at: ${this.NFT_COLLECTION_FACTORY_ADDRESS}`);
      } else {
        console.warn('⚠️  NFT_COLLECTION_FACTORY_ADDRESS not found in environment variables');
      }

    } catch (error) {
      console.error('❌ Failed to initialize ContractEventListener:', error);
      throw error;
    }
  }

  /**
   * @dev Get or create NFT Collection contract instance
   * @param {string} collectionAddress - NFT Collection contract address
   * @returns {ethers.Contract} NFT Collection contract instance
   */
  getNFTCollectionContract(collectionAddress) {
    if (!collectionAddress) {
      throw new Error('Collection address is required');
    }

    const normalizedAddress = collectionAddress.toLowerCase();

    if (!this.nftCollectionContracts.has(normalizedAddress)) {
      const contract = new ethers.Contract(
        collectionAddress,
        nftCollectionABI,
        this.provider
      );
      this.nftCollectionContracts.set(normalizedAddress, contract);
    }

    return this.nftCollectionContracts.get(normalizedAddress);
  }

  /**
   * @dev Start listening to CollectionCreated events from Factory
   */
  async startCollectionCreatedListener() {
    if (!this.nftCollectionFactoryContract) {
      throw new Error('NFT Collection Factory contract not initialized');
    }

    try {
      const listener = async (collection, creator, avatarCollection, description, name, symbol, maxSupply, event) => {
        try {
          const eventData = {
            collection,
            creator,
            name,
            symbol,
            avatarCollection,
            description,
            maxSupply: maxSupply.toString(),
            blockNumber: event.log.blockNumber,
            transactionHash: event.log.transactionHash,
            timestamp: new Date().toISOString()
          };

          console.log('CollectionCreated Data:', eventData);

          await this.processCollectionCreatedEvent(eventData);

        } catch (error) {
          console.error('Error processing CollectionCreated event:', error);
        }
      };

      this.nftCollectionFactoryContract.on('CollectionCreated', listener);
      this.listeners.set('CollectionCreated', listener);

      this.isListening = true;

    } catch (error) {
      console.error('Failed to start CollectionCreated listener:', error);
      throw error;
    }
  }

  async processCollectionCreatedEvent(eventData) {
    try {
      const dataToIndexSearch = {
        objectID: eventData.collection.toLowerCase(),
        name: eventData.name,
        symbol: eventData.symbol,
        totalItems: 0,
        creator: eventData.creator,
        image: eventData.avatarCollection || '',
        description: eventData?.description || '',
        created_at: eventData.timestamp || '',
      }
      // TODO: Update search index (Algolia)
      await saveObjects({
        indexName: COLLECTION_INDEX_NAME,
        objects: [dataToIndexSearch]
      });

      // TODO: Send notifications
      // await this.sendListingNotification(eventData, nftMetadata);

      console.log('CollectionCreated listener processed successfully');
    } catch (error) {
      console.error('Error processing CollectionCreated event:', error);
    }
  }

  /**
   * @dev Extract all category fields from metadata and return as array
   * @param {Object} metadata - Metadata object containing category fields
   * @returns {string[]} Array of categories
   */
  extractCategoriesFromCollectionMetadata(metadata) {
    if (!metadata) return [];

    const categories = [];

    // Check for category fields (category_1, category_2, category_3, etc.)
    Object.keys(metadata).forEach(key => {
      if (key.startsWith('category_') && metadata[key]) {
        categories.push(metadata[key]);
      }
    });

    // Also check for a general 'category' field if it exists
    if (metadata.category && !categories.includes(metadata.category)) {
      categories.push(metadata.category);
    }

    // Remove duplicates and empty values
    return [...new Set(categories)].filter(cat => cat && cat.trim() !== '');
  }

  /**rel
   * @dev Start listening to ItemListed events 
   * @des ItemListed event include listing new NFT (listItem) and Update Listing Price of NFT (updateListingPrice)
   */
  async startItemListedListener() {
    if (!this.marketplaceContract) {
      throw new Error('Marketplace contract not initialized');
    }

    try {
      // Listen to new events
      const listener = async (listingId, seller, nftContract, tokenId, price, paymentToken, event) => {
        try {
          const eventData = {
            listingId,
            seller,
            nftContract,
            tokenId: tokenId.toString(),
            price: ethers.formatEther(price),
            paymentToken,
            blockNumber: event.log.blockNumber,
            transactionHash: event.log.transactionHash,
            blockTimestamp: event.log.blockTimestamp,
          };

          console.log('Event Data:', eventData);

          // Process the event
          await this.processItemListedEvent(eventData);

        } catch (error) {
          console.error('Error processing ItemListed event:', error);
        }
      };

      // Add listener
      this.marketplaceContract.on('ItemListed', listener);
      this.listeners.set('ItemListed', listener);

      this.isListening = true;

    } catch (error) {
      console.error('Failed to start ItemListed listener:', error);
      throw error;
    }
  }

  /**
   * @dev Process ItemListed event data
   * @param {Object} eventData - Event data from ItemListed
   */
  async processItemListedEvent(eventData) {
    try {
      // Get additional NFT metadata
      const nftMetadata = await this.getNFTMetadata(eventData.nftContract, eventData.tokenId);
      const objectID = `${eventData.nftContract.toLowerCase()}_${eventData.tokenId}`;

      const dataToIndexSearch = {
        title: nftMetadata?.metadata?.name || '',
        description: nftMetadata?.metadata?.description || '',
        collectionName: nftMetadata?.collectionName || '',
        collectionSymbol: nftMetadata?.collectionSymbol || '',
        collectionAddress: eventData.nftContract,
        creator: nftMetadata?.royaltyInfo[0] || '',
        owner: eventData.seller,
        price: parseFloat(eventData.price) || 0,
        attributes: nftMetadata?.metadata?.attributes || [],
        image: nftMetadata?.metadata?.image || '',
        is_for_sale: true,
      }

      const isDataExist = await itemExists({
        indexName: NFT_INDEX_NAME,
        objectID: objectID
      });
      if (!isDataExist) {
        dataToIndexSearch.objectID = objectID;
        dataToIndexSearch.minted_at = nftMetadata?.metadata?.minted_at || ''
        // Insert new data to search index (Algolia)
        await saveObjects({
          indexName: NFT_INDEX_NAME,
          objects: [dataToIndexSearch]
        });
      } else {
        // Update existing data in search index (Algolia)
        await partialUpdateObject({
          indexName: NFT_INDEX_NAME,
          objectID: objectID,
          partialObject: dataToIndexSearch
        });
      }

      // TODO: Send notifications
      // await this.sendListingNotification(eventData, nftMetadata);

      console.log('ItemListed listener processed successfully');

    } catch (error) {
      console.error('Error processing ItemListed event:', error);
    }
  }

  /**
   * @dev Start listening to ListingCancelled events
   */
  async startListingCancelledListener() {
    if (!this.marketplaceContract) {
      throw new Error('Marketplace contract not initialized');
    }

    try {
      const listener = async (listingId, seller, nftContract, tokenId, event) => {
        try {
          const eventData = {
            listingId,
            seller,
            nftContract,
            tokenId: tokenId.toString(),
            blockNumber: event.log.blockNumber,
            transactionHash: event.log.transactionHash,
            timestamp: new Date().toISOString()
          };

          console.log('ListingCancelled Event Data:', eventData);

          await this.processListingCancelledEvent(eventData);

        } catch (error) {
          console.error('Error processing ListingCancelled event:', error);
        }
      };

      this.marketplaceContract.on('ListingCancelled', listener);
      this.listeners.set('ListingCancelled', listener);

    } catch (error) {
      console.error('Failed to start ListingCancelled listener:', error);
      throw error;
    }
  }

  /**
   * @dev Process ListingCancelled event data
   * @param {Object} eventData - Event data from ListingCancelled
   */
  async processListingCancelledEvent(eventData) {
    try {
      const objectID = `${eventData.nftContract.toLowerCase()}_${eventData.tokenId}`;

      // Update data to mark NFT as not for sale
      const updateData = {
        is_for_sale: false,
      };

      // Check if item exists in search index
      const isDataExist = await itemExists({
        indexName: NFT_INDEX_NAME,
        objectID: objectID
      });

      if (isDataExist) {
        // Update existing data in search index (Algolia)
        await partialUpdateObject({
          indexName: NFT_INDEX_NAME,
          objectID: objectID,
          partialObject: updateData
        });
      } else {
        const nftMetadata = await this.getNFTMetadata(eventData.nftContract, eventData.tokenId);

        if (nftMetadata) {
          const fullDataToIndex = {
            objectID: objectID,
            title: nftMetadata?.metadata?.name || '',
            description: nftMetadata?.metadata?.description || '',
            collectionName: nftMetadata?.collectionName || '',
            collectionSymbol: nftMetadata?.collectionSymbol || '',
            collectionAddress: eventData.nftContract,
            creator: nftMetadata?.royaltyInfo?.[0] || '',
            owner: eventData.seller,
            price: 0,
            attributes: nftMetadata?.metadata?.attributes || [],
            image: nftMetadata?.metadata?.image || '',
            is_for_sale: false,
            minted_at: nftMetadata?.metadata?.minted_at || '',
          };

          await saveObjects({
            indexName: NFT_INDEX_NAME,
            objects: [fullDataToIndex]
          });
        }
      }

      // TODO: Send cancellation notification
      // await this.sendCancellationNotification(eventData);

      console.log('ListingCancelled event processed successfully');

    } catch (error) {
      console.error('Error processing ListingCancelled event:', error);
    }
  }

  /**
   * @dev Get NFT metadata from contract
   * @param {string} nftContract - NFT contract address
   * @param {string} tokenId - Token ID
   */
  async getNFTMetadata(nftContract, tokenId) {
    try {
      const nftContractInstance = this.getNFTCollectionContract(nftContract);

      // Get basic NFT data
      const [tokenURI, owner] = await Promise.all([
        nftContractInstance.tokenURI(tokenId),
        nftContractInstance.ownerOf(tokenId)
      ]);
      const collectionName = await nftContractInstance.name();
      const collectionSymbol = await nftContractInstance.symbol();
      console.log('Basic NFT Data:', { tokenURI, owner, collectionName, collectionSymbol });

      // Get royalty info
      let royaltyInfo = null;
      try {
        royaltyInfo = await nftContractInstance.getTokenRoyalty(tokenId);
      } catch (error) {
        console.log('Could not get royalty info:', error.message);
      }

      // Fetch metadata from IPFS/HTTP
      let metadata = null;
      if (tokenURI) {
        metadata = await this.fetchMetadataFromURI(tokenURI);
      }

      return {
        tokenURI,
        owner,
        royaltyInfo,
        collectionName,
        collectionSymbol,
        metadata
      };

    } catch (error) {
      console.error('Error getting NFT metadata:', error);
      return null;
    }
  }

  /**
   * @dev Get collection stats from contract
   * @param {string} nftContract - NFT contract address
   */
  async getCollectionStats(nftContract) {
    try {
      const nftContractInstance = this.getNFTCollectionContract(nftContract);

      const [
        totalSupply,
        totalMinted,
        maxSupply,
        creator,
        avatarCollection,
        description,
        externalUrl,
      ] = await nftContractInstance.getCollectionStats();

      return {
        totalSupply,
        totalMinted,
        maxSupply,
        creator,
        avatarCollection,
        description,
        externalUrl,
      };

    } catch (error) {
      console.error('Error getting collection stats:', error);
      return null;
    }
  }

  /**
   * @dev Fetch metadata from tokenURI
   * @param {string} tokenURI - Token URI (IPFS or HTTP)
   */
  async fetchMetadataFromURI(tokenURI) {
    try {
      // Convert IPFS URI to HTTP gateway
      let url = tokenURI;
      if (tokenURI.startsWith('ipfs://')) {
        url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      const response = await fetch(url, {
        timeout: 10000 // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error fetching metadata from URI:', error);
      return null;
    }
  }

  /**
   * @dev Start all event listeners
   */
  async startAllListeners() {
    try {
      console.log('🚀 Starting all event listeners...');

      if (!this.isInitialized) {
        await this.init();
      }

      await Promise.all([
        this.startItemListedListener(),
        this.startCollectionCreatedListener(),
        this.startListingCancelledListener()
      ]);

      console.log('✅ All event listeners started successfully');

    } catch (error) {
      console.error('❌ Failed to start event listeners:', error);
      throw error;
    }
  }

  /**
  * @dev Stop all event listeners
  */
  async stopAllListeners() {
    try {
      console.log('🛑 Stopping all event listeners...');

      // Stop marketplace listeners
      if (this.marketplaceContract) {
        for (const [eventName, listener] of this.listeners) {
          if (eventName === 'ItemListed') {
            this.marketplaceContract.off(eventName, listener);
          }
        }
      }

      // Stop factory listeners
      if (this.nftCollectionFactoryContract) {
        for (const [eventName, listener] of this.listeners) {
          if (eventName === 'CollectionCreated') {
            this.nftCollectionFactoryContract.off(eventName, listener);
          }
        }
      }

      // Stop NFT collection listeners
      for (const [key, listener] of this.listeners) {
        if (key.startsWith('TokenMinted_') || key.startsWith('Transfer_')) {
          const collectionAddress = key.split('_')[1];
          const eventName = key.split('_')[0];
          const nftContract = this.nftCollectionContracts.get(collectionAddress.toLowerCase());

          if (nftContract) {
            nftContract.off(eventName, listener);
          }
        }
      }

      this.listeners.clear();
      this.nftCollectionContracts.clear();
      this.isListening = false;

      console.log('✅ All event listeners stopped');

    } catch (error) {
      console.error('❌ Error stopping event listeners:', error);
    }
  }


  /**
   * @dev Get listening status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      activeListeners: Array.from(this.listeners.keys()),
      marketplaceAddress: this.MARKETPLACE_ADDRESS,
      factoryAddress: this.NFT_COLLECTION_FACTORY_ADDRESS,
      providerConnected: !!this.provider
    };
  }

  /**
   * @dev Send listing notification to user
   * @param {Object} eventData - Event data from blockchain
   * @param {Object} nftMetadata - NFT metadata
   */
  async sendListingNotification(eventData, nftMetadata) {
    try {
      // Create NFT listing notification
      await notificationService.createNFTListingNotification(eventData, nftMetadata);
      console.log('Listing notification sent successfully');
    } catch (error) {
      console.error('Error sending listing notification:', error);
    }
  }

  /**
   * @dev Query historical events
   * @param {string} eventName - Event name to query
   * @param {number} fromBlock - Starting block number
   * @param {number} toBlock - Ending block number
   */
  async queryHistoricalEvents(eventName, fromBlock = 0, toBlock = 'latest') {
    try {
      console.log(`Querying historical ${eventName} events from block ${fromBlock} to ${toBlock}`);

      const filter = this.marketplaceContract.filters[eventName]();
      const events = await this.marketplaceContract.queryFilter(filter, fromBlock, toBlock);

      console.log(`Found ${events.length} historical ${eventName} events`);

      return events;

    } catch (error) {
      console.error(`Error querying historical ${eventName} events:`, error);
      return [];
    }
  }
}

export default ContractEventListener;