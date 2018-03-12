const level = require('level');
const rimraf = require('rimraf');

const { DB_PATH, DB_BUKETS } = require('./config');

/**
 * @desc
 * 由于交易中，我们常常会需要去查找用户可用的transaction，
 * 因此单独实现一个类，为unspent transactions建立索引
 * @todo 
 * 以下方法需要更改:
 * chain.Prototype.findUnspentTransactions
 * chain.Prototype.findUTXO
 * chain.Prototype.findSpendableOutputs
 */
class UTXOSet {
  constructor(bc) {
    this.chain = bc;
  }

  /**
   * @desc
   * 重新建立索引
   * @todo 
   * 1. 清空db
   * 2. 找到所有utxo
   * 3. 保存到db
  **/
  reIndex() {
    rimraf.sync(`./${DB}`);
    /**
     * @todo 
     * 1. 清空db
     * 2. 找到所有utxo
     * 3. 保存到db
     */
    const utxoDB = level(DB);

    return this.chain.findUTXONew((utxos) => {
      return Promise.all(Object.keys(utxos).map((txId) => {
        return utxoDB.put(txId, JSON.stringify(utxos[txId]));
      })).then((result) => {
        return utxoDB.close();
      });
    });
  }

  findSpendableOuputs(address, amount) {
    /**
     * @desc
     * {[txId]: [...outputIndexs]}
     */
    const unspentOutputs = {};
    let acc = 0;
    const db = level(DB);

    return new Promise((resolve, reject) => {
      db.createReadStream()
        .on('data', ({ txId, rawOuts }) => {
          return resove('txId', txId);
        })
        .on('error', (err) => {
          return reject(err);
        })
        .on('close', () => {
        })
        .on('end', () => {
          resolve('')
        })
      ;
    });
  }

  findUTXO(address) {
    const db = level(DB);
    const UTXOs = [];

    return new Promise((resolve, reject) => {
      db.createReadStream()
        .on('data', ({ }) => {
        })
        .on('error', (err) => {
          reject(err);
        })
        .on('close', () => {
        })
        .on('end', () => {
          resolve('')
        })
      ;
    });
  }
}

module.exports = UTXOSet;