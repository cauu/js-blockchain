const fs = require('fs');

const Wallet = require('./wallet');
const DBEnv = require('./db-env');

const WALLET_FILE = './wallets.json';

class Wallets {
  constructor() {
    if (!Wallets.instance) {
      this.wallets = this.loadWallets();

      Wallets.instance = this;
    }

    return Wallets.instance;
  }

  getWallet(address) {
    return this.wallets[address];
  }

  newWallet() {
    const wallet = Wallet.newWallet();

    this.wallets[wallet.address] = wallet;

    this.saveWallets();

    return this.wallets[wallet.address];
  }

  saveWallets() {
    try {
      fs.writeFileSync('./wallets.json', JSON.stringify(this.wallets), 'utf8');
    } catch (e) {
      console.log(e);
    }
  }

  loadWallets() {
    try {
      const db = new DBEnv();
      const walletDbOp = db.exec('wallet');

      const rw = JSON.parse(fs.readFileSync('./wallets.json', 'utf8'));
      const wallets = {};

      Object.keys(rw).forEach((add) => {
        wallets[add] = new Wallet(rw[add].privateKey, rw[add].publicKey);
      });

      return wallets;
    } catch (e) {
      console.log(e);
      return {};
    }
  }
}

Wallets.instance = null;

module.exports = Wallets;