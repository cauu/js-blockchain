const sha256 = require('sha256');
const EC = require('elliptic').ec;

const ec = new EC('p256');

const Wallet = require('./wallet');
const TxInput = require('./tx-input');
const TxOutput = require('./tx-output');
const Wallets = require('./wallets');

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

    if (!data) {
      // data = `This is a reward to ${to} at ${createdAt}`;
      data = to;
    }

    const vin = [new TxInput({ txId: '', vout: -1, pubKey: null, signature: null })];
    const vout = [new TxOutput({ value: subsidy }).lock(to)];
    // vout.lock(to);
    const tx = new Transaction('', vin, vout, createdAt);
    tx.id = tx.hash();

    return tx;
  }

  /**
   * @description
   * 创建一个新的transaction时，
   * 用户需要提供publickeyhash和signature
   * 大概步骤为:
   *   1. 用户提供自己的地址
   *   2. 根据用户提供的地址，找到足够匹配amount金额的unspent output
   *   3. 根据这些output生成对应的input和output，同时对所有的input进行签名
   *   4. 将上一步的结果打包成transaction放入transaction池中
   */
  static createUTXOTransaction(from, to, amount, utxo) {
    const inputs = [];
    const outputs = [];
    const wallets = new Wallets();

    const { acc, validTXs } = utxo.findSpendableOutputs(from, amount);

    // return chain.findSpendableOutputs(from, amount).then(({ acc, validTXs }) => {
    if (acc < amount) {
      throw new Error(`Error: not enough funds on ${from}.`);
    }

    Object.keys(validTXs).forEach((txId) => {
      const outs = validTXs[txId];

      outs.forEach((outIdx) => {
        const input = new TxInput({ txId, vout: outIdx, pubKey: wallets.getWallet(from).publicKey });
        inputs.push(input);
      });
    });

    const payment = new TxOutput({ value: amount });
    payment.lock(to);
    outputs.push(payment);

    if (acc > amount) {
      const change = new TxOutput({ value: acc - amount })
      change.lock(from);
      outputs.push(change);
    }

    const tx = new Transaction('', inputs, outputs);
    tx.id = tx.hash();

    const prevTXs = utxo.chain.findTransactionsById(Object.keys(validTXs));

    tx.sign(wallets.getWallet(from).privateKey, prevTXs);

    return tx;
  }

  constructor(id, vin, vout, createdAt) {
    this.id = id;
    this.vin = vin || [];
    this.vout = vout || [];
    this.createdAt = createdAt || new Date().getTime();
  }

  /**
   * @desc
   * 对所有vin进行签名，保证用户不会提取他人账户中的资金
   * 我们知道，数字签名的构成为: privateKeyEncode(data + privateKeyEncode(hash(data)))
   * 此处我们需要确定的是data中应该包含的内容
   * 这样我们可以通过校验签名中的内容，保证transaction中每一个input都不会被篡改
   */
  sign(privateKey, prevTxs) {
    /**
     * @desc coinbase的tx不存在input，因此也不需要对其进行签名
     */
    if (this.isCoinbase()) {
      return;
    }

    const txCopy = this.trimmedCopy();

    txCopy.vin.forEach((txin, index) => {
      /**
       * @desc 每个input的签名都会包含它所在transaction的hash
       */
      const prevTx = prevTxs[txin.txId];
      txCopy.vin[index].signature = null;
      txCopy.vin[index].pubKey = prevTx.vout[txin.vout].pubKeyHash;
      txCopy.id = txCopy.hash();
      txCopy.vin[index].pubKey = null;
      /**
       * @desc 签名
       */
      const signature = ec.keyFromPrivate(privateKey).sign(txCopy.id).toDER('hex');
      this.vin[index].signature = signature;
    });
  }

  /**
   * @desc
   * 只有通过验证的交易，才能被写入到新的区块中
   * 通过pubKey验证signature是否合法
   */
  verify(prevTxs) {
    const txCopy = this.trimmedCopy();

    this.vin.forEach((txin, index) => {
      const prevTx = prevTxs[txin.txId];
      txCopy.vin[index].signature = null;
      txCopy.vin[index].pubKey = prevTx.vout[txin.vout].pubKeyHash;
      txCopy.id = txCopy.hash();
      txCopy.vin[index].pubKey = null;

      const pubKeyLength = txin.pubKey.length;
      const pubKey = {
        x: txin.pubKey.slice(0, pubKeyLength / 2),
        y: txin.pubKey.slice(pubKeyLength / 2)
      };

      /**
       * @desc
       * publicKey可以解锁output,
       * 并且用户能证明他/她拥有该publickey对应的privateKey
       */
      if (Wallet.hashPubKey(this.vin[index].pubKey) !== prevTx.vout[txin.vout].pubKeyHash
        || !ec.keyFromPublic(pubKey).verify(txCopy.id, this.vin[index].signature)) {
        return false;
      }
    });

    return true;
  }

  /**
   * @todo
   * 问题: 为什么需要trimmedCopy函数?
   * 在sign函数中，我们会对vin字段进行修改，因此需要复制一份
   */
  trimmedCopy() {
    const inputs = [];
    const outputs = [];

    this.vin.forEach((txin) => {
      inputs.push(new TxInput({ txId: txin.txId, vout: txin.vout }));
    });

    this.vout.forEach((txout) => {
      outputs.push(new TxOutput({ value: txout.value, pubKeyHash: txout.pubKeyHash }));
    });

    return new Transaction(this.id, inputs, outputs, this.createdAt);
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