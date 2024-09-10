export type ElgatoHardwareItem = [string, boolean];
export declare enum TELEMETRY_EVENTS {
    ELGATO_HARDWARE_PRESENCE = 1,
    BITFOCUS_SOFTWARE = 2
}
type TelemetryEventPayloadMap = {
    [TELEMETRY_EVENTS.ELGATO_HARDWARE_PRESENCE]: ElgatoHardwareItem[];
    [TELEMETRY_EVENTS.BITFOCUS_SOFTWARE]: 'buttons' | 'companion';
};
export type TelemetryEvent<T extends TELEMETRY_EVENTS> = [T, TelemetryEventPayloadMap[T]];
export type SomeTelemetryEvent = TelemetryEvent<TELEMETRY_EVENTS.ELGATO_HARDWARE_PRESENCE> | TelemetryEvent<TELEMETRY_EVENTS.BITFOCUS_SOFTWARE>;
export {};
