const sha256 = require('sha256');

const TxInput = require('./tx-input');
const TxOutput = require('./tx-output');

/**
 * @const {int} subsidy 挖矿成功后默认的奖励
 */
const subsidy = 10;

/**
 * @property {string} id
 * @property {array<TxInput>} vin 
 */
class Transaction {
  static createCoinbaseTransaction(to, data) {
    const createdAt = new Date().getTime();

    if(!data) {
      // data = `This is a reward to ${to} at ${createdAt}`;
      data = to;
    }

    const vin = [new TxInput({ txId: '', vout: -1, scriptSig: data })];
    const vout = [new TxOutput({ value: subsidy, scriptPubKey: to })];
    const tx = new Transaction('', vin, vout, createdAt);
    tx.id = tx.hash();

    return tx;
  }

  /**
   * @description
   * 创建一个新的transaction时，
   * 用户需要提供publickeyhash和signature
   */
  static createUTXOTransaction(from, to, amount, chain) {
    const inputs = [];
    const outputs = [];

    return chain.findSpendableOutputs(from, amount).then(({ acc, validTXs }) => {
      if(acc < amount) {
        throw new Error(`Error: not enough funds on ${from}.`);
      }

      Object.keys(validTXs).forEach((txId) => {
        const outs = validTXs[txId];

        outs.forEach((outIdx) => {
          const input = new TxInput({ txId, vout: outIdx, scriptSig: from });
          inputs.push(input);
        });
      });

      outputs.push(new TxOutput({ value: amount, scriptPubKey: to }));

      if(acc > amount) {
        outputs.push(new TxOutput({ value: acc - amount, scriptPubKey: from }));
      }

      const tx = new Transaction('', inputs, outputs);
      tx.id = tx.hash();

      return tx;
    });
  }

  constructor(id, vin, vout, createdAt) {
    this.id = id;
    this.vin =  vin || [];
    this.vout = vout || [];
    this.createdAt = createdAt || new Date().getTime();
  }

  /**
   * @description
   * 判断该transaction是否是挖矿的奖励
   */
  isCoinbase() {
    return this.vin.length && this.vin.length === 1 &&
      this.vin[0].txId === '' && this.vin[0].vout === -1;
  }

  serialize() {
    return JSON.stringify({
      id: this.id,
      vin: this.vin,
      vout: this.vout,
      createdAt: this.createdAt
    });
  }

  hash() {
    const txCopy = new Transaction('', this.vin, this.vout, this.createdAt);

    return sha256(txCopy.serialize());
  }
}

module.exports = Transaction;