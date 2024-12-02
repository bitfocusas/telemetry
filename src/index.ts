import { EventEmitter } from 'node:events'
import Axios from 'axios'
import { type SomeTelemetryEvent, type ElgatoHardwareItem, TELEMETRY_EVENTS } from './types'
import { log } from './log'

const TELEMETRY_MODULE_VERSION = '1.0.0'
/*
 * Bitfocus Telemetry Module
 *
 * This telemetry module that is used to send telemetry data to Bitfocus.
 * This data is NOT used to monitor you as a user, but rather to resolve some business stuff.
 *
 * No shady secrets, really.
 *
 * If you have questions, feel free to reach out to william@bitfocus.io :)
 */

export class BitfocusTelemetry extends EventEmitter {
	private elgatoHardwareList: ElgatoHardwareItem[] = []
	private bitfocusProduct: 'buttons' | 'companion' | null = null
	private kvpSetter: <T>(key: string, value: T) => void
	private kvpGetter: <T>(key: string) => T | undefined
	private interval: NodeJS.Timeout | null = null
	private lastPayloadHash: string | null = null
	private isSending = false

	private readonly apiInitialDelay = 1000 // 1 second
	private readonly apiInterval = 5000 // 5 seconds
	private readonly maxRetries = 3

	private readonly api = Axios.create({
		baseURL: process.env.LOCAL_API ? 'http://127.0.0.1:8002/v1' : 'https://api.bitfocus.io/v1',
		timeout: 10000,
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': `BitfocusTelemetry/${TELEMETRY_MODULE_VERSION}`,
		},
	})

	constructor(
		kvpSet: <T>(key: string, value: T) => void,
		kvpGet: <T>(key: string) => T | undefined,
		installationId?: string,
	) {
		super()
		this.kvpSetter = kvpSet
		this.kvpGetter = kvpGet
		if (installationId) this.api.defaults.headers['X-Installation'] = installationId

		log('Telemetry module initialized', installationId)
	}

	public init(): void {
		this.interval = setInterval(() => this.processTelemetry(), this.apiInterval)
		setTimeout(() => this.processTelemetry(), this.apiInitialDelay)
	}

	public destroy(): void {
		if (this.interval) {
			clearInterval(this.interval)
		}
	}

	private async processTelemetry(): Promise<void> {
		const telemetryEvents = this.collectTelemetryEvents()

		// Always include the currently selected Bitfocus product
		if (this.bitfocusProduct) {
			telemetryEvents.push([TELEMETRY_EVENTS.BITFOCUS_SOFTWARE, this.bitfocusProduct])
		}

		const payloadHash = JSON.stringify(telemetryEvents)

		if (payloadHash === this.lastPayloadHash) {
			log('No changes in telemetry data, skipping send.')
			return
		}

		try {
			await this.sendTelemetry(telemetryEvents)
			this.lastPayloadHash = payloadHash
			log('Telemetry data successfully sent.')
		} catch (error) {
			log('Failed to send telemetry data, will retry later.', error)
		}
	}

	private collectTelemetryEvents(): SomeTelemetryEvent[] {
		const events: SomeTelemetryEvent[] = []

		if (this.elgatoHardwareList.length > 0) {
			events.push([TELEMETRY_EVENTS.ELGATO_HARDWARE_PRESENCE, [...this.elgatoHardwareList]])
		}

		return events
	}

	private async sendTelemetry(events: SomeTelemetryEvent[]): Promise<void> {
		if (this.isSending) {
			log('Telemetry data already being sent, skipping concurrent send.')
			return
		}

		this.isSending = true
		try {
			for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
				try {
					const response = await this.api.put('/telemetry', events)
					if (response.status === 200) {
						log(`Telemetry sent successfully on attempt ${attempt}.`)
						break
					} else {
						throw new Error(`Unexpected response status: ${response.status}`)
					}
				} catch (error) {
					if (attempt === this.maxRetries) {
						throw error
					}
					log(`Retrying telemetry send (${attempt}/${this.maxRetries}).`, error)
				}
			}
		} finally {
			this.isSending = false
		}
	}

	public setElgatoHardware(list: ElgatoHardwareItem[]): void {
		const previousList = this.kvpGetter<ElgatoHardwareItem[]>('elgatoHardware') ?? []
		const updatedHardware = new Map<string, boolean>()

		for (const [name] of previousList) {
			updatedHardware.set(name, false)
		}
		for (const [name, present] of list) {
			updatedHardware.set(name, present)
		}

		this.elgatoHardwareList = Array.from(updatedHardware.entries())
		this.kvpSetter('elgatoHardware', this.elgatoHardwareList)
		log('Elgato hardware list updated:', this.elgatoHardwareList)
	}

	public setBitfocusProduct(product: 'buttons' | 'companion'): void {
		this.bitfocusProduct = product
		log('Bitfocus product set to:', product)
	}

	public async close(): Promise<void> {
		if (this.interval) {
			clearInterval(this.interval)
		}

		while (this.isSending) {
			await new Promise((resolve) => setTimeout(resolve, 100))
		}

		log('Telemetry module closed.')
	}
}

export function sum(a: number, b: number): number {
	return a + b
}
