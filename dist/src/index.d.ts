import { EventEmitter } from 'node:events';
import { type ElgatoHardwareItem } from './types';
export { TELEMETRY_EVENTS, SomeTelemetryEvent } from './types';
export declare class BitfocusTelemetry extends EventEmitter {
    private elgatoHardwareList;
    private bitfocusProduct;
    private kvpSetter;
    private kvpGetter;
    private interval;
    private dataWaiting;
    private dataLastPayload;
    private dataSending;
    private apiInitialWait;
    private apiInterval;
    private api;
    constructor(kvpSet: <T>(key: string, value: T) => void, kvpGet: <T>(key: string) => T | undefined, installationId?: string, axiosInstance?: import("axios").AxiosInstance);
    init(): void;
    private tick;
    private send;
    setElgatoHardware(list: ElgatoHardwareItem[]): void;
    setBitfocusProduct(product: 'buttons' | 'companion'): void;
    close(): Promise<void>;
}
export declare function sum(a: number, b: number): number;
