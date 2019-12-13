/**
 * Creates a sort function that sorts an array of objects descending by the value of a property. Takes either a string
 * or a function; either a property name or a function that takes the item and will return the value to sort on.
 * 
 * @example
 * var myArray = [
 *  { id: 7 },
 *  { id: 3 },
 *  { id: 12 }
 * ]
 * 
 * // Call with a property name
 * myArray.sort(descendingBy("id"))
 * 
 * // Or with a function
 * myArray.sort(descendingBy(item => item.id))
 * 
 * // Both ways result in the following array
 * // => [ { id: 12 }, { id: 7 }, { id: 3 } ]
 * 
 * @param {string|function} property - Property name or property derivation function.
 */
exports.descendingBy = function(property) {
  if (typeof property === "function") {
    return function(a, b) {
      let one = property(a);
      let two = property(b);

      if (one > two) {
        return -1;
      } else if (two < one) {
        return 1;
      } else {
        return 0;
      }
    };
  } else if (typeof property === "string") {
    return function(a, b) {
      let one = a[property];
      let two = b[property];

      if (one > two) {
        return -1;
      } else if (two < one) {
        return 1;
      } else {
        return 0;
      }
    };
  } else {
    throw new Error(
      "Property must be either a string or a function. Received " +
        typeof property
    );
  }
};

/**
 * Creates a sort function that sorts an array of objects ascending by the value of a property. Takes either a string
 * or a function; either a property name or a function that takes the item and will return the value to sort on.
 * 
 * @example
 * var myArray = [
 *  { id: 7 },
 *  { id: 3 },
 *  { id: 12 }
 * ]
 * 
 * // Call with a property name
 * myArray.sort(ascendingBy("id"))
 * 
 * // Or with a function
 * myArray.sort(ascendingBy(item => item.id))
 * 
 * // Both ways result in the following array
 * // => [ { id: 3 }, { id: 7 }, { id: 12 } ]
 * 
 * @param {string|function} property - Property name or property derivation function.
 */
exports.ascendingBy = function(property) {
  if (typeof property === "function") {
    return function(a, b) {
      let one = property(a);
      let two = property(b);

      if (one < two) {
        return -1;
      } else if (two > one) {
        return 1;
      } else {
        return 0;
      }
    };
  } else if (typeof property === "string") {
    return function(a, b) {
      let one = a[property];
      let two = b[property];

      if (one < two) {
        return -1;
      } else if (two > one) {
        return 1;
      } else {
        return 0;
      }
    };
  } else {
    throw new Error(
      "Property must be either a string or a function. Received " +
        typeof property
    );
  }
};
