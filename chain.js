const level = require('level');

const Block = require('./block');
const ChainIter = require('./chain-iter');
const Transaction = require('./transaction');

const DB = 'chainDB';

const testAddress = 'martin';

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
  static newBlockChain(address) {
    const db = level(DB);
    
    return db.get('l')
      .then(() => {
        return Promise.resolve(new BlockChain(db));
      })
      .catch((e) => {
        const genesis = BlockChain.newGenesisBlock(address);

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
  static newGenesisBlock(address) {
    const coinBaseTx = Transaction.createCoinbaseTransaction(address);

    return Block.newBlock([coinBaseTx], "");
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

  iterator() {
    return ChainIter(this);
  }

  /**
   * @todo 将所有的txs打包到区块中
   */
  addBlock(txs) {
    return this.getLastHash()
      .then((hash) => {
        const coinBaseTx = Transaction.createCoinbaseTransaction(testAddress);

        const newBlock = Block.newBlock([coinBaseTx], hash);

        return this.db.put(newBlock.hash, newBlock.serialize())
          .then(() => {
            return this.db.put('l', newBlock.hash).then(() => Promise.resolve());
          })
        ;
      })
    ;
  }

  findUnspentTransactions(address) {
    const unspentTXs = [];
    const spentTXOs = {};
    const bci = this.iterator();

    while(true) {
      const block = bci.next();

      for(let i = 0; i < block.transactions.length; i++) {
        const tx = block.transactions[i];

        /**
         * @desc 找到所有未被包含到input中的output
         */
        tx.vout.forEach((out, idx) => {
          if(!!spentTXOs[tx.id]) {
            for(let j = 0; j < spentTXOs[tx.id]; j++) {
              if(spentTXOs[tx.id][j] === idx) {
                return;
              }
            }
          }

          if(out.canBeUnlockWith(address)) {
            unspentTXs.push(tx);
          }
        });

        if(!tx.isCoinbase()) {
          tx.vin.forEach((tin) => {
            if(tin.canBeUnlockWith(address)) {
              if(!spentTXOs[tx.id]) {
                spentTXOs[tx.id] = [];
              }

              spentTXOs[tx.id].push(tin.vout);
            }
          });
        }

        if(!block.prevBlockHash) {
          break;
        }
      }
    }
    return unspentTXs;
  }

  findUTXO(address) {
    const UTXOs = [];

    this.findUnspentTransactions(address).forEach((utx) => {
      utx.vout.forEach((out) => {
        if(out.canBeUnlockWith(address)) {
          UTXOs.push(out);
        }
      });
    });

    return UTXOs;
  }

  findSpendableOutputs(address, amount) {
    /**
     * @todo 找到address对应的用户所有可消耗的output
     */
    const utxs = this.findUnspentTransactions(address);
    let acc = 0;
    let validTXs = {};

    for(let i = 0; i < utxs.length; i++) {
      utxs[i].vout.forEach((out, outIdx) => {
        if(out.canBeUnlockWith(address) && acc < amount) {
          acc += utxo[i].value;

          if(!validTXs[utxs[i].id]) {
            validTXs[utxs[i].id] = [];
          }

          validTXs[utxs[i].id].push(outIdx);
        }
      });

      if(acc > amount) break;
    }

    return {
      acc,
      validTXs
    };
  }
}

module.exports = BlockChain;