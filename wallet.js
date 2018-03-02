const RIPEMD160 = require('ripemd160');
const sha256 = require('sha256');
const EC = require('elliptic').ec;

const ec = new EC('p256');

/**
 * @description
 * 比特币钱包地址生成步骤:
 * 1. 通过elliptic算法生成一对(privateKey, pub (x, y))
 * 2. 将publicKey的x, y拼装起来得到(privateKey, publicKey)
 * 3. 使用ripemd160 + sha256算法生成publicKeyHash
 * 4. 对publicKeyHash调用sha256算法得到checksum
 * 5. Base58Encode(version + publicKeyHash + checksum) === address
 */
function generateKeyPairs() {
  return ec.genKeyPair();
}

class Wallet {
  static newWallet() {
    const keyPair = generateKeyPairs();
    return new Wallet(keyPair.getPrivate(), keyPair.getPublic());
  }

  constructor(privateKey, publicKey) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  getAddress() {
  }

  hashPubKey() {
  }

  checksum() {
  }
}

module.exports = Wallet;
