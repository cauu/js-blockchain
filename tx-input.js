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
   */
  canUnlockOutputWith(unlockingData) {
    return this.scriptSig === unlockingData;
  }
}

module.exports = TxInput;