/**
 * High-performance LRU (Least Recently Used) Cache
 * Implemented using Map + Doubly Linked List for O(1) operations
 * @module cache
 */

/**
 * Doubly Linked List Node for LRU tracking
 */
class CacheNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
    this.timestamp = Date.now();
  }
}

/**
 * LRU Cache with configurable size and TTL
 */
class LRUCache {
  constructor(maxSize = 500, ttl = null) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  /**
   * Gets a value from the cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  get(key) {
    const node = this.cache.get(key);
    
    if (!node) {
      return undefined;
    }

    if (this.ttl && Date.now() - node.timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    this._moveToHead(node);
    return node.value;
  }

  /**
   * Sets a value in the cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   */
  set(key, value) {
    let node = this.cache.get(key);

    if (node) {
      node.value = value;
      node.timestamp = Date.now();
      this._moveToHead(node);
      return;
    }

    node = new CacheNode(key, value);
    this.cache.set(key, node);
    this._addToHead(node);
    this.size++;

    if (this.size > this.maxSize) {
      const removed = this._removeTail();
      this.cache.delete(removed.key);
      this.size--;
    }
  }

  /**
   * Deletes a key from the cache
   * @param {string} key - Cache key
   * @returns {boolean} True if deleted, false if not found
   */
  delete(key) {
    const node = this.cache.get(key);
    
    if (!node) {
      return false;
    }

    this._removeNode(node);
    this.cache.delete(key);
    this.size--;
    return true;
  }

  /**
   * Checks if a key exists in the cache
   * @param {string} key - Cache key
   * @returns {boolean} True if exists and not expired
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * Clears all items from the cache
   */
  clear() {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  /**
   * Gets the current cache size
   * @returns {number} Number of items in cache
   */
  getSize() {
    return this.size;
  }

  /**
   * Moves a node to the head (most recently used)
   * @private
   */
  _moveToHead(node) {
    this._removeNode(node);
    this._addToHead(node);
  }

  /**
   * Adds a node to the head of the list
   * @private
   */
  _addToHead(node) {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Removes a node from the list
   * @private
   */
  _removeNode(node) {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  /**
   * Removes and returns the tail node (least recently used)
   * @private
   */
  _removeTail() {
    const node = this.tail;
    this._removeNode(node);
    return node;
  }
}

export default LRUCache;
