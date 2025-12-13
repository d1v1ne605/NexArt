# Example GraphQL Queries for Token Ownership

## Get all NFTs owned by a specific wallet (My NFTs)
```graphql
query getMyNFTs($owner: Bytes!) {
  tokens(
    where: { 
      currentOwner: $owner, 
      isBurned: false 
    },
    orderBy: mintedAt,
    orderDirection: desc
  ) {
    id
    collection
    tokenId
    currentOwner
    tokenURI
    mintedAt
    mintedBy
    transferCount
    lastTransferTimestamp
  }
}
```

## Get all NFTs in a specific collection with their current owners
```graphql
query getCollectionTokens($collection: Bytes!) {
  tokens(
    where: { 
      collection: $collection,
      isBurned: false 
    },
    orderBy: tokenId,
    orderDirection: asc
  ) {
    id
    tokenId
    currentOwner
    tokenURI
    mintedAt
    transferCount
  }
}
```

## Get NFT ownership history through Transfer events (if needed for analytics)
```graphql
query getTokenHistory($collection: Bytes!, $tokenId: BigInt!) {
  transfers(
    where: { 
      collection: $collection,
      tokenId: $tokenId 
    },
    orderBy: blockNumber,
    orderDirection: asc
  ) {
    id
    from
    to
    blockNumber
    blockTimestamp
    transactionHash
  }
}
```

## Get current state of a specific token
```graphql
query getTokenState($collection: String!, $tokenId: String!) {
  token(id: $collection + "-" + $tokenId) {
    id
    collection
    tokenId
    currentOwner
    isBurned
    tokenURI
    mintedAt
    mintedBy
    transferCount
    lastTransferBlock
    lastTransferTimestamp
  }
}
```

## Get tokens owned by wallet with pagination
```graphql
query getMyNFTsPaginated($owner: Bytes!, $first: Int!, $skip: Int!) {
  tokens(
    where: { 
      currentOwner: $owner, 
      isBurned: false 
    },
    first: $first,
    skip: $skip,
    orderBy: mintedAt,
    orderDirection: desc
  ) {
    id
    collection
    tokenId
    currentOwner
    tokenURI
    mintedAt
    transferCount
  }
}
```

## Key Benefits of the New Approach:

1. **Accurate ownership**: `tokens(where: {currentOwner: $wallet})` gives exact current ownership
2. **Fast queries**: No need to process entire Transfer history client-side  
3. **Rich metadata**: Includes mint time, transfer count, burn status
4. **Pagination support**: Efficient pagination for large collections
5. **No false positives**: Eliminated the original problem of showing sold NFTs

## Migration Notes:

- Replace old queries that filter Transfer events by `to` field
- Use `currentOwner` field in Token entity instead
- Original Transfer events still available for detailed history analysis
- Burned tokens have `currentOwner: null` and `isBurned: true`