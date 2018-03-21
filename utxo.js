const lmdb = require('node-lmdb');

const DBEnv = require('./db-env');
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
    /**
     * @todo 
     * 1. 清空db
     * 2. 找到所有utxo
     * 3. 保存到db
     */
    const db = new DBEnv();
    const utxoDbOp = db.exec('utxo');

    utxoDbOp((dbi, txn) => {
      const cursor = new lmdb.Cursor(txn, dbi);

      for(let found = cursor.goToFirst(); found !== null; found = cursor.goToNext()) {
        cursor.del();
      }
    });

    const utxos = this.chain.findUTXONew();

    Object.keys(utxos).map((txId) => {
      utxoDbOp((dbi, txn) => {
        txn.putString(dbi, txId, JSON.stringify(utxos[txId]));
      });
    });

    return utxos;
  }

  findSpendableOuputs(address, amount) {
    /**
     * @desc
     * {[txId]: [...outputIndexs]}
     */
    const unspentOutputs = {};
    let acc = 0;
    const db = new DBEnv();
    const dbOp = db.exec('utxo');

    dbOp((dbi, txn) => {
      const cursor = new lmdb.Cursor(txn, dbi);
      for(let found = cursor.goToFirst(); found != null; found = cursor.goToNext()) {
        const txId = found;
        const vouts = JSON.parse(cursor.getCurrentString(found));
        // console.log(vouts);
      }
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