/**
 * @file tests.js
 * @description Browser-runnable unit tests for the PubSub class.
 * Open tests.html in a browser (served via python3 -m http.server 8000) to run.
 *
 * PubSub is re-declared here for isolated unit testing — no DOM dependency.
 * This file intentionally does not import script.js.
 */

// ─── Minimal Test Runner ─────────────────────────────────────────────────────

/** @type {{ name: string, passed: boolean, error?: string }[]} */
const results = [];

/** @param {string} name @param {Function} fn */
function test(name, fn) {
    try {
        fn();
        results.push({ name, passed: true });
    } catch (err) {
        results.push({ name, passed: false, error: err.message });
    }
}

/** @param {boolean} condition @param {string} [message] */
function assert(condition, message) {
    if (!condition) throw new Error(message ?? 'Assertion failed');
}

/** @param {any} a @param {any} b @param {string} [message] */
function assertEqual(a, b, message) {
    if (a !== b) throw new Error(message ?? `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// ─── PubSub (self-contained — mirrors implementation in script.js) ────────────

class PubSub {
    constructor() {
        /** @type {Object.<string, Function[]>} */
        this.events = {};
    }

    subscribe(eventName, callback) {
        if (!this.events[eventName]) this.events[eventName] = [];
        this.events[eventName].push(callback);
    }

    publish(eventName, data) {
        if (!this.events[eventName]) return;
        this.events[eventName].forEach(cb => {
            try { cb(data); } catch (e) { console.error(`PubSub Error [${eventName}]:`, e); }
        });
    }

    unsubscribe(eventName, callback) {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test('subscriber receives correct data on publish', () => {
    const bus = new PubSub();
    let received;
    bus.subscribe('EVT', data => { received = data; });
    bus.publish('EVT', 42);
    assertEqual(received, 42);
});

test('publish to unknown event does not throw', () => {
    const bus = new PubSub();
    bus.publish('GHOST', 'payload'); // must not throw
    assert(true); // reached without error
});

test('all subscribers for an event are called', () => {
    const bus = new PubSub();
    let count = 0;
    bus.subscribe('MULTI', () => count++);
    bus.subscribe('MULTI', () => count++);
    bus.subscribe('MULTI', () => count++);
    bus.publish('MULTI');
    assertEqual(count, 3);
});

test('unsubscribed callback is no longer called', () => {
    const bus = new PubSub();
    let calls = 0;
    const handler = () => calls++;
    bus.subscribe('UNSUB', handler);
    bus.publish('UNSUB');           // calls → 1
    bus.unsubscribe('UNSUB', handler);
    bus.publish('UNSUB');           // calls → still 1
    assertEqual(calls, 1);
});

test('unsubscribe removes only the target callback, not others', () => {
    const bus = new PubSub();
    let aCount = 0, bCount = 0;
    const handlerA = () => aCount++;
    const handlerB = () => bCount++;
    bus.subscribe('EVT', handlerA);
    bus.subscribe('EVT', handlerB);
    bus.unsubscribe('EVT', handlerA);
    bus.publish('EVT');
    assertEqual(aCount, 0, 'removed handler must not fire');
    assertEqual(bCount, 1, 'remaining handler must still fire');
});

test('a throwing subscriber does not prevent others from firing', () => {
    const bus = new PubSub();
    let secondCalled = false;
    bus.subscribe('ERR', () => { throw new Error('intentional'); });
    bus.subscribe('ERR', () => { secondCalled = true; });
    bus.publish('ERR');
    assert(secondCalled, 'second subscriber should fire despite first throwing');
});

test('unsubscribe on unknown event does not throw', () => {
    const bus = new PubSub();
    bus.unsubscribe('NEVER_REGISTERED', () => {});
    assert(true);
});

test('publish with no data argument passes undefined to subscriber', () => {
    const bus = new PubSub();
    let received = 'sentinel';
    bus.subscribe('NO_DATA', data => { received = data; });
    bus.publish('NO_DATA');
    assert(received === undefined, `expected undefined, got ${JSON.stringify(received)}`);
});

// ─── Render Results ───────────────────────────────────────────────────────────
// Script is loaded at end of <body>, so #results is already in the DOM.

const container = document.getElementById('results');
const passed = results.filter(r => r.passed).length;
const total = results.length;

const summary = document.createElement('div');
summary.className = `summary ${passed === total ? 'all-pass' : 'has-fail'}`;
summary.textContent = `${passed} / ${total} tests passed`;
container.appendChild(summary);

results.forEach(({ name, passed, error }) => {
    const row = document.createElement('div');
    row.className = `test-row ${passed ? 'pass' : 'fail'}`;

    const header = document.createElement('div');
    header.className = 'test-row-header';

    const status = document.createElement('span');
    status.className = 'status';
    status.textContent = passed ? '✓' : '✗';

    const label = document.createElement('span');
    label.textContent = name;

    header.append(status, label);
    row.appendChild(header);

    if (error) {
        const pre = document.createElement('pre');
        pre.className = 'error';
        pre.textContent = error;
        row.appendChild(pre);
    }

    container.appendChild(row);
});
