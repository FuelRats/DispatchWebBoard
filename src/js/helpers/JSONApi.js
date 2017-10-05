import {isObject, isValidProperty} from './Validation.js';

/**
 * Maps included relationship data to the relationship of the main data model.
 *
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
export function mapRelationships(data) {
  // Ensure data integrity, just to be safe.
  if (!isObject(data) || 
      !isValidProperty(data, 'data', ['array','object']) || 
      !isValidProperty(data,'included', 'array')) {
    throw TypeError('Invalid data model');
  }

  function findInclude(member, included) {
    let includeMatches = included.filter(obj => !obj.id || !obj.type ? false : obj.id === member.id && obj.type === member.type);
    if (includeMatches.length > 1) { 
      window.console.error('fr.user.mapProfileRelationships.findInclude - Multiple matches to included filter: ', includeMatches);
    }
    return includeMatches[0];
  }

  function mapRelationshipItems(relationships, included) {
    if(!isObject(relationships) || !Array.isArray(included)) { throw TypeError('Invalid Parameters'); }

    for(let relType in relationships) {
      if(!relationships.hasOwnProperty(relType)) { continue; }

      if(Array.isArray(relationships[relType].data) && relationships[relType].data.length > 0) {
        let typeMembers = relationships[relType].data;
        for (let i = 0; i < typeMembers.length; i += 1) {
          let member = typeMembers[i];
          if(member && member.id && member.type) {
            relationships[relType][member.id] = findInclude(member, included);
            if (relationships[relType][member.id].hasOwnProperty('relationships')) {
              relationships[relType][member.id].relationships = mapRelationshipItems(relationships[relType][member.id].relationships, included);
            }
          }
        }
      } else if (isObject(relationships[relType].data)) {
        let member = relationships[relType].data;
        if(member.id && member.type) {
          relationships[relType][member.id] = findInclude(member, included);
          if (relationships[relType][member.id].hasOwnProperty('relationships')) {
            relationships[relType][member.id].relationships = mapRelationshipItems(relationships[relType][member.id].relationships, included);
          }
        }
      }
      delete relationships[relType].data;
    }
    return relationships;
  }
  
  if(Array.isArray(data.data)) {
    for (let dataItem in data.data) {
      if (!data.data.hasOwnProperty(dataItem)) { continue; }
      data.data[dataItem].relationships = mapRelationshipItems(data.data[dataItem].relationships, data.included);
    }
  } else {
    data.data.relationships = mapRelationshipItems(data.data.relationships, data.included);
  }
  
  return data;
}