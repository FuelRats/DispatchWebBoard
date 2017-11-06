// Module imports
import PropTypes from 'prop-types';

export default PropTypes.shape({
  'author': PropTypes.string.isRequired,
  'message': PropTypes.string.isRequired,
  'createdAt': PropTypes.string.isRequired,
  'updatedAt': PropTypes.string.isRequired,
  'lastAuthor': PropTypes.string.isRequired,
});