/**
 * @param {int} version 比特币节点的版本
 * @param {int} bestHeight 节点储存的比特币当前高度
 * @param {string} addrFrom sender的地址
 */
class Version {
  constructor({version, bestHeight, addrFrom}) {
    this.version = version;
    this.bestHeight = bestHeight;
    this.addrFrom = addrFrom;
  }
}

module.exports = version;
