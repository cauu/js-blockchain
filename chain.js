const level = require('level');

const Block = require('./block');

const DB = 'chainDB';

/**
 * @todo
 * 对数据进行持久化处理,
 * 在我们的原型中，我们只保存两种数据:
 * l: 对应最后一个区块的hash
 * hash: byte(block) 区块的hash和对应的二进制数据
 */
class BlockChain {
  constructor(db) {
    this.db = db;
  }

  /**
   * @desc
   */
  static newBlockChain() {
    const db = level(DB);
    
    return db.get('l')
      .then(() => {
        return Promise.resolve(new BlockChain(db));
      })
      .catch((e) => {
        const genesis = BlockChain.newGenesisBlock();

        return db.put('l', genesis.hash)
          .then(() => {
            return db.put(genesis.hash, genesis.serialize());
          })
          .then(() => {
            return Promise.resolve(new BlockChain(db));
          })
        ;
      })
    ;
  }

  /**
   * @desc
   * 创建一个新的block
   */
  static newGenesisBlock() {
    return Block.newBlock("GenesisBlock", "");
  }

  getBlock(hash) {
    return this.db.get(hash)
      .then((block) => {
        return Promise.resolve(Block.deserializeBlock(block));
      })
      .catch((e) => {
        return Promise.reject(e);
      })
    ;
  }

  getLastHash() {
    return this.db.get('l')
      .then((lastHash) => {
        return Promise.resolve(lastHash);
      })
      .catch((e) => {
        return e;
      })
    ;
  }

  addBlock(data) {
    return this.getLastHash()
      .then((hash) => {
        const newBlock = Block.newBlock(data, hash);
        this.db.put(newBlock.hash, newBlock.serialize())
          .then(() => {
            return this.db.put('l', newBlock.hash).then(() => Promise.resolve());
          })
        ;
      })
    ;
  }
}

module.exports = BlockChain;