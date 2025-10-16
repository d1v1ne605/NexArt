import { Increment as IncrementEvent } from "../generated/Counter/Counter"
import { Increment } from "../generated/schema"

export function handleIncrement(event: IncrementEvent): void {
  let entity = new Increment(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.by = event.params.by

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
