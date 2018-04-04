const sha256 = require('sha256');

/**
 * @param {MerkleNode} left 左子树
 * @param {MerkleNode} right 右子树
 * @param {string} data 节点数据
 **/
class MerkleNode {
  constructor(left = null, right = null, data = '') {
    if (!left && !right) {
      this.data = sha256(data);
    } else {
      this.data = sha256(left.data + right.data);
    }

    this.left = left;
    this.right = right;
  }
}

class MerkleTree {
  static newMerkleTree(data = []) {
    let nodes = [];

    if (data.length % 2 !== 0) {
      data.push(data[data.length - 1]);
    }

    /**
     * @desc 生成所有叶子节点
    */
    data.forEach((d) => {
      nodes.push(new MerkleNode(null, null, d));
    });

    /**
     * @desc 
     * 不同于其他的二叉树,
     * merkle tree的生成是一个逆向的过程,
     * 即先有叶子节点，才有根节点,
     * 传入的所有data都是叶子节点的数据。
     * question:
     * i < data.length / 2是如何得到的?
     */
    for (let i = 0; i < data.length / 2; i++) {
      const currLevel = [];

      for (let j = 0; j < nodes.length; j += 2) {
        let node;
        if (!nodes[j + 1]) {
          node = new MerkleNode(nodes[j], nodes[j], null);
        } else {
          node = new MerkleNode(nodes[j], nodes[j + 1], null);
        }
        currLevel.push(node);
      }

      nodes = currLevel;
    }

    return new MerkleTree(nodes[0]);
  }

  constructor(root = null) {
    this.root = root;
  }
}

module.exports = MerkleTree;