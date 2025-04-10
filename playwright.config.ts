"use strict"
Object.defineProperty(exports, "__esModule", { value: true});

const config = {
    testDir: 'src\\__tests__',
    timeout: 30 * 1000,
    use: {
        headless: true,
    },
    expect: {
        timeout: 5000
    },
};
exports.default = config;