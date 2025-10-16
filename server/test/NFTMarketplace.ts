import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

describe("NFT Marketplace System", function () {
  // Deploy all contracts fixture
  async function deployMarketplaceFixture() {
    const [owner, creator, buyer, feeRecipient, royaltyRecipient] = await ethers.getSigners();

    // Deploy MarketplaceFeeManager
    const MarketplaceFeeManager = await ethers.getContractFactory("MarketplaceFeeManager");
    const feeManager = await MarketplaceFeeManager.deploy(
      owner.address,
      250, // 2.5% fee
      feeRecipient.address,
      ethers.parseEther("0.001") // 0.001 ETH minimum fee
    );

    // Deploy NFTCollectionFactory
    const NFTCollectionFactory = await ethers.getContractFactory("NFTCollectionFactory");
    const nftFactory = await NFTCollectionFactory.deploy(
      owner.address,
      ethers.parseEther("0.01"), // 0.01 ETH deployment fee
      feeRecipient.address
    );

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(
      owner.address,
      await feeManager.getAddress(),
      ethers.parseEther("0.001") // 0.001 ETH minimum listing price
    );

    return {
      feeManager,
      nftFactory,
      marketplace,
      owner,
      creator,
      buyer,
      feeRecipient,
      royaltyRecipient
    };
  }

  describe("MarketplaceFeeManager", function () {
    it("Should initialize with correct values", async function () {
      const { feeManager, owner, feeRecipient } = await networkHelpers.loadFixture(deployMarketplaceFixture);

      expect(await feeManager.owner()).to.equal(owner.address);
      expect(await feeManager.marketFeeBps()).to.equal(250);
      expect(await feeManager.feeRecipient()).to.equal(feeRecipient.address);
      expect(await feeManager.minimumFee()).to.equal(ethers.parseEther("0.001"));
    });

    it("Should calculate fees correctly", async function () {
      const { feeManager } = await networkHelpers.loadFixture(deployMarketplaceFixture);

      const salePrice = ethers.parseEther("1"); // 1 ETH
      const expectedFee = ethers.parseEther("0.025"); // 2.5% of 1 ETH
      
      expect(await feeManager.calculateMarketFee(salePrice)).to.equal(expectedFee);
    });

    it("Should use minimum fee when calculated fee is lower", async function () {
      const { feeManager } = await networkHelpers.loadFixture(deployMarketplaceFixture);

      const salePrice = ethers.parseEther("0.01"); // 0.01 ETH
      const minimumFee = ethers.parseEther("0.001");
      
      expect(await feeManager.calculateMarketFee(salePrice)).to.equal(minimumFee);
    });

    it("Should allow owner to update fee", async function () {
      const { feeManager, owner } = await networkHelpers.loadFixture(deployMarketplaceFixture);

      await feeManager.connect(owner).updateMarketFee(300); // 3%
      expect(await feeManager.marketFeeBps()).to.equal(300);
    });

    it("Should not allow non-owner to update fee", async function () {
      const { feeManager, creator } = await networkHelpers.loadFixture(deployMarketplaceFixture);

      await expect(
        feeManager.connect(creator).updateMarketFee(300)
      ).to.be.revertedWithCustomError(feeManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("NFTCollectionFactory", function () {
    it("Should deploy collection successfully", async function () {
      const { nftFactory, creator } = await networkHelpers.loadFixture(deployMarketplaceFixture);

      const collectionParams = {
        name: "Test Collection",
        symbol: "TEST",
        baseURI: "https://api.example.com/metadata/",
        maxSupply: 1000,
        description: "A test NFT collection"
      };

      const tx = await nftFactory.connect(creator).createCollection(
        collectionParams,
        { value: ethers.parseEther("0.01") }
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      const creatorCollections = await nftFactory.getCreatorCollections(creator.address);
      expect(creatorCollections.length).to.equal(1);
    });

    it("Should require deployment fee", async function () {
      const { nftFactory, creator } = await networkHelpers.loadFixture(deployMarketplaceFixture);

      const collectionParams = {
        name: "Test Collection",
        symbol: "TEST",
        baseURI: "https://api.example.com/metadata/",
        maxSupply: 1000,
        description: "A test NFT collection"
      };

      await expect(
        nftFactory.connect(creator).createCollection(collectionParams, { value: ethers.parseEther("0.005") })
      ).to.be.revertedWithCustomError(nftFactory, "InsufficientDeploymentFee");
    });

    it("Should track collections correctly", async function () {
      const { nftFactory, creator } = await networkHelpers.loadFixture(deployMarketplaceFixture);

      const collectionParams = {
        name: "Test Collection",
        symbol: "TEST",
        baseURI: "https://api.example.com/metadata/",
        maxSupply: 1000,
        description: "A test NFT collection"
      };

      await nftFactory.connect(creator).createCollection(
        collectionParams,
        { value: ethers.parseEther("0.01") }
      );

      expect(await nftFactory.getTotalCollections()).to.equal(1);
      expect(await nftFactory.getCreatorCollectionCount(creator.address)).to.equal(1);
    });
  });

  describe("NFTCollection", function () {
    async function deployCollectionFixture() {
      const baseFixture = await deployMarketplaceFixture();
      const { nftFactory, creator } = baseFixture;

      const collectionParams = {
        name: "Test Collection",
        symbol: "TEST",
        baseURI: "https://api.example.com/metadata/",
        maxSupply: 1000,
        description: "A test NFT collection"
      };

      await nftFactory.connect(creator).createCollection(
        collectionParams,
        { value: ethers.parseEther("0.01") }
      );

      const creatorCollections = await nftFactory.getCreatorCollections(creator.address);
      const collectionAddress = creatorCollections[0];
      
      const nftCollection = await ethers.getContractAt("NFTCollection", collectionAddress);

      return {
        ...baseFixture,
        nftCollection,
        collectionAddress
      };
    }

    it("Should mint NFT successfully", async function () {
      const { nftCollection, creator, buyer } = await networkHelpers.loadFixture(deployCollectionFixture);

      await nftCollection.connect(creator).mintNFT(
        buyer.address,
        "ipfs://QmTest123",
        250 // 2.5% royalty
      );

      expect(await nftCollection.ownerOf(1)).to.equal(buyer.address);
      expect(await nftCollection.tokenURI(1)).to.equal("https://api.example.com/metadata/ipfs://QmTest123");
      expect(await nftCollection.totalMinted()).to.equal(1);
    });

    it("Should track royalties correctly", async function () {
      const { nftCollection, creator, buyer } = await networkHelpers.loadFixture(deployCollectionFixture);

      await nftCollection.connect(creator).mintNFT(
        buyer.address,
        "ipfs://QmTest123",
        250 // 2.5% royalty
      );

      const [royaltyCreator, royaltyBps] = await nftCollection.getTokenRoyalty(1);
      expect(royaltyCreator).to.equal(creator.address);
      expect(royaltyBps).to.equal(250);
    });

    it("Should only allow owner to mint", async function () {
      const { nftCollection, buyer } = await networkHelpers.loadFixture(deployCollectionFixture);

      await expect(
        nftCollection.connect(buyer).mintNFT(
          buyer.address,
          "ipfs://QmTest123",
          250
        )
      ).to.be.revertedWithCustomError(nftCollection, "OwnableUnauthorizedAccount");
    });

    it("Should batch mint successfully", async function () {
      const { nftCollection, creator, buyer } = await networkHelpers.loadFixture(deployCollectionFixture);

      const tokenURIs = ["ipfs://QmTest1", "ipfs://QmTest2", "ipfs://QmTest3"];
      
      await nftCollection.connect(creator).batchMintNFT(
        buyer.address,
        tokenURIs,
        250
      );

      expect(await nftCollection.totalMinted()).to.equal(3);
      expect(await nftCollection.ownerOf(1)).to.equal(buyer.address);
      expect(await nftCollection.ownerOf(2)).to.equal(buyer.address);
      expect(await nftCollection.ownerOf(3)).to.equal(buyer.address);
    });
  });

  describe("Marketplace", function () {
    async function deployMarketplaceWithNFTFixture() {
      const baseFixture = await deployCollectionFixture();
      const { nftCollection, creator, buyer } = baseFixture;

      // Mint an NFT for testing
      await nftCollection.connect(creator).mintNFT(
        creator.address,
        "ipfs://QmTest123",
        250 // 2.5% royalty
      );

      return {
        ...baseFixture,
        tokenId: 1
      };
    }

    it("Should list NFT successfully", async function () {
      const { marketplace, nftCollection, creator, collectionAddress } = 
        await networkHelpers.loadFixture(deployMarketplaceWithNFTFixture);

      // Approve marketplace
      await nftCollection.connect(creator).setApprovalForAll(marketplace.getAddress(), true);

      // List NFT
      const price = ethers.parseEther("1");
      await marketplace.connect(creator).listItem(
        collectionAddress,
        1,
        price,
        ethers.ZeroAddress // ETH payment
      );

      const sellerListings = await marketplace.getSellerListings(creator.address);
      expect(sellerListings.length).to.equal(1);
    });

    it("Should buy NFT successfully", async function () {
      const { marketplace, nftCollection, creator, buyer, feeRecipient, collectionAddress } = 
        await networkHelpers.loadFixture(deployMarketplaceWithNFTFixture);

      // Approve marketplace
      await nftCollection.connect(creator).setApprovalForAll(marketplace.getAddress(), true);

      // List NFT
      const price = ethers.parseEther("1");
      await marketplace.connect(creator).listItem(
        collectionAddress,
        1,
        price,
        ethers.ZeroAddress
      );

      const sellerListings = await marketplace.getSellerListings(creator.address);
      const listingId = sellerListings[0];

      // Buy NFT
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);
      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);
      const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);

      const tx = await marketplace.connect(buyer).buyItem(listingId, { value: price });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      // Check ownership transfer
      expect(await nftCollection.ownerOf(1)).to.equal(buyer.address);

      // Check payment distribution
      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);

      const marketFee = ethers.parseEther("0.025"); // 2.5% of 1 ETH
      const royaltyFee = ethers.parseEther("0.025"); // 2.5% royalty
      const sellerAmount = price - marketFee - royaltyFee;

      expect(buyerBalanceAfter).to.be.closeTo(
        buyerBalanceBefore - price - gasUsed,
        ethers.parseEther("0.001") // Allow small variance for gas estimation
      );
      expect(creatorBalanceAfter).to.equal(creatorBalanceBefore + sellerAmount + royaltyFee);
      expect(feeRecipientBalanceAfter).to.equal(feeRecipientBalanceBefore + marketFee);
    });

    it("Should cancel listing successfully", async function () {
      const { marketplace, nftCollection, creator, collectionAddress } = 
        await networkHelpers.loadFixture(deployMarketplaceWithNFTFixture);

      // Approve and list NFT
      await nftCollection.connect(creator).setApprovalForAll(marketplace.getAddress(), true);
      const price = ethers.parseEther("1");
      await marketplace.connect(creator).listItem(collectionAddress, 1, price, ethers.ZeroAddress);

      const sellerListings = await marketplace.getSellerListings(creator.address);
      const listingId = sellerListings[0];

      // Cancel listing
      await marketplace.connect(creator).cancelListing(listingId);

      const listing = await marketplace.getListing(listingId);
      expect(listing.isActive).to.be.false;
    });

    it("Should update listing price", async function () {
      const { marketplace, nftCollection, creator, collectionAddress } = 
        await networkHelpers.loadFixture(deployMarketplaceWithNFTFixture);

      // Approve and list NFT
      await nftCollection.connect(creator).setApprovalForAll(marketplace.getAddress(), true);
      const initialPrice = ethers.parseEther("1");
      await marketplace.connect(creator).listItem(collectionAddress, 1, initialPrice, ethers.ZeroAddress);

      const sellerListings = await marketplace.getSellerListings(creator.address);
      const listingId = sellerListings[0];

      // Update price
      const newPrice = ethers.parseEther("2");
      await marketplace.connect(creator).updateListingPrice(listingId, newPrice);

      const listing = await marketplace.getListing(listingId);
      expect(listing.price).to.equal(newPrice);
    });

    it("Should enforce minimum listing price", async function () {
      const { marketplace, nftCollection, creator, collectionAddress } = 
        await networkHelpers.loadFixture(deployMarketplaceWithNFTFixture);

      await nftCollection.connect(creator).setApprovalForAll(marketplace.getAddress(), true);

      const belowMinPrice = ethers.parseEther("0.0005"); // Below 0.001 ETH minimum

      await expect(
        marketplace.connect(creator).listItem(collectionAddress, 1, belowMinPrice, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(marketplace, "PriceBelowMinimum");
    });
  });

  // Helper function for collection deployment
  async function deployCollectionFixture() {
    const baseFixture = await deployMarketplaceFixture();
    const { nftFactory, creator } = baseFixture;

    const collectionParams = {
      name: "Test Collection",
      symbol: "TEST",
      baseURI: "https://api.example.com/metadata/",
      maxSupply: 1000,
      description: "A test NFT collection"
    };

    await nftFactory.connect(creator).createCollection(
      collectionParams,
      { value: ethers.parseEther("0.01") }
    );

    const creatorCollections = await nftFactory.getCreatorCollections(creator.address);
    const collectionAddress = creatorCollections[0];
    
    const nftCollection = await ethers.getContractAt("NFTCollection", collectionAddress);

    return {
      ...baseFixture,
      nftCollection,
      collectionAddress
    };
  }
});