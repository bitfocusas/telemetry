import { EventEmitter } from 'node:events'
import Axios from 'axios'
import { type SomeTelemetryEvent, type TelemetryEvent, type ElgatoHardwareItem, TELEMETRY_EVENTS } from './types'
export { TELEMETRY_EVENTS, SomeTelemetryEvent } from './types'

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

const TELEMETRY_MODULE_VERSION = '1.0.0'

export class BitfocusTelemetry extends EventEmitter {
	private elgatoHardwareList: ElgatoHardwareItem[] = []
	private bitfocusProduct: 'buttons' | 'companion' | null = null
	private kvpSetter: <T>(key: string, value: T) => void
	private kvpGetter: <T>(key: string) => T | undefined
	private interval: NodeJS.Timeout | null = null
	private dataWaiting = false
	private dataLastPayload: string | null = null
	private dataSending = false
	private apiInitialWait = 1000 * 1 //  60 * 2 // 2 minutes
	private apiInterval = 1000 * 60 * 60 // 1 hour
	private api: ReturnType<typeof Axios.create>

	constructor(
		kvpSet: <T>(key: string, value: T) => void,
		kvpGet: <T>(key: string) => T | undefined,
		installationId?: string,
		axiosInstance = Axios.create({
			baseURL: 'https://api.bitfocus.io/v1',
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': `BitfocusTelemetry/${TELEMETRY_MODULE_VERSION}`,
			},
		}),
	) {
		super()
		this.api = axiosInstance
		this.kvpSetter = kvpSet
		this.kvpGetter = kvpGet
		if (installationId) this.api.defaults.headers['X-Installation'] = installationId
	}

	public init() {
		this.interval = setInterval(() => this.tick(), this.apiInterval)
		setTimeout(() => {
			this.tick()
		}, this.apiInitialWait)
	}

	private async tick() {
		const allStates: SomeTelemetryEvent[] = []

		// Elgato Hardware Presence
		if (this.elgatoHardwareList) {
			const elgatoHardwarePresence: TelemetryEvent<TELEMETRY_EVENTS.ELGATO_HARDWARE_PRESENCE> = [
				TELEMETRY_EVENTS.ELGATO_HARDWARE_PRESENCE,
				[...this.elgatoHardwareList],
			]
			allStates.push(elgatoHardwarePresence)
		}

		// Bitfocus Software Presence
		if (this.bitfocusProduct) {
			const bitfocusSoftware: TelemetryEvent<TELEMETRY_EVENTS.BITFOCUS_SOFTWARE> = [
				TELEMETRY_EVENTS.BITFOCUS_SOFTWARE,
				this.bitfocusProduct,
			]
			allStates.push(bitfocusSoftware)
		}

		// Only send data if it has changed
		if (!this.dataWaiting && this.dataLastPayload !== JSON.stringify(allStates)) {
			this.dataLastPayload = JSON.stringify(allStates)
			this.dataWaiting = true
			await this.send(allStates)
		}
	}

	private async send(events: SomeTelemetryEvent[]) {
		if (this.dataSending) return
		this.dataSending = true

		try {
			const response = await this.api.post('/product/telemetry', events)
			if (response.status === 200) {
				this.dataWaiting = false
			}
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (error: any) {
			if (error.response) {
				if (process.env.BITFOCUS === '1') {
					console.error('Telemetry Error: ', error.response.status, error.response.data)
				}
			} else {
				if (process.env.BITFOCUS === '1') {
					console.error('Telemetry Error: ', error.message)
				}
			}
		} finally {
			this.dataSending = false
		}
	}

	public setElgatoHardware(list: ElgatoHardwareItem[]) {
		const existingList = this.kvpGetter<ElgatoHardwareItem[]>('elgatoHardware') ?? []

		const object: Map<string, boolean> = new Map()
		for (const [name] of existingList) {
			object.set(name, false)
		}

		for (const [name, present] of list) {
			object.set(name, present)
		}

		const newList: ElgatoHardwareItem[] = []

		for (const [name, present] of object) {
			newList.push([name, present])
		}

		this.elgatoHardwareList = newList
		this.kvpSetter('elgatoHardware', newList)
	}

	public setBitfocusProduct(product: 'buttons' | 'companion') {
		this.bitfocusProduct = product
	}

	public async close() {
		// stop timers
		if (this.interval) {
			clearInterval(this.interval)
		}

		while (this.dataSending) {
			await new Promise((resolve) => setTimeout(resolve, 100))
		}
	}
}

export function sum(a: number, b: number): number {
	return a + b
}
