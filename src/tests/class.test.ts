process.env.NODE_ENV = 'test'

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import { BitfocusTelemetry } from '..'

const kvp: Map<string, unknown> = new Map()

const sset = <T>(key: string, value: T) => {
	kvp.set(key, value)
}

const sget = <T>(key: string): T | undefined => {
	return kvp.get(key) as T | undefined
}

const telemetry = new BitfocusTelemetry(sset, sget)

describe('BitfocusTelemetry setElgatoHardware', () => {
	beforeAll(() => {
		telemetry.init()
	})

	test('should add new hardware item', () => {
		telemetry.setElgatoHardware([['streamdeck', true]])
		expect(sget('elgatoHardware')).toEqual([['streamdeck', true]])
	})

	test('should update existing hardware item', () => {
		telemetry.setElgatoHardware([['streamdeck', false]])
		expect(sget('elgatoHardware')).toEqual([['streamdeck', false]])
	})

	test('should retain previous items if new list is empty', () => {
		telemetry.setElgatoHardware([])
		expect(sget('elgatoHardware')).toEqual([['streamdeck', false]])
	})

	afterAll(async () => {
		await telemetry.close()
	})
})
