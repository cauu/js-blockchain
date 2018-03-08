const bigInt = require('big-integer');
const sha256 = require('sha256');
/**
 * pow算法会在创建区块之前执行，
 * 通过pow算法才算创建了一个有效的区块
 * 其他的共识算法发生作用的时间是类似的(pos, dpos)
 * 比如ae采用pos+pow算法来实现共识
 * 
 * 比特币用到的pow算法的原理就是用撞库的方式不断寻找一个小于给定target的过程
 */
const targetBits = 8;

class POW {
  constructor(block, targetNonce) {
    this.block = block;
    this.targetNonce = targetNonce;
  }

  static newProofOfWork(block) {
    const big = bigInt(1).shiftLeft(256 - targetBits);

    return new POW(block, big);
  }

  prepareData(nonce) {
    return this.block.prevBlockHash
      + this.block.data
      + this.block.timeStamp
      + targetBits
      + nonce
    ;
  }

  validate() {
    const data = this.prepareData(this.block.nonce);
    const hash = sha256(data);

    return this.targetNonce.greater(bigInt(hash, 16));
  }

  /**
   * @desc
   * 创建新区块的时候需要先调用run函数，
   * 找到那个正确的nonce，
   * 才能成功创建区块
   */
  run() {
    let nonce = 0;
    let hash;
    while(nonce < Number.MAX_VALUE) {
      const data = this.prepareData(nonce);
      hash = sha256(data);
      /**
       * @todo 
       * sha256的结果转化为bigint
       */
      process.stdout.write(`正在计算: ${hash}\r`);
      if(this.targetNonce.greater(bigInt(hash, 16))) {
        break;
      } else {
        nonce++;
      }
    }

    return {
      nonce,
      hash
    };
  }
}

module.exports = POW;