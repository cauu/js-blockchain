/**
 * @todo
 * change database to https://github.com/Venemo/node-lmdb
 */
module.exports = {
  DB_PATH: 'chainDB',

  DB_BUKETS: {
    CHAIN_STATS: 'chain',
    UTXO_STATS: 'utxos'
  }
};