import PropTypes from 'prop-type';

export default PropTypes.shape({
  'id': PropTypes.string.isRequired,
  'type': PropTypes.oneOf(['profiles']),
  'attributes': PropTypes.shape({
    'data': PropTypes.object,
    'createdAt': PropTypes.string.isRequired,
    'updatedAt': PropTypes.string.isRequired,
    'displayRatId': PropTypes.string,
    'nicknames': PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  'relationships': PropTypes.shape({
    'rats': PropTypes.object,
    'groups': PropTypes.object,
    'displayRat': PropTypes.object,
  }).isRequired
}).isRequired;