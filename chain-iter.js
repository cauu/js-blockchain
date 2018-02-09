/**
 * @desc
 * 从后往前倒序遍历整个区块链
 */
class ChainIterator {
  constructor(chain) {
    this.chain = chain;

    this.nextHash = null;
  }

  next() {
    const iterToNext = (hash) => {
      return this.chain
        .getBlock(hash)
        .then((block) => {
          this.nextHash = block.prevBlockHash;

          return Promise.resolve(block);
        })
        .catch((e) => {
          return Promise.reject(e);
        })
      ;
    };

    if(this.nextHash === '') {
      return Promise.resolve(null);
    }

    if(!this.nextHash && this.nextHash !== '') {
      return this.chain.getLastHash()
        .then(iterToNext)
      ;
    }

    return iterToNext(this.nextHash);
  }
}

module.exports = ChainIterator;
