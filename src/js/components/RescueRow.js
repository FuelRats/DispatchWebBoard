import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'





import { iconSVG, platforms, languages } from '../util/frConstants'
import { connect } from '../store'
import { makeDateHumanReadable } from '../helpers'


@connect
class RescueRow extends Component {
  render () {
    const {
      onDetailButtonClick,
      rescue,
    } = this.props

    if (!rescue.attributes.data) {
      rescue.attributes.data = {}
    }

    const {
      rescueLanguage,
      rescuePlatform,
      rescueQuotes,
      rescueRats,
    } = this

    const classes = classNames({
      rescue: true,
      'rescue-codered': rescue.attributes.codeRed,
      'rescue-inactive': rescue.attributes.status === 'inactive',
    })

    return (
      <tr className={classes} title={rescueQuotes}>
        <td className="rescue-row-index">
          {
            typeof rescue.attributes.data.boardIndex === 'number'
              ? rescue.attributes.data.boardIndex
              : '?'
          }
        </td>
        <td
          className="rescue-row-client"
          title={rescue.attributes.data.IRCNick || ''}>
          {rescue.attributes.client || '?'}
        </td>
        <td
          className="rescue-row-language"
          title={rescueLanguage.long}>
          {rescueLanguage.short}
        </td>
        <td
          className="rescue-row-platform"
          title={rescuePlatform.long}>
          {rescuePlatform.short}
        </td>
        <td
          className="rescue-row-system btn-clipboard"
          data-clipboard-text={rescue.attributes.system || 'Unknown'}>
          {rescueRats}
        </td>
        <td className="rescue-row-rats">
          {}
        </td>
        <td className="rescue-row-detail">
          <button
            className="btn btn-detail"
            onClick={onDetailButtonClick}
            name={rescue.id}
            type="button"
            title="More details...">
            {iconSVG.more}
          </button>
        </td>
      </tr>
    )
  }


  get rescueRats () {
    const {
      rescue,
      rescueRats,
    } = this.props

    const ratList = []


    Object.values(rescueRats).forEach((rat) => {
      ratList.push(
        <span key={rat.id} className="rat">
          {ratList.length ? ', ' : ''}
          {rat.attributes.name}
        </span>
      )
    })

    rescue.attributes.unidentifiedRats.forEach((rat) => {
      ratList.push(
        <span key={rat}>
          {ratList.length ? ', ' : ''}
          <span className="rat-unidentified">{rat}</span>
          <span className="badge badge-yellow">unidentified</span>
        </span>
      )
    })

    return ratList.map()
  }

  get rescueLanguage () {
    const { rescue } = this.props

    let lang = languages.unknown

    if (rescue.attributes.data && rescue.attributes.data.langID) {
      if (languages[rescue.attributes.data.langID]) {
        lang = languages[rescue.attributes.data.langID]
      } else {
        lang = {
          short: rescue.attributes.data.langID,
          long: rescue.attributes.data.langID,
        }
      }
    }

    return lang
  }

  get rescuePlatform () {
    const { rescue } = this.props
    return rescue.attributes.platform ? platforms[rescue.attributes.platform] : platforms.unknown
  }


  get rescueQuotes () {
    const { rescue } = this.props

    if (rescue.attributes.quotes && rescue.attributes.quotes.length) {
      return rescue.attributes.quotes.map((quote) => `[${makeDateHumanReadable(new Date(`${quote.createdAt}`))}] "${quote.message}" - ${quote.author}`).join('\n')
    }

    return 'No known quotes....'
  }

  static mapStateToProps = (state, ownProps) => {
    const rescue = state.rescues[ownProps.rescueId]
    const rescueRats = Object.values(state.rats)
      .reduce((acc, rat) => (rescue.relationships.rats.data.find(({ id }) => rat.id === id)
        ? ({
          ...acc,
          [rat.id]: rat,
        })
        : acc
      ), {})

    return {
      rescue,
      rescueRats,
    }
  }
}


RescueRow.propTypes = {
  onDetailButtonClick: PropTypes.func.isRequired,
  rescue: PropTypes.object.isRequired,
  rescueRats: PropTypes.object.isRequired,
}


export default RescueRow
