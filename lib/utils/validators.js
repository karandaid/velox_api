/**
 * Parameter type validators for typed route parameters
 * All validators use pre-compiled RegExp for maximum performance
 * @module validators
 */

const VALIDATORS = {
  number: /^-?\d+(\.\d+)?$/,
  int: /^-?\d+$/,
  float: /^-?\d+\.\d+$/,
  alpha: /^[a-zA-Z]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  phone: /^\+?\d{1,15}$/,
  ip: /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/,
  hex: /^[a-fA-F0-9]+$/,
  version: /^v\d+$/,
  boolean: /^(true|false|1|0)$/,
};

/**
 * Validates a parameter value against a specific type
 * @param {string} value - The value to validate
 * @param {string} type - The type to validate against
 * @returns {boolean} True if valid, false otherwise
 */
export function validateParam(value, type) {
  const validator = VALIDATORS[type];
  if (!validator) {
    return true;
  }
  return validator.test(value);
}

/**
 * Converts a validated parameter to its appropriate JavaScript type
 * @param {string} value - The parameter value
 * @param {string} type - The parameter type
 * @returns {*} Converted value
 */
export function convertParam(value, type) {
  switch (type) {
    case 'number':
    case 'int':
    case 'float':
      return Number(value);
    case 'boolean':
      return value === 'true' || value === '1';
    default:
      return value;
  }
}

/**
 * Get all available validator types
 * @returns {string[]} Array of validator type names
 */
export function getValidatorTypes() {
  return Object.keys(VALIDATORS);
}

export default {
  validateParam,
  convertParam,
  getValidatorTypes,
};
