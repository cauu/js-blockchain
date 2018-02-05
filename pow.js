const bigInt = require('big-integer');
/**
 * pow算法会在创建区块之前执行，
 * 通过pow算法才算创建了一个有效的区块
 * 其他的共识算法发生作用的时间是类似的(pos, dpos)
 * 比如ae采用pos+pow算法来实现共识
 * 
 * pow算法的原理就是用撞库的方式不断寻找一个小于给定target的过程
 */
const target = 16;

class POW {
  constructor() {
  }

  static newProofOfWork(block) {
    const big = bigInt(1);
  }

  /**
   * @desc
   * 创建新区块的时候需要先调用run函数，
   * 找到那个正确的nonce，
   * 才能成功创建区块
   */
  run() {
  }
}

module.exports = POW;