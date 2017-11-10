// Module imports
import PropTypes from 'prop-types';

export default PropTypes.shape({
  'id': PropTypes.string.isRequired,
  'type': PropTypes.oneOf(['assignedRats']).isRequired,
  'attributes': PropTypes.shape({
    'name': PropTypes.string.isRequired,
    'platform': PropTypes.string,
    'identified': PropTypes.bool
  }).isRequired
}).isRequired;