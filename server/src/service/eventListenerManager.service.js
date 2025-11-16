import ContractEventListener from './contractEventListener.service.js';
import subgraphPollingService from './subgraphPolling.service.js';

/**
 * @class EventListenerManager
 * @description Manages both blockchain listeners and subgraph polling
 */
class EventListenerManager {
  constructor() {
    this.contractEventListener = new ContractEventListener();
    this.subgraphPollingService = subgraphPollingService;
    this.isInitialized = false;
  }

  /**
   * @dev Initialize all event listening systems
   */
  async init() {
    try {
      console.log('🚀 Initializing Event Listener Manager...');

      // Initialize ContractEventListener (for blockchain events and metadata fetching)
      await this.contractEventListener.init();

      // Try to initialize SubgraphPollingService (may fail if subgraph not available)
      try {
        await this.subgraphPollingService.init();
        
        // Inject ContractEventListener into SubgraphPollingService for metadata access
        this.subgraphPollingService.setContractEventListener(this.contractEventListener);
      } catch (error) {
        console.warn('⚠️ Subgraph initialization failed, continuing without subgraph polling');
      }

      this.isInitialized = true;
      console.log('✅ Event Listener Manager initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Event Listener Manager:', error);
      throw error;
    }
  }

  /**
   * @dev Start all listeners and polling
   */
  async startAll() {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      console.log('🚀 Starting all event systems...');

      // Start blockchain listeners for immediate response (Factory, Marketplace)
      await this.contractEventListener.startAllListeners();

      // Start subgraph polling for collection events (TokenMinted, Transfer, CollectionInfoUpdated)
      this.subgraphPollingService.startPolling();

      const subgraphStatus = this.subgraphPollingService.subgraphClient ? 'enabled' : 'disabled';
      console.log(`🔄 Subgraph polling: ${subgraphStatus} (TokenMinted, Transfer, CollectionInfoUpdated)`);

    } catch (error) {
      console.error('❌ Failed to start event systems:', error);
      throw error;
    }
  }

  /**
   * @dev Stop all listeners and polling
   */
  async stopAll() {
    try {
      console.log('🛑 Stopping all event systems...');

      // Stop subgraph polling
      this.subgraphPollingService.stopPolling();

      // Stop blockchain listeners
      await this.contractEventListener.stopAllListeners();

      console.log('✅ All event systems stopped');

    } catch (error) {
      console.error('❌ Error stopping event systems:', error);
    }
  }

  /**
   * @dev Get comprehensive status of all systems
   */
  getStatus() {
    const blockchainStatus = this.contractEventListener.getStatus();
    const subgraphStatus = this.subgraphPollingService.getStatus();

    return {
      isInitialized: this.isInitialized,
      blockchain: {
        ...blockchainStatus,
        description: 'Handles Factory & Marketplace events + metadata fetching'
      },
      subgraph: {
        ...subgraphStatus,
        description: 'Polls for TokenMinted, Transfer, CollectionInfoUpdated'
      },
      summary: {
        totalActiveListeners: blockchainStatus.activeListeners.length,
        isSubgraphPolling: subgraphStatus.isPolling,
        lastPolledBlock: subgraphStatus.lastProcessedBlock,
        processedEvents: subgraphStatus.processedEventsCount
      }
    };
  }

  /**
   * @dev Get ContractEventListener instance (for manual operations)
   */
  getContractEventListener() {
    return this.contractEventListener;
  }

  /**
   * @dev Get SubgraphPollingService instance (for manual operations)
   */
  getSubgraphPollingService() {
    return this.subgraphPollingService;
  }
}

export default new EventListenerManager();