/**
 * Merges given arrays and de-dupes the result.
 *
 * @param   {*[]}    array Originating array.
 * @param   {...*[]} args  Arrays to concatenate
 * @returns {*[]}          Merged array with no duplicate entries.
 */
export function concatUnique(array, ...args) {
  return array.concat(...args).filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
} 