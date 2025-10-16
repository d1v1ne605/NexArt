import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt } from "@graphprotocol/graph-ts"
import { Increment } from "../generated/Counter/Counter"

export function createIncrementEvent(by: BigInt): Increment {
  let incrementEvent = changetype<Increment>(newMockEvent())

  incrementEvent.parameters = new Array()

  incrementEvent.parameters.push(
    new ethereum.EventParam("by", ethereum.Value.fromUnsignedBigInt(by))
  )

  return incrementEvent
}
