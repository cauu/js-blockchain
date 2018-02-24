const sha256 = require('sha256');
const POW = require('./pow');

/**
 * @todo 使用transaction代替之前的data
 */
class Block {
  constructor(args) {
    const {
      timeStamp,
      prevBlockHash,
      hash,
      transactions
    } = args;

    this.timeStamp = timeStamp;
    this.prevBlockHash = prevBlockHash;
    this.hash = hash;
    this.transactions = transactions;
  }

  static newBlock(transactions, prevBlockHash) {
    const block = new Block({
      timeStamp: new Date().getTime(),
      transactions,
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

  static deserializeBlock(blockStr) {
    try {
      return new Block(JSON.parse(blockStr));
    } catch(e) {
      console.log(e);
    }
  }

  serialize() {
    return JSON.stringify({
      timeStamp: this.timeStamp,
      data: this.data,
      prevBlockHash: this.prevBlockHash,
      hash: this.hash,
      transactions: this.transactions
    });
  }

  setHash() {
    const headers = this.prevBlockHash + this.data + this.timeStamp;
    
    this.hash = sha256(headers);
  }
}

module.exports = Block;
