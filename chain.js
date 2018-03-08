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

    return Block.newBlock([coinBaseTx], '');
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
    return new ChainIter(this);
  }

  print() {
    const bci = this.iterator();

    function printCurrent(block) {
      console.log(block);
      block.transactions.forEach((tx) => {
        console.log(tx);
      });
      console.log('*****************************');
    };

    bci.foreach(printCurrent);
  }

  /**
   * @todo 挖矿
   * @param {array} txs 需要打包的交易信息
   * @param {string} address 矿工的地址
   */
  mineBlock(txs = [], address) {
    return this.getLastHash()
      .then((hash) => {
        /**
         * @desc
         * 首先校验每一笔交易的合法性，不合法的交易不会被打包到区块中去
         */
        const verifyPromise = Promise.all(txs.map((tx) => this.verifyTransaction(tx))).then((validations) => {
          const verifiedTxs = [];

          validations.forEach((v, index) => {
            if(!!v) {
              verifiedTxs.push(txs[index]);
            } else {
              console.log(txs[index].id, ' is invalid.');
            }
          });

          const coinBaseTx = Transaction.createCoinbaseTransaction(address);

          const newBlock = Block.newBlock([coinBaseTx, ...verifiedTxs], hash);

          return this.db.put(newBlock.hash, newBlock.serialize())
            .then(() => {
              return this.db.put('l', newBlock.hash).then(() => Promise.resolve());
            })
          ;
        });
      })
    ;
  }

  findTransactionsById(ids = []) {
    const transactions = {};
    const bci = this.iterator();

    return bci.foreach((block) => {
      for(let i = 0; i < block.transactions.length; i++) {
        for(let j = 0; j < ids.length; j++) {
          if(block.transactions[i].id === ids[j]) {
            transactions[ids[j]] = block.transactions[i];
            return;
          }
        }
      }
    }).then(() => transactions);
  }

  /**
   * @desc
   * 找到所有的transactions并对他们进行签名
   */
  signTransaction(tx, privateKey) {
    const prevIds = tx.vin.map((txin) => {
      return txin.txId;
    });

    return this.findTransactionsById(prevIds);
  }

  verifyTransaction(tx) {
    const prevIds = tx.vin.map((txin) => {
      return txin.txId;
    });

    return this.findTransactionsById(prevIds).then((prevTxs) => {
      return tx.verify(prevTxs);
    });
  }

  /**
   * @desc
   * 查询可用的output并不需要用户的签名
   */
  findUnspentTransactions(address) {
    const unspentTXs = [];
    const spentTXOs = {};
    const bci = this.iterator();

    return bci.foreach((block) => {
      for(let i = 0; i < block.transactions.length; i++) {
        const tx = block.transactions[i];

        /**
         * @desc 找到所有未被包含到input中的output
         */
        tx.vout.forEach((out, idx) => {
          if(!!spentTXOs[tx.id]) {
            for(let j = 0; j < spentTXOs[tx.id].length; j++) {
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
            if(tin.canUnlockOutputWith(address)) {
              if(!spentTXOs[tin.txId]) {
                spentTXOs[tin.txId] = [];
              }

              spentTXOs[tin.txId].push(tin.vout);
            }
          });
        }
      }
    }).then(() => {
      return unspentTXs;
    });
  }

  findUTXO(address) {
    const UTXOs = [];

    return this.findUnspentTransactions(address).then((utxs) => {
      utxs.forEach((utx) => {
        utx.vout.forEach((out) => {
          if(out.canBeUnlockWith(address)) {
            UTXOs.push(out);
          }
        });
      });

      return Promise.resolve(UTXOs);
    });
  }

  findSpendableOutputs(address, amount) {
    /**
     * @todo 找到address对应的用户所有可消耗的output
     */
    return this.findUnspentTransactions(address).then((utxs) => {
      let acc = 0;
      let validTXs = {};

      for(let i = 0; i < utxs.length; i++) {
        utxs[i].vout.forEach((out, outIdx) => {
          if(out.canBeUnlockWith(address) && acc < amount) {
            acc += out.value;

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
    });
  }
}

module.exports = BlockChain;