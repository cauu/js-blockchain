const level = require('level');
const lmdb = require('node-lmdb');

const Block = require('./block');
const ChainIter = require('./chain-iter');
const Transaction = require('./transaction');
const DBEnv = require('./db-env');

const { DB_PATH, DB_BUKETS } = require('./config');

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
    // const db = level(DB_PATH);
    const db = new DBEnv();

    const chainDbOp = db.exec('chain');

    const lastHash = chainDbOp((dbi, txn) => txn.getString(dbi, 'l'));

    if(!lastHash) {
      const genesis = BlockChain.newGenesisBlock(address);

      chainDbOp((dbi, txn) => txn.putString(dbi, 'l', genesis.hash));
      chainDbOp((dbi, txn) => txn.putString(dbi, genesis.hash, genesis.serialize()));
    }

    db.close();

    return new BlockChain(db);
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
    const chainDbOp = this.db.exec('chain');

    const blockStr = chainDbOp((dbi, txn) => txn.getString(dbi, hash));

    this.db.close();

    return Block.deserializeBlock(blockStr);
  }

  getLastHash() {
    const chainDbOp = this.db.exec('chain');

    const lastHash = chainDbOp((dbi, txn) => txn.getString(dbi, 'l'));

    this.db.close();

    return lastHash;
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
    const hash = this.getLastHash();

    const chainDbOp = this.db.exec('chain');

    /**
     * @desc
     * 首先校验每一笔交易的合法性，不合法的交易不会被打包到区块中去
     */
    const validations =  txs.map((tx) => this.verifyTransaction(tx));

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

    chainDbOp((dbi, txn) => txn.putString(newBlock.hash, newBlock.serialize()));

    chainDbOp((dbi, txn) => txn.putString('l', newBlock.hash));

    return newBlock;
  }

  /**
   * @todo
   * 该函数需要遍历所有的transactions
   * 效率也很低
   */
  findTransactionsById(ids = []) {
    const transactions = {};
    const bci = this.iterator();

    bci.foreach((block) => {
      for(let i = 0; i < block.transactions.length; i++) {
        for(let j = 0; j < ids.length; j++) {
          if(block.transactions[i].id === ids[j]) {
            transactions[ids[j]] = block.transactions[i];
            return;
          }
        }
      }
    });

    return transactions;
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

    const prevTxs = this.findTransactionsById(prevIds);

    return tx.verify(prevTxs);
  }

  /**
   * @desc
   * 查询可用的output并不需要用户的签名
   * @todo
   * 此处需要遍历所有的blocks和transactions
   * 随着区块长度的增加，效率变得越来越低
   */
  findUnspentTransactions(address) {
    const unspentTXs = [];
    const spentTXOs = {};
    const bci = this.iterator();

    bci.foreach((block) => {
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
    });

    return unspentTXs;
  }

  findUnspentTransactionsNew() {
    const unspentTXs = [];
    const spentTXOs = {};
    const bci = this.iterator();

    bci.foreach((block) => {
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

          // if(out.canBeUnlockWith(address)) {
          unspentTXs.push(tx);
          // }
        });

        if(!tx.isCoinbase()) {
          tx.vin.forEach((tin) => {
            // if(tin.canUnlockOutputWith(address)) {
            if(!spentTXOs[tin.txId]) {
              spentTXOs[tin.txId] = [];
            }

            spentTXOs[tin.txId].push(tin.vout);
            // }
          });
        }
      }
    });

    return unspentTXs;
  }

  findUTXONew() {
    const UTXOs = {};

    this.findUnspentTransactionsNew().forEach((utxs) => {
      utxs.forEach((utx) => {
        utx.vout.forEach((out) => {
          if(!UTXOs[utx.id]) {
            UTXOs[utx.id] = [];
          }

          UTXOs[utx.id].push(out);
        });
      });
    });

    return UTXOs;
  }

  findUTXO(address) {
    const UTXOs = [];

    const utxs = this.findUnspentTransactions(address);

    utxs.forEach((utx) => {
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
    const utxs = this.findUnspentTransactions(address)
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
  }
}

module.exports = BlockChain;