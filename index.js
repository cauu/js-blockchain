const bigInt = require('big-integer');
const sha256 = require('sha256');
const Base58 = require('bs58');
const EC = require('elliptic').ec;
const ec = new EC('p256');
const Signature = EC.Signature;

const Transaction = require('./transaction');
const BlockChain = require('./chain');
const ChainIter = require('./chain-iter');
const POW = require('./pow');
const Wallet = require('./wallet');
const Wallets = require('./wallets');
const MerkleTree = require('./merkle-tree');
const UTXO = require('./utxo');

const level = require('level');

const DB = 'chainDB';

const transactionPool = [];

function send(from, to, amount, bc) {
   return Transaction.createUTXOTransaction(from, to, amount, bc);
}

const getBalance = (bc) => (address) => {
  let acc = 0;
  return bc.findUTXO(address).then((outs) => {
    outs.forEach((out) => {
      acc += out.value;
    });

    console.log(address + "'s balance is: " + acc);

    return Promise.resolve(acc);
  });
}

function createWallet() {
  return new Wallets().newWallet();
}

/**
 * @description
 * 首先创建钱包，才能得到这些地址
 */
const address1 = '1WbB7DGHufFWjfv3UTpnDHW2eHNw1je';
const address2 = '1yS1Cmg38cg3tPQwJJcdnhhpBXtEykh';
const address3 = '1Cf9vcDdKUgR2scveiXJqA2xNRj2wP5';

const myWallet = createWallet();
const targetWallet = createWallet();
const minerWallet = createWallet();

BlockChain.newBlockChain(address1).then((chain) => {
  const getBalanceOnCurrChain = getBalance(chain);

  send(address3, address2, 5, chain).then((tx) => {
    chain.mineBlock([tx], address3).then(() => {
      getBalanceOnCurrChain(address1);
      getBalanceOnCurrChain(address2);
      getBalanceOnCurrChain(address3);
    });
  });
});

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
