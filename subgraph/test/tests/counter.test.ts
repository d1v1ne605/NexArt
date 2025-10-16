import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt } from "@graphprotocol/graph-ts"
import { Increment } from "../generated/schema"
import { Increment as IncrementEvent } from "../generated/Counter/Counter"
import { handleIncrement } from "../src/counter"
import { createIncrementEvent } from "./counter-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let by = BigInt.fromI32(234)
    let newIncrementEvent = createIncrementEvent(by)
    handleIncrement(newIncrementEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("Increment created and stored", () => {
    assert.entityCount("Increment", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "Increment",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "by",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
