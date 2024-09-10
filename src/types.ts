export type ElgatoHardwareItem = [string, boolean]

// Define the enum for your telemetry events
export enum TELEMETRY_EVENTS {
	ELGATO_HARDWARE_PRESENCE = 1,
	BITFOCUS_SOFTWARE = 2,
}

// Create a mapping between event names and payload types
type TelemetryEventPayloadMap = {
	[TELEMETRY_EVENTS.ELGATO_HARDWARE_PRESENCE]: ElgatoHardwareItem[]
	[TELEMETRY_EVENTS.BITFOCUS_SOFTWARE]: 'buttons' | 'companion'
}

// Utility type to ensure correct payloads for each event
export type TelemetryEvent<T extends TELEMETRY_EVENTS> = [T, TelemetryEventPayloadMap[T]]

// Combine all possible telemetry events into a single type
export type SomeTelemetryEvent =
	| TelemetryEvent<TELEMETRY_EVENTS.ELGATO_HARDWARE_PRESENCE>
	| TelemetryEvent<TELEMETRY_EVENTS.BITFOCUS_SOFTWARE>
