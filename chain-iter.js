const lmdb = require('node-lmdb');
/**
 * @desc 从后往前倒序遍历整个区块链
 * @todo fix unable iterToBegining
 */
class ChainIterator {
  constructor(chain) {
    this.chain = chain;

    this.nextHash = null;
  }

  foreach(cb) {
    let block;

    while (block = this.next()) {
      cb && cb(block);
    }
  }

  next() {
    const iterToNext = (hash) => {
      const block = this.chain.getBlock(hash);
      this.nextHash = block.prevBlockHash;
      return block;
    };

    if (this.nextHash === '') {
      return null;
    }

    if (!this.nextHash && this.nextHash !== '') {
      return iterToNext(this.chain.getLastHash());
    }

    return iterToNext(this.nextHash);
  }
}

module.exports = ChainIterator;
