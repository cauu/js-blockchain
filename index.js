const BlockChain = require('./chain');
const bigInt = require('big-integer');
const sha256 = require('sha256');

// console.log(BlockChain.newBlockChain());

// const big = bigInt(1);
// console.log(big);
// console.log(big.shiftLeft(200));
hash = sha256('123');
console.log(hash, typeof hash);
console.log(bigInt(hash, 16));