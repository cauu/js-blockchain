const BlockChain = require('./chain');
const bigInt = require('big-integer');
const sha256 = require('sha256');

const chain = BlockChain.newBlockChain();
process.stdout.write('\n');
console.log(chain);
chain.addBlock('My first transaction!');
process.stdout.write('\n');
console.log(chain);