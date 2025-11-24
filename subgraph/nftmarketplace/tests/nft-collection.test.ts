import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { TokenMinted, Transfer, Token } from "../generated/schema"
import { handleTokenMinted, handleTransfer } from "../src/nft-collection"
import { createTokenMintedEvent, createTransferEvent } from "./nft-collection-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("NFT Collection Token Ownership Tests", () => {
  beforeAll(() => {
    // Setup before all tests
  })

  afterAll(() => {
    clearStore()
  })

  test("TokenMinted creates Token entity with correct ownership", () => {
    // Prepare event parameters
    let collection = Address.fromString("0x0000000000000000000000000000000000000001")
    let tokenId = BigInt.fromI32(1)
    let to = Address.fromString("0x0000000000000000000000000000000000000002")
    let tokenURI = "https://example.com/token/1"

    // Create and handle TokenMinted event
    let tokenMintedEvent = createTokenMintedEvent(tokenId, to, tokenURI, collection)
    handleTokenMinted(tokenMintedEvent)

    // Verify Token entity was created with correct ownership
    let tokenKey = collection.toHexString() + "-" + tokenId.toString()
    assert.fieldEquals("Token", tokenKey, "currentOwner", to.toHexString())
    assert.fieldEquals("Token", tokenKey, "collection", collection.toHexString())
    assert.fieldEquals("Token", tokenKey, "tokenId", tokenId.toString())
    assert.fieldEquals("Token", tokenKey, "isBurned", "false")
    assert.fieldEquals("Token", tokenKey, "transferCount", "1")
    assert.fieldEquals("Token", tokenKey, "tokenURI", tokenURI)

    clearStore()
  })

  test("Transfer updates Token ownership correctly", () => {
    let collection = Address.fromString("0x0000000000000000000000000000000000000001")
    let tokenId = BigInt.fromI32(1)
    let owner1 = Address.fromString("0x0000000000000000000000000000000000000002")
    let owner2 = Address.fromString("0x0000000000000000000000000000000000000003")
    let zeroAddress = Address.fromString("0x0000000000000000000000000000000000000000")

    // First mint the token
    let tokenMintedEvent = createTokenMintedEvent(tokenId, owner1, "https://example.com/token/1", collection)
    handleTokenMinted(tokenMintedEvent)

    // Verify initial ownership
    let tokenKey = collection.toHexString() + "-" + tokenId.toString()
    assert.fieldEquals("Token", tokenKey, "currentOwner", owner1.toHexString())
    assert.fieldEquals("Token", tokenKey, "transferCount", "1")

    // Transfer from owner1 to owner2
    let transferEvent = createTransferEvent(owner1, owner2, tokenId, collection)
    transferEvent.block.number = BigInt.fromI32(200) // Later block
    transferEvent.logIndex = BigInt.fromI32(1)
    handleTransfer(transferEvent)

    // Verify ownership changed
    assert.fieldEquals("Token", tokenKey, "currentOwner", owner2.toHexString())
    assert.fieldEquals("Token", tokenKey, "transferCount", "2")
    assert.fieldEquals("Token", tokenKey, "lastTransferBlock", "200")

    clearStore()
  })

  test("Burn sets token as burned with null owner", () => {
    let collection = Address.fromString("0x0000000000000000000000000000000000000001")
    let tokenId = BigInt.fromI32(1)
    let owner = Address.fromString("0x0000000000000000000000000000000000000002")
    let zeroAddress = Address.fromString("0x0000000000000000000000000000000000000000")

    // First mint the token
    let tokenMintedEvent = createTokenMintedEvent(tokenId, owner, "https://example.com/token/1", collection)
    handleTokenMinted(tokenMintedEvent)

    // Burn the token (transfer to zero address)
    let burnEvent = createTransferEvent(owner, zeroAddress, tokenId, collection)
    burnEvent.block.number = BigInt.fromI32(200)
    handleTransfer(burnEvent)

    // Verify token is burned
    let tokenKey = collection.toHexString() + "-" + tokenId.toString()
    assert.fieldEquals("Token", tokenKey, "currentOwner", "null")
    assert.fieldEquals("Token", tokenKey, "isBurned", "true")

    clearStore()
  })

  test("Idempotency: older events don't override newer state", () => {
    let collection = Address.fromString("0x0000000000000000000000000000000000000001")
    let tokenId = BigInt.fromI32(1)
    let owner1 = Address.fromString("0x0000000000000000000000000000000000000002")
    let owner2 = Address.fromString("0x0000000000000000000000000000000000000003")

    // Process newer transfer first (block 200)
    let newerTransfer = createTransferEvent(owner1, owner2, tokenId, collection)
    newerTransfer.block.number = BigInt.fromI32(200)
    newerTransfer.logIndex = BigInt.fromI32(1)
    handleTransfer(newerTransfer)

    let tokenKey = collection.toHexString() + "-" + tokenId.toString()
    assert.fieldEquals("Token", tokenKey, "currentOwner", owner2.toHexString())
    assert.fieldEquals("Token", tokenKey, "lastTransferBlock", "200")

    // Process older transfer (block 100) - should not update
    let olderTransfer = createTransferEvent(owner1, owner2, tokenId, collection)
    olderTransfer.block.number = BigInt.fromI32(100) // Earlier block
    olderTransfer.logIndex = BigInt.fromI32(0)
    handleTransfer(olderTransfer)

    // Verify state wasn't changed by older event
    assert.fieldEquals("Token", tokenKey, "currentOwner", owner2.toHexString())
    assert.fieldEquals("Token", tokenKey, "lastTransferBlock", "200")

    clearStore()
  })

  test("Log index ordering within same block", () => {
    let collection = Address.fromString("0x0000000000000000000000000000000000000001")
    let tokenId = BigInt.fromI32(1)
    let owner1 = Address.fromString("0x0000000000000000000000000000000000000002")
    let owner2 = Address.fromString("0x0000000000000000000000000000000000000003")
    let owner3 = Address.fromString("0x0000000000000000000000000000000000000004")

    // Same block, but process events in wrong order
    let blockNumber = BigInt.fromI32(100)

    // Process event with higher log index first
    let laterEvent = createTransferEvent(owner2, owner3, tokenId, collection)
    laterEvent.block.number = blockNumber
    laterEvent.logIndex = BigInt.fromI32(5)
    handleTransfer(laterEvent)

    let tokenKey = collection.toHexString() + "-" + tokenId.toString()
    assert.fieldEquals("Token", tokenKey, "currentOwner", owner3.toHexString())
    assert.fieldEquals("Token", tokenKey, "lastTransferLogIndex", "5")

    // Process event with lower log index - should not update
    let earlierEvent = createTransferEvent(owner1, owner2, tokenId, collection)
    earlierEvent.block.number = blockNumber
    earlierEvent.logIndex = BigInt.fromI32(2)
    handleTransfer(earlierEvent)

    // State should remain unchanged
    assert.fieldEquals("Token", tokenKey, "currentOwner", owner3.toHexString())
    assert.fieldEquals("Token", tokenKey, "lastTransferLogIndex", "5")

    clearStore()
  })
})