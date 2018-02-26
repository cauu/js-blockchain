class TxOutput {
  constructor({ value, scriptPubKey }) {
    this.value = value;
    this.scriptPubKey = scriptPubKey;
  }

  /**
   * @desc 如果用户可以解锁output中的数据，那么他就可以使用output中的value
   */
  canBeUnlockWith(unlockingData) {
    return this.scriptPubKey === unlockingData;
  }
}

module.exports = TxOutput;