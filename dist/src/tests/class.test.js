"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_ENV = 'test';
const globals_1 = require("@jest/globals");
const __1 = require("..");
const kvp = new Map();
const sset = (key, value) => {
    kvp.set(key, value);
};
const sget = (key) => {
    return kvp.get(key);
};
const telemetry = new __1.BitfocusTelemetry(sset, sget);
(0, globals_1.describe)('BitfocusTelemetry setElgatoHardware', () => {
    (0, globals_1.beforeAll)(() => {
        telemetry.init();
    });
    (0, globals_1.test)('should add new hardware item', () => {
        telemetry.setElgatoHardware([['streamdeck', true]]);
        (0, globals_1.expect)(sget('elgatoHardware')).toEqual([['streamdeck', true]]);
    });
    (0, globals_1.test)('should update existing hardware item', () => {
        telemetry.setElgatoHardware([['streamdeck', false]]);
        (0, globals_1.expect)(sget('elgatoHardware')).toEqual([['streamdeck', false]]);
    });
    (0, globals_1.test)('should retain previous items if new list is empty', () => {
        telemetry.setElgatoHardware([]);
        (0, globals_1.expect)(sget('elgatoHardware')).toEqual([['streamdeck', false]]);
    });
    (0, globals_1.afterAll)(async () => {
        await telemetry.close();
    });
});
//# sourceMappingURL=class.test.js.map