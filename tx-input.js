const Base58 = require('bs58');

const Wallet = require('./wallet');

/**
 * @property {string} txId 对应前一个output所在的transaction的id
 * @property {int} vout 对应output的index
 * @property {string} scriptSig 
 * @property {string} pubKey 用户的publickey
 * @property {string} signature 签名，用来验证该input是有效的input
 **/
class TxInput {
  constructor({ txId, vout, signature, pubKey, scriptSig }) {
    this.txId = txId;
    this.vout = vout;
    this.scriptSig = scriptSig;
    this.signature = signature;
    this.pubKey = pubKey;
  }

  /**
   * @todo
   * “我”需要证明“我”有权限使用txId中相应vout的资金,
   * “我”需要提供“我”的publicKeyHash和签名去解锁vout中的资金
   */
  canUnlockOutputWith(address) {
    const fullHash = Base58.decode(address).toString('hex');

    const pubKeyHash = fullHash.slice(2, fullHash.length - 4);

    return this.usesKey(pubKeyHash);
  }

  /**
   * @desc
   * 判断“我”所提供的publicKeyHash，
   * 等于input对应的publicKeyHash
   */
  usesKey(pubKeyHash) {
    const lockingHash = Wallet.hashPubKey(this.pubKey);

    return lockingHash === pubKeyHash;
  }
}

module.exports = TxInput;