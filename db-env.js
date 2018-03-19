const lmdb = require('node-lmdb');

const DB_PATH = __dirname + '/chainDB';

class DBEnv {
  constructor() {
    if(!DBEnv.instance) {
      DBEnv.instance = this;

      this.init();
    }

    return DBEnv.instance;
  }

  init() {
    this.env = new lmdb.Env();

    this.env.open({
      path: DB_PATH,
      mapSize: 2 * 1024 * 1024,
      maxDbs: 3
    });
  }

  getDbi(name) {
    if(!this.env) {
      this.init();
    }

    return this.env.openDbi({
      name,
      create: true,
      keyIsString: true
    });
  }

  getEnv() {
    return this.env;
  }

  exec(dbiName) {
    // const dbi = this.getDbi(dbiName);
    return (cb) => {
      const dbi = this.getDbi(dbiName);

      const txn = this.env.beginTxn();

      const value = cb && cb(dbi, txn);

      txn.commit();

      dbi.close();
      
      return value;
    }
  }

  close() {
    this.env && this.env.close();
    this.env = null;
  }
}

DBEnv.instance = null;

module.exports = DBEnv;