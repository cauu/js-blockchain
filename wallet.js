const RIPEMD160 = require('ripemd160');
const sha256 = require('sha256');
const Base58 = require('bs58');
const EC = require('elliptic').ec;

const ec = new EC('p256');

const ADDRESS_CHECKSUM_LEN = 4;
const VERSION = '00';

/**
 * @description
 * 比特币钱包地址生成步骤:
 * 1. 通过elliptic算法生成一对(privateKey, pub (x, y))
 * 2. 将publicKey的x, y拼装起来得到(privateKey, publicKey)
 * 3. 使用ripemd160 + sha256算法生成publicKeyHash
 * 4. 对publicKeyHash调用sha256算法得到checksum
 * 5. Base58Encode(version + publicKeyHash + checksum) === address
 * Q: 为什么要采用该算法来生成地址?
 * checksum可以用来校验传输过程中数据的完整和准确性，因此如果一个人想对比特币系统发动中间人
 * 攻击,他不仅要破解publicKeyHash，还需要破解publicKeyHash对应的publicKey
 * 
 */
function generateKeyPairs() {
  return ec.genKeyPair();
}

class Wallet {
  static newWallet() {
    const keyPair = generateKeyPairs();
    const pubKey = keyPair.getPublic();
    return new Wallet(
      keyPair.getPrivate().toString('hex'),
      pubKey.getX().toString('hex') + pubKey.getY().toString('hex')
    );
  }

  constructor(privateKey, publicKey) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.address = this.getAddress();
  }

  getAddress() {
    try {
      const publicKeyHash = Wallet.hashPubKey(this.publicKey);
      const versionPayload = VERSION + publicKeyHash;
      const checksum = Wallet.checksum(versionPayload);

      const fullPayload = versionPayload + checksum;

      return Base58.encode(Buffer.from(fullPayload, 'hex'));
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * @desc ripemd160 + sha256算法
   */
  static hashPubKey(pubKey) {
    const publicSHA256 = sha256(pubKey);

    const ripemd160Hash = new RIPEMD160().update(pubKey).digest('hex');

    return ripemd160Hash;
  }

  static checksum(payload) {
    const firstSHA = sha256(payload);
    const secondSHA = sha256(firstSHA);

    return secondSHA.slice(-ADDRESS_CHECKSUM_LEN);
  }
}

module.exports = Wallet;