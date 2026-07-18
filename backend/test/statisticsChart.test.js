const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSubscriptionChartData } = require('../controllers/statisticsController');

test('buildSubscriptionChartData includes active, inactive and no-subscription segments', () => {
  const chart = buildSubscriptionChartData({
    total: 10,
    monthly: 2,
    sixMonths: 1,
    yearly: 3,
    activeOther: 1,
    inactive: 2,
    noSubscription: 1
  });

  assert.deepEqual(chart.labels, ['Oylik', '6 oylik', 'Yillik', 'Faol', 'Faol emas', 'Obunasi yo\'q']);
  assert.deepEqual(chart.data, [2, 1, 3, 1, 2, 1]);
  assert.equal(chart.total, 10);
});
