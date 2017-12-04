import {
  isObject, 
  isValidProperty
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

  if (Array.isArray(data.data)) {
    for (let dataItem of data.data) {
      dataItem.relationships = _mapRelationshipItems(dataItem.relationships, data.included);
    }
  } else if (isObject(data.data)) {
    data.data.relationships = _mapRelationshipItems(data.data.relationships, data.included);
  }
  
  return data;
}

/**
 * Finds included data object.
 *
 * @param   {Object}   relRef   relationship reference containing relationship id and type.
 * @param   {Object[]} included Array of included data objects.
 * @returns {Object}            Object matching the relationship reference. 
 */
function _findInclude(relRef, included) {
  let includeMatches = included.filter(obj => !obj.id || !obj.type ? false : obj.id === relRef.id && obj.type === relRef.type);
  if (includeMatches.length > 1) { 
    window.console.error('fr.user.mapProfileRelationships.findInclude - Multiple matches to included filter: ', includeMatches);
  }
  return includeMatches[0];
}

/**
 * Recursively maps included data to the given relationship data.
 *
 * @param   {Object} relationships Relationship object.
 * @param   {Object} included      Data included with the main data.
 * @returns {Object}               Relationship object with mapped included data.
 */
function _mapRelationshipItems(relationships, included) {

  if (!isObject(relationships) || !Array.isArray(included)) { throw TypeError('Invalid Parameter Types.'); }

  for (let relationship of Object.values(relationships)) {

    if (Array.isArray(relationship.data) && relationship.data.length > 0) {
      for (let relMember of Object.values(relationship.data)) {
        if (relMember && relMember.id && relMember.type) {
          relationship[relMember.id] = _findInclude(relMember, included);
          if (relationship[relMember.id].relationships) {
            relationship[relMember.id].relationships = _mapRelationshipItems(relationship[relMember.id].relationships, included);
          }
        }
      }
    } else if (isObject(relationship.data)) {

      let relMember = relationship.data;
      if (relMember && relMember.id && relMember.type) {
        relationship[relMember.id] = _findInclude(relMember, included);
        if (relationship[relMember.id].relationships) {
          relationship[relMember.id].relationships = _mapRelationshipItems(relationship[relMember.id].relationships, included);
        }
      }
    }

    delete relationship.data;

  }
  return relationships;
}