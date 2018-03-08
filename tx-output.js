const Base58 = require('bs58');

class TxOutput {
  constructor({ value, pubKeyHash }) {
    this.value = value;
    this.pubKeyHash = pubKeyHash || null;
  }

  /**
   * @desc 如果用户可以解锁output中的数据，那么他就可以使用output中的value
   */
  canBeUnlockWith(address) {
    const fullHash = Base58.decode(address).toString('hex');

    const pubKeyHash = fullHash.slice(2, fullHash.length - 4);

    return this.isLockWith(pubKeyHash);
  }

  lock(address) {
    const pubKeyHash = Base58.decode(address).toString('hex');

    this.pubKeyHash = pubKeyHash.slice(2, pubKeyHash.length - 4);

    return this;
  }

  isLockWith(pubKeyHash) {
    return pubKeyHash === this.pubKeyHash;
  }
}

module.exports = TxOutput;