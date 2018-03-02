const bigInt = require('big-integer');
const sha256 = require('sha256');

const Transaction = require('./transaction');
const BlockChain = require('./chain');
const ChainIter = require('./chain-iter');
const POW = require('./pow');
const Wallet = require('./wallet');

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
const martin = 'martin';
const yoyo = 'yoyo';
const miner = 'miner';

const transactionPool = [];

function send(from, to, amount, bc) {
   return Transaction.createUTXOTransaction(from, to, amount, bc);
}

const getBalance = (bc) => (address) => {
  let acc = 0;
  return bc.findUTXO(address).then((outs) => {
    outs.forEach((out) => {
      console.log(out);
      acc += out.value;
    });

    console.log(address + "'s balance is: " + acc);

    return Promise.resolve(acc);
  });
}

// BlockChain.newBlockChain(martin).then((chain) => {
//   const getBalanceOnCurrChain = getBalance(chain);

//   send(martin, yoyo, 0, chain).then((tx) => {
//     chain.mineBlock([tx], miner).then(() => {
//       // chain.print();
//       getBalanceOnCurrChain(miner);
//       getBalanceOnCurrChain(martin);
//       getBalanceOnCurrChain(yoyo);
//     });
//   });
// });
const wallet = Wallet.newWallet();
console.log(wallet.privateKey, wallet.privateKey.toString(), wallet.publicKey);