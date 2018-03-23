const bigInt = require('big-integer');
const sha256 = require('sha256');
const Base58 = require('bs58');
const EC = require('elliptic').ec;
const ec = new EC('p256');
const Signature = EC.Signature;

const Chain = require('./chain');
const Transaction = require('./transaction');
const BlockChain = require('./chain');
const ChainIter = require('./chain-iter');
const POW = require('./pow');
const Wallet = require('./wallet');
const Wallets = require('./wallets');
const MerkleTree = require('./merkle-tree');
const UTXO = require('./utxo');
const DBEnv = require('./db-env');

const level = require('level');

const DB = 'chainDB';

const transactionPool = [];

function send(from, to, amount, utxo) {
  return Transaction.createUTXOTransaction(from, to, amount, utxo);
}

const getBalance = (utxo) => (address) => {
  let acc = 0;

  const outs = utxo.findUTXO(address);
  outs.forEach((out) => {
    acc += out.value;
  });

  return acc;
}

function createWallet() {
  return new Wallets().newWallet();
}

/**
 * @description
 * 首先创建钱包，才能得到这些地址
 */
const address1 = '1nXgNDapQ2MbQHsLS3uEn6qAjm8xXGQ';
const address2 = '1bqTkYuWTHeYbDpeAjFJd2d48RkUAxq';
// const address3 = '1Cf9vcDdKUgR2scveiXJqA2xNRj2wP5';

// const myWallet = createWallet();
// const targetWallet = createWallet();
// const minerWallet = createWallet();

// BlockChain.newBlockChain(address1).then((chain) => {
//   const getBalanceOnCurrChain = getBalance(chain);

//   send(address3, address2, 5, chain).then((tx) => {
//     chain.mineBlock([tx], address3).then(() => {
//       getBalanceOnCurrChain(address1);
//       getBalanceOnCurrChain(address2);
//       getBalanceOnCurrChain(address3);
//     });
//   });
// });

// BlockChain.newBlockChain(address1).then((chain) => {
//   const utxo = new UTXO(chain);
//   utxo.reIndex();
//   utxo.findSpendableOuputs()
//     .then(() => {
//     })
//     .catch((e) => {
//       console.log(e);
//     })
//   ;
// });

const chain = Chain.newBlockChain(address1);
const u = new UTXO(chain);

const tx = send(address1, address2, 10, u);
chain.mineBlock([tx], address2);
u.reIndex();
console.log(getBalance(u)(address1));
console.log(getBalance(u)(address2));
new DBEnv().close();
// u.reIndex();
// const tx = send(address1, address2, 5, chain);
// chain.mineBlock([tx], address2);
// u.reIndex();
// console.log(getBalance(u)(address1));
// console.log(getBalance(u)(address2));