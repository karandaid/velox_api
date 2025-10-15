/**
 * High-performance Radix Tree implementation for route matching
 * Provides O(log n) route lookups vs O(n) for linear search
 * @module radix-tree
 */

import { validateParam, convertParam, getValidatorTypes } from './validators.js';

const VALIDATOR_TYPES = getValidatorTypes();

/**
 * Radix Tree Node
 */
class RadixNode {
  constructor(prefix = '', isWildcard = false, paramName = null, paramType = null) {
    this.prefix = prefix;
    this.children = new Map();
    this.handler = null;
    this.isWildcard = isWildcard;
    this.paramName = paramName;
    this.paramType = paramType;
    this.isEndpoint = false;
  }
}

/**
 * Radix Tree for ultra-fast route matching
 */
class RadixTree {
  constructor() {
    this.root = new RadixNode();
    this.staticRoutes = new Map();
  }

  /**
   * Inserts a route pattern into the radix tree
   * @param {string} path - Route path (e.g., '/users/:id=number')
   * @param {Function} handler - Route handler function
   */
  insert(path, handler) {
    const segments = this._parsePathSegments(path);
    
    if (segments.every((seg) => !seg.isParam)) {
      this.staticRoutes.set(path, { handler, params: {} });
      return;
    }

    let node = this.root;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (segment.isParam) {
        let childNode = null;
        for (const [, child] of node.children) {
          if (child.isWildcard && child.paramName === segment.name && child.paramType === segment.type) {
            childNode = child;
            break;
          }
        }

        if (!childNode) {
          const key = segment.type ? `:${segment.name}=${segment.type}` : `:${segment.name}`;
          childNode = new RadixNode(
            key,
            true,
            segment.name,
            segment.type
          );
          node.children.set(key, childNode);
        }
        node = childNode;
      } else {
        if (!node.children.has(segment.value)) {
          node.children.set(segment.value, new RadixNode(segment.value));
        }
        node = node.children.get(segment.value);
      }
    }

    node.isEndpoint = true;
    node.handler = handler;
  }

  /**
   * Searches for a matching route in the radix tree
   * @param {string} path - Request path
   * @returns {Object|null} Match result with handler and params
   */
  search(path) {
    if (this.staticRoutes.has(path)) {
      return this.staticRoutes.get(path);
    }

    const segments = path.split('/').filter(Boolean);
    return this._searchNode(this.root, segments, 0, {});
  }

  /**
   * Recursively searches the tree for a matching route
   * @private
   */
  _searchNode(node, segments, index, params) {
    if (index === segments.length) {
      if (node.isEndpoint) {
        return { handler: node.handler, params };
      }
      return null;
    }

    const segment = segments[index];

    const exactChild = node.children.get(segment);
    if (exactChild) {
      const result = this._searchNode(exactChild, segments, index + 1, params);
      if (result) return result;
    }

    const wildcardChildren = [];
    for (const [, child] of node.children) {
      if (child.isWildcard) {
        wildcardChildren.push(child);
      }
    }
    
    wildcardChildren.sort((a, b) => {
      const aHasValidator = a.paramType && VALIDATOR_TYPES.includes(a.paramType);
      const bHasValidator = b.paramType && VALIDATOR_TYPES.includes(b.paramType);
      
      if (aHasValidator && !bHasValidator) return -1;
      if (!aHasValidator && bHasValidator) return 1;
      return 0;
    });
    
    for (const child of wildcardChildren) {
      if (child.paramType && !validateParam(segment, child.paramType)) {
        continue;
      }

      const newParams = { ...params };
      newParams[child.paramName] = convertParam(segment, child.paramType);

      const result = this._searchNode(child, segments, index + 1, newParams);
      if (result) return result;
    }

    return null;
  }

  /**
   * Parses path into segments with parameter metadata
   * @private
   * @param {string} path - Route path
   * @returns {Array} Array of segment objects
   */
  _parsePathSegments(path) {
    const parts = path.split('/').filter(Boolean);
    return parts.map((part) => {
      if (part.startsWith(':')) {
        const paramParts = part.slice(1).split('=');
        const name = paramParts[0];
        const type = paramParts.length > 1 ? paramParts[1] : null;
        return { isParam: true, name, type, value: part };
      }
      return { isParam: false, value: part };
    });
  }

  /**
   * Gets all routes in the tree (for debugging/listing)
   * @returns {Array} Array of route paths
   */
  getAllRoutes() {
    const routes = [...this.staticRoutes.keys()];
    this._collectRoutes(this.root, '', routes);
    return routes;
  }

  /**
   * Recursively collects all routes from the tree
   * @private
   */
  _collectRoutes(node, path, routes) {
    if (node.isEndpoint) {
      routes.push(path || '/');
    }

    for (const [key, child] of node.children) {
      const newPath = path + '/' + key;
      this._collectRoutes(child, newPath, routes);
    }
  }
}

export default RadixTree;
