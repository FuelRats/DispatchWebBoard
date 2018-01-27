import {
  isObject,
  isValidProperty,
} from './Validation.js';


/**
 * Maps included relationship data to the relationship of the main data model.
 *
 * @param   {Object} data Object containing the main data object and included related items.
 * @returns {Object}      Object with data mapped to the data's relationships.
 */
export function mapRelationships(data) {
  // Ensure some level of integrity, just to be safe.
  if (!isObject(data) ||
      !isValidProperty(data, 'data', ['array', 'object'])) {
    throw TypeError('Invalid data model');
  }

  if (!isValidProperty(data, 'included', 'array')) {
    return data;
  }

  const newData = Object.assign({}, data);

  if (Array.isArray(newData.data)) {
    for (const dataItem of newData.data) {
      dataItem.relationships = _mapIncludedToRelationships(dataItem.relationships, newData.included);
    }
  } else if (isObject(newData.data)) {
    newData.data.relationships = _mapIncludedToRelationships(newData.data.relationships, newData.included);
  }

  return newData;
}

/**
 * Finds included data object.
 *
 * @param   {Object}   relRef   relationship reference containing relationship id and type.
 * @param   {Object[]} included Array of included data objects.
 * @returns {Object}            Object matching the relationship reference.
 */
function _findInclude(relRef, included) {
  const includeMatches = included.filter(obj => !obj.id || !obj.type ? false : obj.id === relRef.id && obj.type === relRef.type);
  if (includeMatches.length > 1) {
    window.console.error('fr.user.mapProfileRelationships.findInclude - Multiple matches to included filter: ', includeMatches);
  }
  return includeMatches[0];
}

/**
 * Recursively maps included data to the given relationships.
 *
 * @param   {Object} relationships Relationship object.
 * @param   {Object} included      Data included with the main data.
 * @returns {Object}               Relationship object with mapped included data.
 */
function _mapIncludedToRelationships(relationships, included) {
  if (!isObject(relationships) || !Array.isArray(included)) {
    throw TypeError('Invalid Parameter Types.');
  }

  const newRelationships = {};

  for (const [relType, value] of Object.entries(relationships)) {
    const relContents = Object.assign({}, value);
    const newRelContents = {
      data: {},
    };

    if (relContents.links) { newRelContents.links = relContents.links; }
    if (relContents.meta) { newRelContents.meta = relContents.meta; }

    if (relContents.data) {

      if (isObject(relContents.data)) {
        relContents.data = [relContents.data];
      }

      relContents.data.forEach(relMember => {
        if (relMember.id && relMember.type) {

          const relData = _findInclude(relMember, included);
          if (relData.relationships) {
            relData.relationships = _mapIncludedToRelationships(relData.relationships, included);
          }

          newRelContents.data[relMember.id] = relData;
        }
      });
    }

    newRelationships[relType] = newRelContents;
  }

  return newRelationships;
}