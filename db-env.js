const lmdb = require('node-lmdb');

const DB_PATH = __dirname + '/chainDB';

class DBEnv {
  constructor() {
    if (!DBEnv.instance) {
      DBEnv.instance = this;

      this.dbiMap = {
        'chain': null,
        'utxo': null
      };

      this.init();
    }

    return DBEnv.instance;
  }

  init() {
    this.env = new lmdb.Env();

    this.env.open({
      path: DB_PATH,
      mapSize: 2 * 1024 * 1024 * 1024,
      maxDbs: 3
    });
  }

  getDbi(name) {
    if (!this.env) {
      this.init();
    }

    if (!this.dbiMap[name]) {
      this.dbiMap[name] = this.env.openDbi({
        name,
        create: true,
        keyIsString: true
      });
    }

    return this.dbiMap[name];
  }

  getEnv() {
    return this.env;
  }

  exec(dbiName) {
    return (cb) => {
      const dbi = this.getDbi(dbiName);

      const txn = this.env.beginTxn();

      const value = cb && cb(dbi, txn);

      txn.commit();

      // dbi.close();

      return value;
    }
  }

  close() {
    const { chain, utxo } = this.dbiMap;
    chain && chain.close();
    utxo && utxo.close();
    this.dbiMap = {
      chain: null,
      utxo: null
    };
    this.env && this.env.close();
    this.env = null;
  }
}

DBEnv.instance = null;

module.exports = DBEnv;