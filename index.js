const bigInt = require('big-integer');
const sha256 = require('sha256');
const moment = require('moment');

const BlockChain = require('./chain');
const POW = require('./pow');

const chain = BlockChain.newBlockChain();
process.stdout.write('\n');
chain.addBlock('My first transaction!');
chain.addBlock('My second transaction!');
process.stdout.write('\n');
chain.blocks.map((block, index) => {
  const {prevBlockHash, data, hash, timeStamp} = block;
  console.log(`Block${index}`);
  console.log(`PrevHash: ${prevBlockHash || '无'}`);
  console.log(`data: ${data}`);
  console.log(`hash: ${hash}`);
  console.log(`createdAt: ${moment(timeStamp).format('YYYY-MM-DD hh:mm:ss')}`);
  console.log(`POW: ${POW.newProofOfWork(block).validate()}`);
  console.log('---------------------------------');
});