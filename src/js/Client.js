/* eslint-disable max-len, no-restricted-syntax, multiline-ternary, class-methods-use-this */
import jq from 'jquery' // I'm so sorry.
import Clipboard from 'clipboard'
import appConfig from './AppConfig'
import RatSocket from './classes/RatSocket'
import * as StarSystemAPI from './api/StarSystemAPI'
import * as frConst from './util/frConstants'
import {
  getUrlParam,
  mapRelationships,
  makeTimeSpanString,
  makeDateHumanReadable,
  htmlSanitizeObject,
} from './helpers'

const ANIMATE_OPACITY_DOWN_SPEED = 100
const ANIMATE_OPACITY_UP_SPEED = 500
const RESCUE_REMOVE_DELAY = 5000
const MILLISECONDS_IN_SECOND = 1000

export default class ClientControl {
  constructor (AuthHeader) {
    this.clipboard = null
    this.CachedRescues = {}
    this.SelectedRescue = null
    this.socket = null
    this.theme = 'default'
    this.AuthHeader = AuthHeader

    window.console.debug('fr.client.init - Client manager loaded.')
    jq('#navbar-brand-title').text(appConfig.AppTitle)

    window.onpopstate = this.HandlePopState.bind(this)

    // Theming shit. This needs to be actually made a thing instead of just a hack to make it work.
    const themever = 1
    const saveTheme = function saveTheme () {
      window.localStorage.setItem(`${appConfig.AppNamespace}.window.theme`, JSON.stringify({
        style: jq('body').attr('style'),
        _meta: {
          version: themever,
        },
      }))
    }
    window.onbeforeunload = () => {
      saveTheme()
    }

    if (window.localStorage.getItem(`${appConfig.AppNamespace}.window.theme`)) {
      this.theme = JSON.parse(window.localStorage.getItem(`${appConfig.AppNamespace}.window.theme`))
      if (typeof this.theme !== 'string' && this.theme._meta.version === themever) {
        jq('body').attr('style', this.theme.style)
      } else {
        saveTheme()
      }
    }

    jq('body').on('click', 'button.btn.btn-detail', (event) => {
      this.setSelectedRescue(event.currentTarget.dataset.rescueSid)
    }).on('click', '.class-toggle', (event) => {
      jq(event.currentTarget.dataset.target).toggleClass(event.currentTarget.dataset.targetClass)
    }).on('click', 'a.panel-settings-toggle', (event) => {
      window.alert("This doesn't do anything yet. lol!") /* eslint-disable-line no-alert */// ALERTS!
      event.preventDefault()
    })

    if (Clipboard && Clipboard.isSupported()) {
      this.clipboard = new Clipboard('.btn-clipboard')
      jq('body').addClass('clipboard-enable')
    }

    this.socket = new RatSocket(appConfig.WssURI)
    this.socket.on('ratsocket:reconnect', (ctx) => this.handleReconnect(ctx))
      .on('rescueCreated', (ctx, data) => {
        this.addRescue(ctx, data.included ? mapRelationships(data).data : data.data)
      }).on('rescueUpdated', (ctx, _data) => {
        let data = { ..._data }
        if (data.included) {
          data = mapRelationships(data)
        }

        data.data.forEach((rescue) => {
          this.updateRescue(ctx, rescue)
        })
      }).connect(this.AuthHeader)
      .then(() => this.socket.subscribe('0xDEADBEEF'))
      .then(() => this.socket.request({ action: ['rescues', 'read'], status: { $not: 'closed' } }))
      .then((res) => this.populateBoard(res.context, res.data))
      .catch((error) => window.console.error(error))

    this.updateClocks()
  }

  handleReconnect (ctx) {
    ctx.request({
      action: ['rescues', 'read'],
      status: { $not: 'closed' },
      meta: {
        updateList: 'true',
      },
    }).then((response) => {
      this.reloadBoard(response.context, response.data)
    }).catch((error) => {
      window.console.error('fr.client.handleReconnect - reconnect data update failed!', error)
    })
  }

  reloadBoard (ctx, data) {
    const oldSelected = this.SelectedRescue ? this.SelectedRescue.id.split('-')[0] : null

    this.SelectedRescue = null
    this.CachedRescues = {}
    this.setHtml('#rescueRows', '')

    this.populateBoard(ctx, data)
    this.setSelectedRescue(oldSelected)
  }

  populateBoard (ctx, data) {
    mapRelationships(data).data.forEach((rescue) => {
      this.addRescue(ctx, rescue)
    })
    this.parseQueryString()
    jq('body').removeClass('loading')
  }

  FetchRatInfo (ratId) {
    if (sessionStorage.getItem(`${appConfig.AppNamespace}.rat.${ratId}`)) {
      const ratData = JSON.parse(sessionStorage.getItem(`${appConfig.AppNamespace}.rat.${ratId}`))
      window.console.debug('fr.client.FetchRatInfo - Cached Rat Requested: ', ratData)
      return Promise.resolve(ratData)
    }
    window.console.debug(`fr.client.FetchRatInfo - Gathering RatInfo: ${ratId}`)
    return this.socket.request({
      action: 'rats:read',
      data: {
        id: ratId,
      },
      meta: {
        searchId: ratId,
      },
    }).then((res) => {
      sessionStorage.setItem(`${appConfig.AppNamespace}.rat.${ratId}`, JSON.stringify(res.data))
      return Promise.resolve(res.data)
    })
  }

  parseQueryString () {
    const activeRescue = getUrlParam('a')
    if (activeRescue && this.CachedRescues[activeRescue]) {
      this.setSelectedRescue(activeRescue, true)
    } else if (window.history.replaceState) {
      window.history.replaceState({
        a: null, /* eslint-disable-line id-length */
      }, document.title, window.location.pathname)
    }
  }

  HandlePopState (event) {
    this.setSelectedRescue(event.state.a, true)
  }

  addRescue (ctx, data) {
    if (!data || data.attributes.status === 'closed') {
      return
    }
    const rescue = htmlSanitizeObject(data)
    const [sid] = rescue.id.split('-')

    // Ensure rescue doesn't already exist. If it does, pass to update function instead.
    if (jq(`tr.rescue[data-rescue-sid="${sid}"]`).length > 0) {
      this.updateRescue(rescue)
      return
    }

    window.console.debug('fr.client.addRescue: Rescue Added to board. Rescue Data:', rescue)

    this.CachedRescues[sid] = rescue
    this.appendHtml('#rescueRows', this.getRescueTableRow(rescue))

    if (typeof rescue.attributes.system === 'string') {
      // Retrieve system information now to speed things up later on....
      StarSystemAPI.getSystem(rescue.attributes.system).then(() => {
        window.console.debug('fr.client.addRescue - Additional info found! Caching...')
      }).catch(() => {
        window.console.debug('fr.client.addRescue - No additional system information found.')
      })
    }
  }

  updateRescue (ctx, data) {
    if (!data) {
      return
    }
    const rescue = htmlSanitizeObject(data)
    const [sid] = rescue.id.split('-')

    const rescueRow = jq(`tr.rescue[data-rescue-sid="${sid}"]`)
    if (rescueRow.length < 1) {
      window.console.debug('fr.client.updateRescue: Attempted to update a non-existent rescue: ', rescue)
      this.addRescue(ctx, rescue)
      return
    }
    if (rescue.attributes.status === 'closed') {
      rescueRow
        .delay(RESCUE_REMOVE_DELAY)
        .hide('slow')
        .remove()

      window.console.debug(`fr.client.updateRescue - Rescue Removed: ${rescue.id} : `, rescue)

      if (rescue.id && this.SelectedRescue && rescue.id === this.SelectedRescue.id) {
        this.setSelectedRescue(null)
      }
      delete this.CachedRescues[sid]
      return
    }

    window.console.debug(`fr.client.updateRescue - Rescue Updated: ${rescue.id} : `, rescue)
    this.replaceHtml(`tr.rescue[data-rescue-sid="${sid}"]`, this.getRescueTableRow(rescue))

    this.CachedRescues[sid] = rescue
    if (rescue.id && this.SelectedRescue && rescue.id === this.SelectedRescue.id) {
      window.console.debug(`fr.client.updateRescue - Rescue DetailView Updating: ${rescue.id} : `, rescue)
      this.SelectedRescue = rescue
      this.updateRescueDetail()
    }
  }

  /**
   * Forms the rescue table row HTML.
   * @param {Object} rescue - Object containing rescue info
   */
  getRescueTableRow (rescue) {
    if (!rescue) {
      return null
    }

    const [shortid] = rescue.id.split('-')
    const rats = rescue.relationships.rats.data === undefined ? rescue.relationships.rats : {}
    const ratHtml = []

    Object.entries(rats).forEach(([ratID, ratData]) => {
      ratHtml.push(`<span class="rat" data-rat-uuid="${ratID}">${ratData.attributes.name}</span>`)
    })

    rescue.attributes.unidentifiedRats.forEach((rat) => {
      ratHtml.push(`<span class="rat-unidentified">${rat}</span> <span class="badge badge-yellow">unidentified</span>`)
    })

    let language = frConst.language.unknown

    if (rescue.attributes.data.langID) {
      if (frConst.language[rescue.attributes.data.langID]) {
        language = frConst.language[rescue.attributes.data.langID]
      } else {
        language = {
          short: rescue.attributes.data.langID,
          long: rescue.attributes.data.langID,
        }
      }
    }

    const platform = rescue.attributes.platform ? frConst.platform[rescue.attributes.platform] : frConst.platform.unknown

    const row = jq(
      `<tr class="rescue" data-rescue-sid="${shortid}">
         <td class="rescue-row-index">${typeof rescue.attributes.data.boardIndex === 'number' ? rescue.attributes.data.boardIndex : '?'}</td>
         <td class="rescue-row-client" title="${rescue.attributes.data.IRCNick || ''}">${rescue.attributes.client || '?'}</td>
         <td class="rescue-row-language" title="${language.long}">${language.short}</td>
         <td class="rescue-row-platform" title="${platform.long}">${platform.short}</td>
         <td class="rescue-row-system btn-clipboard" data-clipboard-text="${rescue.attributes.system || 'Unknown'}">
           ${rescue.attributes.system || 'Unknown'}
           <span class="clipboard-icon">${frConst.iconSVG.clipboard}</span>
         </td>
         <td class="rescue-row-rats">${ratHtml.join(', ')}</td>
         <td class="rescue-row-detail">
           <button type="button" class="btn btn-detail" data-rescue-sid="${shortid}" title="More details...">${frConst.iconSVG.more}</button>
         </td>
       </tr>`
    )

    if (rescue.attributes.codeRed) {
      row.addClass('rescue-codered')
    } else {
      row.removeClass('rescue-codered')
    }
    if (rescue.attributes.status === 'inactive') {
      row.addClass('rescue-inactive')
    } else {
      row.removeClass('rescue-inactive')
    }
    row.attr('title',
      rescue.attributes.quotes === null
        ? 'No known quotes....'
        : rescue.attributes.quotes.map((quote) => `[${makeDateHumanReadable(new Date(`${quote.createdAt}`))}] "${quote.message}" - ${quote.author}`).join('\n'))
    return row
  }

  updateClocks () {
    const nowTime = new Date()

    jq('.ed-clock').text(makeDateHumanReadable(nowTime))

    if (this.SelectedRescue !== null) {
      jq('.rdetail-timer').text(makeTimeSpanString(nowTime, Date.parse(this.SelectedRescue.attributes.createdAt)))
        .prop('title', `Last Updated: ${makeTimeSpanString(nowTime, Date.parse(this.SelectedRescue.attributes.updatedAt))}`)
    }

    setTimeout(() => {
      this.updateClocks()
    }, MILLISECONDS_IN_SECOND - nowTime.getMilliseconds())
  }

  setSelectedRescue (key, preventPush) {
    if ((key === null || this.SelectedRescue) && key.toString() === this.SelectedRescue.id.split('-')[0]) {
      this.SelectedRescue = null
      if (window.history.pushState && !preventPush) {
        /* eslint-disable-next-line id-length */// a Identifier is fine
        window.history.pushState({ a: null }, document.title, window.location.pathname)
      }
      this.updateRescueDetail()
      return
    }
    if (!this.CachedRescues[key]) {
      window.console.error(`fr.client.setSelectedRescue - invalid key: ${key}`)
      return
    }
    window.console.debug(`fr.client.setSelectedRescue - New SelectedRescue: ${this.CachedRescues[key].id}`)
    this.SelectedRescue = this.CachedRescues[key]
    if (window.history.pushState && !preventPush) {
      /* eslint-disable-next-line id-length */// a Identifier is fine
      window.history.pushState({ a: key }, document.title, `${window.location.pathname}?a=${encodeURIComponent(key)}`)
    }
    this.updateRescueDetail()
  }

  updateRescueDetail () {
    jq('button.btn-detail.active').removeClass('active') // clear active buttons.
    if (!this.SelectedRescue) {
      jq('body').removeClass('rdetail-active')
      return
    }
    const rescue = this.SelectedRescue

    const caseNo = typeof rescue.attributes.data.boardIndex === 'number' ? `#${rescue.attributes.data.boardIndex} - ` : ''
    const title = rescue.attributes.title ? `Operation ${rescue.attributes.title}` : rescue.attributes.client
    const tags = (rescue.attributes.codeRed ? ' <span class="badge badge-red">Code Red</span>' : '') + (rescue.attributes.status === 'inactive' ? ' <span class="badge badge-yellow">Inactive</span>' : '')

    let language = frConst.language.unknown

    if (rescue.attributes.data.langID) {
      if (frConst.language[rescue.attributes.data.langID]) {
        language = frConst.language[rescue.attributes.data.langID]
      } else {
        language = {
          short: rescue.attributes.data.langID,
          long: rescue.attributes.data.langID,
        }
      }
    }

    const platform = rescue.attributes.platform ? frConst.platform[rescue.attributes.platform] : frConst.platform.unknown

    // Construct detail html.
    let detailContent = `<div class="rdetail-header">
                                          <div class="rdetail-title">${caseNo + title + tags}</div>
                                          <div class="rdetail-timer">00:00:00</div>
                                        </div>
                                        <table class="rdetail-body table table-rescue">
                                        <thead>
                                          <td width="90px"></td>
                                          <td></td>
                                        </thead>
                                        <tbody>
      ${rescue.attributes.data.IRCNick ? `<tr class="rdetail-info">
                                            <td class="rdetail-info-title">IRC Nick</td>
                                            <td class="rdetail-info-value">${rescue.attributes.data.IRCNick}</td>
                                          </tr>` : ''}
      ${rescue.attributes.system ? `<tr class="rdetail-info">
                                            <td class="rdetail-info-title">System</td>
                                            <td class="rdetail-info-value">
                                              ${rescue.attributes.system}
                                              <span class="float-right system-apidata" data-system-name="${rescue.attributes.system.toUpperCase()}">
                                                <i>Retrieving info...</i>
                                              </span>
                                            </td>
                                          </tr>` : ''}
      ${rescue.attributes.platform ? `<tr class="rdetail-info">
                                            <td class="rdetail-info-title">Platform</td>
                                            <td class="rdetail-info-value">${platform.long}</td>
                                          </tr>` : ''}
      ${rescue.attributes.data.langID ? `<tr class="rdetail-info">
                                            <td class="rdetail-info-title">Language</td>
                                            <td class="rdetail-info-value">${language.long} (${language.short})</td>
                                          </tr>` : ''}
                                          <tr class="rdetail-info">
                                            <td class="rdetail-info-title">UUID</td>
                                            <td class="rdetail-info-value">${rescue.id}</td>
                                          </tr>
                                          <tr class="rdetail-info-seperator"><td class="tbl-border-none"></td><td></td></tr>`

    const rats = rescue.relationships.rats.data === undefined ? rescue.relationships.rats : {}
    const ratHtml = []

    for (const rat of Object.values(rats)) {
      ratHtml.push(`<span class="rat" data-rat-uuid="${rat.id}">${rat.attributes.name} ${rat.attributes.platform === rescue.attributes.platform ? '' : '<span class="badge badge-yellow">Wrong Platform!</span>'}</span>`)
    }

    for (const rat of rescue.attributes.unidentifiedRats) {
      ratHtml.push(`<span class="rat-unidentified">${rat}</span> <span class="badge badge-yellow">unidentified</span>`)
    }

    if (ratHtml.length > 0) {
      detailContent += `<tr class="rdetail-info"><td class="rdetail-info-title">Rats</td><td class="rdetail-info-value tbl-border-box">${ratHtml.shift()}</td></tr>`

      if (ratHtml.length > 0) {
        for (const rat of ratHtml) {
          detailContent += `<tr class="rdetail-info"><td class="rdetail-info-empty"></td><td class="rdetail-info-value tbl-border-box">${rat}</td></tr>`
        }
      }

      detailContent += '<tr class="rdetail-info-seperator"><td class="tbl-border-none"></td><td></td></tr>' // Separator
    }

    // Quotes
    if (Array.isArray(rescue.attributes.quotes) && rescue.attributes.quotes.length > 0) {
      const quotes = rescue.attributes.quotes.map((quote) => `<span class="rdetail-quote-time">[${makeDateHumanReadable(new Date(`${quote.createdAt}`))}]</span> "<span class="rdetail-quote-message">${quote.message}</span>" - ${quote.lastAuthor}`)

      detailContent += `<tr class="rdetail-info"><td class="rdetail-info-title">Quotes</td><td class="rdetail-info-value tbl-border-box">${quotes.shift()}</td></tr>`

      if (quotes.length > 0) {
        for (const quote of quotes) {
          detailContent += `<tr class="rdetail-info"><td class="rdetail-info-empty"></td><td class="rdetail-info-value tbl-border-box">${quote}</td></tr>`
        }
      }
    }

    detailContent += '</tbody></table>'

    // Update the detail section.

    window.console.debug(`fr.client.updateRescueDetail - Rescue DetailView Updated: ${rescue.id} :`, rescue)

    this.setHtml('#rescueDetailContent', detailContent)

    jq(`button.btn.btn-detail[data-rescue-sid="${rescue.id.split('-')[0]}"]`).addClass('active') // Set new active button.
    jq('body').addClass('rdetail-active')

    if (!rescue.attributes.system) {
      return
    }

    window.console.debug('fr.client.updateRescueDetail - Checking sysapi for additional system info.')
    this.getSystemHtml(rescue).then((html) => {
      this.setHtml(`span[data-system-name="${rescue.attributes.system.toUpperCase()}"]`, html)
    }).catch(() => {
      this.setHtml(`span[data-system-name="${rescue.attributes.system.toUpperCase()}"]`,
        '<a target="_blank" href="https://www.edsm.net/"><span class="badge badge-red" title="Go to EDSM.net" >NOT IN EDSM</span></a>')
    })
  }

  getSystemHtml (rescue) {
    if (!rescue) {
      return Promise.reject(new Error())
    }
    return StarSystemAPI.getSystem(rescue.attributes.system).then((data) => {
      window.console.debug('this.updateRescueDetail - Additional info found! Adding system-related warnings and edsm link.')

      const sysInfo = data
      const sysInfoHtmlArray = []

      if (sysInfo.attributes.needs_permit && sysInfo.attributes.needs_permit === 1) {
        sysInfoHtmlArray.push('<span class="badge badge-yellow" title="This system requires a permit!">PERMIT</span>')
      }

      if (sysInfo.attributes.isPopulated && sysInfo.attributes.isPopulated === 1) {
        sysInfoHtmlArray.push('<span class="badge badge-yellow" title="This system is populated, check for stations!">POPULATED</span>')
      }

      if (sysInfo.bodies && sysInfo.bodies.length > 0) {
        const mainStar = sysInfo.bodies.find((body) => body.attributes.isMainStar)
        if (mainStar && mainStar.attributes.isScoopable) {
          sysInfoHtmlArray.push('<span class="badge badge-yellow" title="This system\'s main star is scoopable!">SCOOPABLE</span>')
        } else if (sysInfo.bodies.length > 1 && sysInfo.bodies.filter((body) => body.attributes.isScoopable).length > 0) {
          sysInfoHtmlArray.push('<span class="badge badge-yellow" title="This system contains a scoopable star!">SCOOPABLE [SECONDARY]</span>')
        }
      }

      if (sysInfo.id) {
        sysInfoHtmlArray.push(`<a target="_blank" href="https://www.edsm.net/en/system/id/${sysInfo.id}/name/${sysInfo.attributes.name}"><span class="badge badge-green" title="View on EDSM.net">EDSM</span></a>`)
      }
      return Promise.resolve(sysInfoHtmlArray.join(' '))
    })
  }

  setHtml (target, html) {
    jq(target)
      .animate({ opacity: 0.2 }, ANIMATE_OPACITY_DOWN_SPEED)
      .html(html)
      .animate({ opacity: 1 }, ANIMATE_OPACITY_UP_SPEED)
  }

  replaceHtml (target, html) {
    jq(target).replaceWith(html)
    jq(target)
      .animate({ opacity: 0.2 }, ANIMATE_OPACITY_DOWN_SPEED)
      .animate({ opacity: 1 }, ANIMATE_OPACITY_UP_SPEED)
  }

  appendHtml (target, html) {
    jq(target).append(html)
  }
}
