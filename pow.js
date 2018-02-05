const bigInt = require('big-integer');
/**
 * pow算法会在创建区块之前执行，
 * 通过pow算法才算创建了一个有效的区块
 * 其他的共识算法发生作用的时间是类似的(pos, dpos)
 * 比如ae采用pos+pow算法来实现共识
 * 
 * pow算法的原理就是用撞库的方式不断寻找一个小于给定target的过程
 */
const targetBits = 16;

class POW {
  constructor(block, targetNonce) {
    this.block = block;
    this.targetNonce = targetNonce;
  }

  static newProofOfWork(block) {
    const big = bigInt(1);
    big.shiftLeft(256 - targetBits);

    return new POW(block, big);
  }

  prepareData(nonce) {
    return pow.block.prevBlockHash
      + pow.block.data
      + pow.block.timeStamp
      + targetBits
      + nonce
    ;
  }

  /**
   * @desc
   * 创建新区块的时候需要先调用run函数，
   * 找到那个正确的nonce，
   * 才能成功创建区块
   */
  run() {
    let nonce = 0;
    while(nonce < Number.MAX_VALUE) {
      const data = this.prepareData(nonce);
      const hash = sha256(data);
      /**
       * @todo 
       * sha256的结果转化为bigint
       */
      if(targetNonce.greater(bigInt(hash, 16))) {
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