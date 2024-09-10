"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitfocusTelemetry = void 0;
exports.sum = sum;
const node_events_1 = require("node:events");
const axios_1 = __importDefault(require("axios"));
const types_1 = require("./types");
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
const TELEMETRY_MODULE_VERSION = '1.0.0';
class BitfocusTelemetry extends node_events_1.EventEmitter {
    elgatoHardwareList = [];
    bitfocusProduct = null;
    kvpSetter;
    kvpGetter;
    interval = null;
    dataWaiting = false;
    dataLastPayload = null;
    dataSending = false;
    apiInitialWait = 1000 * 1; //  60 * 2 // 2 minutes
    apiInterval = 1000 * 60 * 60; // 1 hour
    api;
    constructor(kvpSet, kvpGet, installationId, axiosInstance = axios_1.default.create({
        baseURL: 'https://api.bitfocus.io/v1',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': `BitfocusTelemetry/${TELEMETRY_MODULE_VERSION}`,
        },
    })) {
        super();
        this.api = axiosInstance;
        this.kvpSetter = kvpSet;
        this.kvpGetter = kvpGet;
        if (installationId)
            this.api.defaults.headers['X-Installation'] = installationId;
    }
    init() {
        this.interval = setInterval(() => this.tick(), this.apiInterval);
        setTimeout(() => {
            this.tick();
        }, this.apiInitialWait);
    }
    async tick() {
        const allStates = [];
        // Elgato Hardware Presence
        if (this.elgatoHardwareList) {
            const elgatoHardwarePresence = [
                types_1.TELEMETRY_EVENTS.ELGATO_HARDWARE_PRESENCE,
                [...this.elgatoHardwareList],
            ];
            allStates.push(elgatoHardwarePresence);
        }
        // Bitfocus Software Presence
        if (this.bitfocusProduct) {
            const bitfocusSoftware = [
                types_1.TELEMETRY_EVENTS.BITFOCUS_SOFTWARE,
                this.bitfocusProduct,
            ];
            allStates.push(bitfocusSoftware);
        }
        // Only send data if it has changed
        if (!this.dataWaiting && this.dataLastPayload !== JSON.stringify(allStates)) {
            this.dataLastPayload = JSON.stringify(allStates);
            this.dataWaiting = true;
            await this.send(allStates);
        }
    }
    async send(events) {
        if (this.dataSending)
            return;
        this.dataSending = true;
        try {
            const response = await this.api.post('/product/telemetry', events);
            if (response.status === 200) {
                this.dataWaiting = false;
            }
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        }
        catch (error) {
            if (error.response) {
                if (process.env.BITFOCUS === '1') {
                    console.error('Telemetry Error: ', error.response.status, error.response.data);
                }
            }
            else {
                if (process.env.BITFOCUS === '1') {
                    console.error('Telemetry Error: ', error.message);
                }
            }
        }
        finally {
            this.dataSending = false;
        }
    }
    setElgatoHardware(list) {
        const existingList = this.kvpGetter('elgatoHardware') ?? [];
        const object = new Map();
        for (const [name] of existingList) {
            object.set(name, false);
        }
        for (const [name, present] of list) {
            object.set(name, present);
        }
        const newList = [];
        for (const [name, present] of object) {
            newList.push([name, present]);
        }
        this.elgatoHardwareList = newList;
        this.kvpSetter('elgatoHardware', newList);
    }
    setBitfocusProduct(product) {
        this.bitfocusProduct = product;
    }
    async close() {
        // stop timers
        if (this.interval) {
            clearInterval(this.interval);
        }
        while (this.dataSending) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
}
exports.BitfocusTelemetry = BitfocusTelemetry;
function sum(a, b) {
    return a + b;
}
//# sourceMappingURL=index.js.map