const sha256 = require('sha256');
const POW = require('./pow');

class Block {
  constructor(args) {
    const {
      timeStamp,
      data,
      prevBlockHash,
      hash,
    } = args;

    this.timeStamp = timeStamp;
    this.data = data;
    this.prevBlockHash = prevBlockHash;
    this.hash = hash;
  }

  static newBlock(data, prevBlockHash) {
    const block = new Block({
      timeStamp: new Date().getTime(),
      data,
      prevBlockHash
    });

    /**
     * @todo
     * 调用共识算法，得到一个合法的区块
     */
    const { nonce, hash } = POW.newProofOfWork(block).run();
    block.hash = hash;
    block.nonce = nonce;
    // block.setHash();

    return block;
  }

  setHash() {
    const headers = this.prevBlockHash + this.data + this.timeStamp;
    
    this.hash = sha256(headers);
  }
}

module.exports = Block;
