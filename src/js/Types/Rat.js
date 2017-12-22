// Module imports
import PropTypes from 'prop-types'

export default PropTypes.shape({
  'id': PropTypes.string.isRequired,
  'type': PropTypes.oneOf(['rats']).isRequired,
  'attributes': PropTypes.shape({
    'name': PropTypes.string.isRequired,
    'data': PropTypes.object,
    'joined': PropTypes.string.isRequired,
    'platform': PropTypes.string,
    'createdAt': PropTypes.string.isRequired,
    'updatedAt': PropTypes.string.isRequired,
    'userId': PropTypes.string.isRequired
  }).isRequired,
  'relationships': PropTypes.shape({
    'ships': PropTypes.object
  }).isRequired
}).isRequired