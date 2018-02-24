const bigInt = require('big-integer');
const sha256 = require('sha256');

const BlockChain = require('./chain');
const ChainIter = require('./chain-iter');
const POW = require('./pow');

const level = require('level');

const DB = 'chainDB';

// const chain = BlockChain.newBlockChain();
// process.stdout.write('\n');
// chain.addBlock('My first transaction!');
// chain.addBlock('My second transaction!');
// process.stdout.write('\n');
// chain.blocks.map((block, index) => {
//   const {prevBlockHash, data, hash, timeStamp} = block;
//   console.log(`Block${index}`);
//   console.log(`PrevHash: ${prevBlockHash || '无'}`);
//   console.log(`data: ${data}`);
//   console.log(`hash: ${hash}`);
//   console.log(`createdAt: ${moment(timeStamp).format('YYYY-MM-DD hh:mm:ss')}`);
//   console.log(`POW: ${POW.newProofOfWork(block).validate()}`);
//   console.log('---------------------------------');
// });
const testAddressA = 'martin';
const testAddressB = 'yoyo';

BlockChain.newBlockChain().then((chain) => {
  chain.addBlock().then(() => {
    const iter = new ChainIter(chain);
    iter.next().then((block) => {
      console.log('block', block);
      iter.next().then((block) => {
        console.log('block', block);
        iter.next().then((b) => {
          console.log(b);
        })
      });
    });
  });
});

// const db = level(DB);

// db.get('l').then((value) => {
//   console.log(value);
// });