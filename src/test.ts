import fs from 'node:fs'
import { BitfocusTelemetry } from 'src'

const filePath = './kvp_storage.json'
const kvp: Map<string, unknown> = new Map()

// Load existing data from the file if it exists
const loadFromFile = () => {
	if (fs.existsSync(filePath)) {
		const fileData = fs.readFileSync(filePath, 'utf-8')
		const parsedData = JSON.parse(fileData) as Record<string, unknown>
		Object.entries(parsedData).forEach(([key, value]) => {
			kvp.set(key, value)
		})
	}
}

// Save the current map to the file
const saveToFile = () => {
	const obj = Object.fromEntries(kvp)
	fs.writeFileSync(filePath, JSON.stringify(obj, null, 2))
}

const sset = <T>(key: string, value: T) => {
	kvp.set(key, value)
	saveToFile()
	console.log(`Saved ${key} to storage`)
}

const sget = <T>(key: string): T | undefined => {
	if (kvp.size === 0) {
		loadFromFile()
	}
	return kvp.get(key) as T | undefined
}

const telemetry = new BitfocusTelemetry(sset, sget)

telemetry.init()
telemetry.setBitfocusProduct('buttons')
telemetry.setElgatoHardware([['xxxx', true]])
setTimeout(() => {
	telemetry.destroy();
}, 10000);