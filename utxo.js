const lmdb = require('node-lmdb');

const DBEnv = require('./db-env');
const TxOutput = require('./tx-output');
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
        cursor.del && cursor.del();
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
    let validTXs = {};
    const db = new DBEnv();
    const dbOp = db.exec('utxo');

    dbOp((dbi, txn) => {
      const cursor = new lmdb.Cursor(txn, dbi);
      for(let found = cursor.goToFirst(); found != null; found = cursor.goToNext()) {
        const txId = found;
        const vouts = JSON.parse(cursor.getCurrentString(found));
        vouts.forEach((out, outIdx) => {
          if(new TxOutput(out).canBeUnlockWith(address) && acc < amount) {
            acc += out.value;

            if(!validTXs[txId]) {
              validTXs[txId] = [];
            }

            validTXs[txId].push(outIdx);
          }
        });

        if(acc > amount) break;
      }
    });

    return {
      acc,
      validTXs
    };
  }

  findUTXO(address) {
    const db = new DBEnv();
    const dbOp = db.exec('utxo');
    const utxo = [];
    dbOp((dbi, txn) => {
      const cursor = new lmdb.Cursor(txn, dbi);
      for(let found = cursor.goToFirst(); found != null; found = cursor.goToNext()) {
        const txId = found;
        const vouts = JSON.parse(cursor.getCurrentString(found));
        vouts.forEach((out) => {
          if(new TxOutput(out).canBeUnlockWith(address)) {
            utxo.push(new TxOutput(out));
          }
        });
      }
    });

    return utxo;
  }
}

module.exports = UTXOSet;