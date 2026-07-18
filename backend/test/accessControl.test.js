const test = require('node:test');
const assert = require('node:assert/strict');
const { canAccessAccount } = require('../utils/accessControl');

test('allows active admin_main without subscription', () => {
    const user = {
        role: 'admin_main',
        status: 'active',
        subscription: { type: 'none', status: 'inactive' }
    };

    assert.equal(canAccessAccount(user, new Date('2026-01-01T00:00:00.000Z')), true);
});

test('blocks active admin customer without subscription', () => {
    const user = {
        role: 'admin_customer',
        status: 'active',
        subscription: { type: 'none', status: 'inactive' }
    };

    assert.equal(canAccessAccount(user, new Date('2026-01-01T00:00:00.000Z')), false);
});

test('blocks inactive admin customer even with a subscription', () => {
    const user = {
        role: 'admin_customer',
        status: 'inactive',
        subscription: { type: 'monthly', status: 'active', endDate: '2026-02-01T00:00:00.000Z' }
    };

    assert.equal(canAccessAccount(user, new Date('2026-01-01T00:00:00.000Z')), false);
});

test('allows active admin customer with a valid subscription', () => {
    const user = {
        role: 'admin_customer',
        status: 'active',
        subscription: { type: 'monthly', status: 'active', endDate: '2026-02-01T00:00:00.000Z' }
    };

    assert.equal(canAccessAccount(user, new Date('2026-01-01T00:00:00.000Z')), true);
});
