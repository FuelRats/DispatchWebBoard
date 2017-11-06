// App imports
import quotePropType from './Quote.js';

// Module imports
import PropTypes from 'prop-types';


export default PropTypes.shape({
  'id': PropTypes.string.isRequired,
  'type': PropTypes.oneOf(['rescues']).isRequired,
  'attributes': PropTypes.shape({
    'client': PropTypes.string,
    'codeRed': PropTypes.bool.isRequired,
    'data': PropTypes.shape({
      'langID': PropTypes.string,
      'status': PropTypes.object,
      'IRCNick': PropTypes.string,
      'boardIndex': PropTypes.number,
      'markedForDeletion': PropTypes.shape({
        'marked': PropTypes.boolean,
        'reason': PropTypes.string,
        'reporter': PropTypes.string
      })
    }),
    'notes': PropTypes.string.isRequired,
    'platform': PropTypes.oneOf(['pc','xb','ps']),
    'quotes': PropTypes.arrayOf(quotePropType),
    'status': PropTypes.oneOf(['open', 'inactive', 'closed']),
    'system': PropTypes.string,
    'title': PropTypes.string,
    'outcome': PropTypes.oneOf(['success', 'failure', 'invalid', 'other']),
    'unidentifiedRats': PropTypes.arrayOf(PropTypes.string).isRequired,
    'createdAt': PropTypes.string.isRequired,
    'updatedAt': PropTypes.string.isRequired,
    'firstLimpetId': PropTypes.string
  }).isRequired,
  'relationships': PropTypes.shape({
    'rats': PropTypes.object,
    'firstLimpet': PropTypes.object,
    'epics': PropTypes.object
  }).isRequired
}).isRequired;