const sha256 = require('sha256');

const POW = require('./pow');
const TxInput = require('./tx-input');
const TxOutput = require('./tx-output');
const Transaction = require('./transaction');
const MerkleTree = require('./merkle-tree');

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
      const blockObj = new Block(JSON.parse(blockStr));

      blockObj.transactions = blockObj.transactions.map((tx) => {
        tx = new Transaction(tx.id, tx.vin, tx.vout, tx.createdAt);

        tx.vin = tx.vin.map(txin => new TxInput(txin));

        tx.vout = tx.vout.map(txout => new TxOutput(txout));

        return tx;
      });

      return blockObj;
    } catch (e) {
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

  /**
   * @desc
   * 
   */
  hashTransactions() {
    const transactions = [];

    this.transactions.forEach((tx) => {
      transactions.push(tx.serialize());
    });

    mTree = MerkleTree.newMerkleTree(transactions);

    return mTree.root.data;
  }
}

module.exports = Block;
