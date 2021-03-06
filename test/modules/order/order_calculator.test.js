const assert = require('assert');
const OrderCalculator = require('../../../modules/order/order_calculator');
const PairConfig = require('../../../modules/pairs/pair_config');

describe('#order size calculation', () => {
  it('test instance order size for capital', async () => {
    const instances = {};

    instances.symbols = [
      {
        exchange: 'foobar',
        symbol: 'foo',
        trade: {
          capital: 12
        }
      },
      {
        exchange: 'foobar2',
        symbol: 'foo2'
      },
      {
        exchange: 'foobar',
        symbol: 'foo2',
        trade: {
          capital: 1337
        }
      }
    ];

    const calculator = new OrderCalculator(
      {},
      {
        error: () => {}
      },
      {
        get: () => {
          return {
            calculateAmount: n => n,
            isInverseSymbol: () => false
          };
        }
      },
      new PairConfig(instances)
    );

    assert.strictEqual(await calculator.calculateOrderSize('foobar', 'foo'), 12);
    assert.strictEqual(await calculator.calculateOrderSize('UNKNOWN', 'foo'), undefined);
    assert.strictEqual(await calculator.calculateOrderSize('foobar', 'foo2'), 1337);
  });

  it('test instance order size currency capital', async () => {
    const instances = {};

    instances.symbols = [
      {
        exchange: 'foobar',
        symbol: 'foo',
        trade: {
          currency_capital: 12
        }
      },
      {
        exchange: 'foobar2',
        symbol: 'foo2'
      },
      {
        exchange: 'foobar',
        symbol: 'foo2',
        trade: {
          currency_capital: 1337
        }
      }
    ];

    const calculator = new OrderCalculator(
      {
        get: (exchangeName, symbol) => {
          if (symbol === 'foo') {
            return { bid: 3000 };
          }

          if (symbol === 'foo2') {
            return { bid: 6000 };
          }
        }
      },
      {
        error: () => {}
      },
      {
        get: () => {
          return {
            calculateAmount: n => n,
            isInverseSymbol: () => false
          };
        }
      },
      new PairConfig(instances)
    );

    assert.strictEqual(await calculator.calculateOrderSize('foobar', 'foo'), 0.004);
    assert.strictEqual(await calculator.calculateOrderSize('UNKNOWN', 'foo'), undefined);
    assert.strictEqual((await calculator.calculateOrderSize('foobar', 'foo2')).toFixed(2), '0.22');
  });

  it('test instance order size fir inverse exchanges', async () => {
    const instances = {};

    instances.symbols = [
      {
        exchange: 'foobar',
        symbol: 'foo',
        trade: {
          currency_capital: 12
        }
      },
      {
        exchange: 'foobar2',
        symbol: 'foo2'
      },
      {
        exchange: 'foobar',
        symbol: 'foo2',
        trade: {
          currency_capital: 1337
        }
      },
      {
        exchange: 'foobar',
        symbol: 'foo_capital',
        trade: {
          capital: 0.0001
        }
      }
    ];

    const calculator = new OrderCalculator(
      {
        get: (exchangeName, symbol) => {
          if (symbol === 'foo') {
            return { bid: 3000 };
          }

          if (symbol === 'foo2') {
            return { bid: 6000 };
          }

          if (symbol === 'foo_capital') {
            return { bid: 8000 };
          }
        }
      },
      {
        error: () => {}
      },
      {
        get: () => {
          return {
            calculateAmount: n => n,
            isInverseSymbol: () => true
          };
        }
      },
      new PairConfig(instances)
    );

    assert.strictEqual(await calculator.calculateOrderSize('foobar', 'foo'), 12);
    assert.strictEqual(await calculator.calculateOrderSize('UNKNOWN', 'foo'), undefined);
    assert.strictEqual(await calculator.calculateOrderSize('foobar', 'foo2'), 1337.0);
    assert.strictEqual(await calculator.calculateOrderSize('foobar', 'foo_capital'), 0.8);
  });
});
