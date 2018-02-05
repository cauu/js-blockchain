const Block = require('./block');

class BlockChain {
  constructor(blocks = []) {
    this.blocks = blocks;
  }

  static newBlockChain() {
    return new BlockChain([BlockChain.newGenesisBlock()]);
  }

  static newGenesisBlock() {
    return Block.newBlock("GenesisBlock", "");
  }

  addBlock(data) {
    const prevBlock = this.blocks[this.blocks.length - 1];
    const newBlock = Block.newBlock(data, prevBlock.hash);
    this.blocks.push(newBlock);
  }
}

module.exports = BlockChain;