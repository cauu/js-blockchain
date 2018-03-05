const Wallet = require('./wallet');

/**
 * @property {string} txId 对应前一个output所在的transaction的id
 * @property {int} vout 对应output的index
 * @property {string} scriptSig 
 **/
class TxInput {
  constructor({ txId, vout, scriptSig }) {
    this.txId = txId;
    this.vout = vout;
    this.scriptSig = scriptSig;
  }

  /**
   * @todo
   * “我”需要证明“我”有权限使用txId中相应vout的资金,
   * “我”需要提供“我”的publicKeyHash和签名去解锁vout中的资金
   */
  canUnlockOutputWith(unlockingData) {
    return this.scriptSig === unlockingData;
  }

  usesKey(pubKeyHash) {
    const lockingHash = Wallet.hashPubKey();
  }
}

module.exports = TxInput;