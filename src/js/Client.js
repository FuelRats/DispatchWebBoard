import Jq from 'jquery'; // I'm so sorry.
import AppConfig from './config/config.js';
import Clipboard from 'clipboard';
import RatSocket from './classes/RatSocket.js';
import * as StarSystemAPI from './api/StarSystemAPI.js';
import * as frConst from './util/frConstants.js';
import {
  getUrlParam,
  mapRelationships,
  makeTimeSpanString,
  makeDateHumanReadable,
  htmlSanitizeObject
} from './helpers';

const
  ANIMATE_OPACITY_DOWN_SPEED = 100,
  ANIMATE_OPACITY_UP_SPEED = 500,
  RESCUE_REMOVE_DELAY = 5000,
  MILLISECONDS_IN_SECOND = 1000;

export default class ClientControl {
  constructor(AuthHeader) {
    this.clipboard = null;
    this.CachedRescues = {};
    this.SelectedRescue = null;
    this.socket = null;
    this.theme = 'default';
    this.AuthHeader = AuthHeader;

    window.console.debug('fr.client.init - Client manager loaded.');
    Jq('#navbar-brand-title').text(AppConfig.AppTitle);

    window.onpopstate = this.HandlePopState.bind(this);

    // Theming shit. This needs to be actually made a thing instead of just a hack to make it work.
    let themever = 1;
    let saveTheme = function saveTheme() {
      window.localStorage.setItem(`${AppConfig.AppNamespace}.window.theme`, JSON.stringify({
        'style': Jq('body').attr('style'),
        '_meta': {
          'version': themever
        }
      }));
    };
    window.onbeforeunload = () => {
      saveTheme();
    };

    if (window.localStorage.getItem(`${AppConfig.AppNamespace}.window.theme`)) {
      this.theme = JSON.parse(window.localStorage.getItem(`${AppConfig.AppNamespace}.window.theme`));
      if (typeof this.theme !== 'string' && this.theme._meta.version === themever) {
        Jq('body').attr('style', this.theme.style);
      } else {
        // TODO preserve old theme... somehow....
        saveTheme();
      }
    }

    Jq('body').on('click', 'button.btn.btn-detail', (event) => {
      this.SetSelectedRescue(event.currentTarget.dataset.rescueSid);
    }).on('click', '.class-toggle', (event) => {
      Jq(event.currentTarget.dataset.target).toggleClass(event.currentTarget.dataset.targetClass);
    }).on('click', 'a.panel-settings-toggle', (event) => {
      window.alert("This doesn't do anything yet. lol!");
      event.preventDefault();
    });

    if (Clipboard && Clipboard.isSupported()) {
      this.clipboard = new Clipboard('.btn-clipboard');
      Jq('body').addClass('clipboard-enable');
    }

    this.socket = new RatSocket(AppConfig.WssURI);
    this.socket.on('ratsocket:reconnect', ctx => this.handleReconnect(ctx))
      .on('rescueCreated', (ctx, data) => {
        if (data.included) {
          data = mapRelationships(data);
        }
        this.AddRescue(ctx, data.data);
      }).on('rescueUpdated', (ctx, data) => {
        if (data.included) {
          data = mapRelationships(data);
        }

        for (let rescue of data.data) {
          this.UpdateRescue(ctx, rescue);
        }
      }).connect(this.AuthHeader)
      .then(() => this.socket.subscribe('0xDEADBEEF'))
      .then(() => this.socket.request({
        action: ['rescues', 'read'],
        status: {
          $not: 'closed'
        }
      }))
      .then(res => this.PopulateBoard(res.context, res.data))
      .catch(error => window.console.error(error)); // TODO proper error handling, display shutter with error message.

    this.UpdateClocks();
  }

  handleReconnect(ctx) {
    ctx.request({
      action: ['rescues', 'read'],
      status: {
        $not: 'closed'
      },
      meta: {
        'updateList': 'true'
      }
    }).then((response) => {
      this.ReloadBoard(response.context, response.data);
    }).catch((error) => {
      window.console.error('fr.client.handleReconnect - reconnect data update failed!', error);
    });
  }

  ReloadBoard(ctx, data) {
    let oldSelected = this.SelectedRescue ? this.SelectedRescue.id.split('-')[0] : null;

    this.SelectedRescue = null;
    this.CachedRescues = {};
    this.setHtml('#rescueRows', '');

    this.PopulateBoard(ctx, data);
    this.SetSelectedRescue(oldSelected);
  }

  PopulateBoard(ctx, data) {
    let rescues = mapRelationships(data).data;
    for (let rescue of rescues) {
      this.AddRescue(ctx, rescue);
    }
    this.ParseQueryString();
    Jq('body').removeClass('loading');
  }

  FetchRatInfo(ratId) {
    if (sessionStorage.getItem(`${AppConfig.AppNamespace}.rat.${ratId}`)) {
      let ratData = JSON.parse(sessionStorage.getItem(`${AppConfig.AppNamespace}.rat.${ratId}`));
      window.console.debug('fr.client.FetchRatInfo - Cached Rat Requested: ', ratData);
      return Promise.resolve(ratData);
    } else {
      window.console.debug(`fr.client.FetchRatInfo - Gathering RatInfo: ${ratId}`);
      return this.socket.request({
        action: 'rats:read',
        data: {
          'id': ratId
        },
        meta: {
          'searchId': ratId
        }
      }).then((res) => {
        sessionStorage.setItem(`${AppConfig.AppNamespace}.rat.${ratId}`, JSON.stringify(res.data));
        return Promise.resolve(res.data);
      });
    }
  }

  ParseQueryString() {
    let activeRescue = getUrlParam('a');
    if (activeRescue && this.CachedRescues[activeRescue]) {
      this.SetSelectedRescue(activeRescue, true);
    } else if (history.replaceState) {
      window.history.replaceState({
        'a': null
      }, document.title, window.location.pathname);
    }
  }

  HandlePopState(event) {
    this.SetSelectedRescue(event.state.a, true);
  }

  AddRescue(ctx, data) {
    if (!data || data.attributes.status === 'closed') {
      return;
    }
    let rescue = htmlSanitizeObject(data);
    let sid = rescue.id.split('-')[0];

    // Ensure rescue doesn't already exist. If it does, pass to update function instead.
    if (Jq(`tr.rescue[data-rescue-sid="${sid}"]`).length > 0) {
      this.UpdateRescue(rescue);
      return;
    }

    window.console.debug('fr.client.AddRescue: Rescue Added to board. Rescue Data:', rescue);

    this.CachedRescues[sid] = rescue;
    this.appendHtml('#rescueRows', this.GetRescueTableRow(rescue));

    if (typeof rescue.attributes.system === 'string') {
      // Retrieve system information now to speed things up later on....
      StarSystemAPI.getSystem(rescue.attributes.system).then(() => {
        window.console.debug('fr.client.AddRescue - Additional info found! Caching...');
      }).catch(() => {
        window.console.debug('fr.client.AddRescue - No additional system information found.');
      });
    }
  }

  UpdateRescue(ctx, data) {
    if (!data) {
      return;
    }
    let rescue = htmlSanitizeObject(data);
    let sid = rescue.id.split('-')[0];

    let rescueRow = Jq(`tr.rescue[data-rescue-sid="${sid}"]`);
    if (rescueRow.length < 1) {
      window.console.debug('fr.client.UpdateRescue: Attempted to update a non-existent rescue: ', rescue);
      this.AddRescue(ctx, rescue);
      return;
    }
    if (rescue.attributes.status === 'closed') {

      rescueRow
        .delay(RESCUE_REMOVE_DELAY)
        .hide('slow')
        .remove();

      window.console.debug(`fr.client.UpdateRescue - Rescue Removed: ${rescue.id} : `, rescue);

      if (rescue.id && this.SelectedRescue && rescue.id === this.SelectedRescue.id) {
        this.SetSelectedRescue(null);
      }
      delete this.CachedRescues[sid];
      return;
    }

    window.console.debug(`fr.client.UpdateRescue - Rescue Updated: ${rescue.id} : `, rescue);
    this.replaceHtml(`tr.rescue[data-rescue-sid="${sid}"]`, this.GetRescueTableRow(rescue));

    this.CachedRescues[sid] = rescue;
    if (rescue.id && this.SelectedRescue && rescue.id === this.SelectedRescue.id) {
      window.console.debug(`fr.client.UpdateRescue - Rescue DetailView Updating: ${rescue.id} : `, rescue);
      this.SelectedRescue = rescue;
      this.UpdateRescueDetail();
    }
  }

  /**
   * Forms the rescue table row HTML.
   * @param {Object} rescue - Object containing rescue info
   */
  GetRescueTableRow(rescue) {
    if (!rescue) {
      return;
    }

    let shortid = rescue.id.split('-')[0];
    let rats = rescue.relationships.rats.data === undefined ? rescue.relationships.rats : {};
    let ratHtml = [];
    for (let ratID in rats) {
      if (rats.hasOwnProperty(ratID)) {
        ratHtml.push(`<span class="rat" data-rat-uuid="${ratID}">${rescue.relationships.rats[ratID].attributes.name}</span>`);
      }
    }
    for (let rat of rescue.attributes.unidentifiedRats) {
      ratHtml.push(`<span class="rat-unidentified">${rat}</span> <span class="badge badge-yellow">unidentified</span>`);
    }

    let language = rescue.attributes.data.langID ? frConst.language[rescue.attributes.data.langID] ? frConst.language[rescue.attributes.data.langID] : {
        'short': rescue.attributes.data.langID,
        'long': rescue.attributes.data.langID
      } :
      frConst.language.unknown;

    let platform = rescue.attributes.platform ? frConst.platform[rescue.attributes.platform] : frConst.platform.unknown;

    let row = Jq(
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
       </tr>`);

    if (rescue.attributes.codeRed) {
      row.addClass('rescue-codered');
    } else {
      row.removeClass('rescue-codered');
    }
    if (rescue.attributes.status === 'inactive') {
      row.addClass('rescue-inactive');
    } else {
      row.removeClass('rescue-inactive');
    }
    row.attr('title', rescue.attributes.quotes !== null ? rescue.attributes.quotes.map(quote => `[${makeDateHumanReadable(new Date(`${quote.createdAt}Z`))}] "${quote.message}" - ${quote.author}`).join('\n') : 'No known quotes....');
    return row;
  }

  UpdateClocks() {
    let nowTime = new Date();

    Jq('.ed-clock').text(makeDateHumanReadable(nowTime));

    if (this.SelectedRescue !== null) {
      Jq('.rdetail-timer').text(makeTimeSpanString(nowTime, Date.parse(this.SelectedRescue.attributes.createdAt)))
        .prop('title', `Last Updated: ${makeTimeSpanString(nowTime, Date.parse(this.SelectedRescue.attributes.updatedAt))}`);
    }

    setTimeout(() => {
      this.UpdateClocks();
    }, MILLISECONDS_IN_SECOND - nowTime.getMilliseconds());
  }

  SetSelectedRescue(key, preventPush) {
    if (key === null || this.SelectedRescue && key.toString() === this.SelectedRescue.id.split('-')[0]) {
      this.SelectedRescue = null;
      if (history.pushState && !preventPush) {
        window.history.pushState({
          'a': null
        }, document.title, window.location.pathname);
      }
      this.UpdateRescueDetail();
      return;
    }
    if (!this.CachedRescues[key]) {
      window.console.error(`fr.client.SetSelectedRescue - invalid key: ${key}`);
      return;
    }
    window.console.debug(`fr.client.SetSelectedRescue - New SelectedRescue: ${this.CachedRescues[key].id}`);
    this.SelectedRescue = this.CachedRescues[key];
    if (history.pushState && !preventPush) {
      window.history.pushState({
        'a': key
      }, document.title, `${window.location.pathname}?a=${encodeURIComponent(key)}`);
    }
    this.UpdateRescueDetail();
  }

  UpdateRescueDetail() {
    Jq('button.btn-detail.active').removeClass('active'); // clear active buttons.
    if (!this.SelectedRescue) {
      Jq('body').removeClass('rdetail-active');
      return;
    }
    let rescue = this.SelectedRescue;

    let caseNo = typeof rescue.attributes.data.boardIndex === 'number' ? `#${rescue.attributes.data.boardIndex} - ` : '';
    let title = rescue.attributes.title ? `Operation ${rescue.attributes.title}` : rescue.attributes.client;
    let tags = (rescue.attributes.codeRed ? ' <span class="badge badge-red">Code Red</span>' : '') + (rescue.attributes.status === 'inactive' ? ' <span class="badge badge-yellow">Inactive</span>' : '');

    let language = rescue.attributes.data.langID ? frConst.language[rescue.attributes.data.langID] ? frConst.language[rescue.attributes.data.langID] : {
      'short': rescue.attributes.data.langID,
      'long': rescue.attributes.data.langID
    } : frConst.language.unknown;

    let platform = rescue.attributes.platform ? frConst.platform[rescue.attributes.platform] : frConst.platform.unknown;

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
      ${rescue.attributes.system ?       `<tr class="rdetail-info">
                                            <td class="rdetail-info-title">System</td>
                                            <td class="rdetail-info-value">
                                              ${rescue.attributes.system} 
                                              <span class="float-right system-apidata" data-system-name="${rescue.attributes.system.toUpperCase()}">
                                                <i>Retrieving info...</i>
                                              </span>
                                            </td>
                                          </tr>` : ''}
      ${rescue.attributes.platform ?     `<tr class="rdetail-info">
                                            <td class="rdetail-info-title">Platform</td>
                                            <td class="rdetail-info-value">${platform.long}</td>
                                          </tr>` : ''}
      ${rescue.attributes.data.langID ?  `<tr class="rdetail-info">
                                            <td class="rdetail-info-title">Language</td>
                                            <td class="rdetail-info-value">${language.long} (${language.short})</td>
                                          </tr>` : ''}
                                          <tr class="rdetail-info">
                                            <td class="rdetail-info-title">UUID</td>
                                            <td class="rdetail-info-value">${rescue.id}</td>
                                          </tr>
                                          <tr class="rdetail-info-seperator"><td class="tbl-border-none"></td><td></td></tr>`;

    let rats = rescue.relationships.rats.data === undefined ? rescue.relationships.rats : {};
    let ratHtml = [];

    for (let rat of Object.values(rats)) {
      ratHtml.push(`<span class="rat" data-rat-uuid="${rat.id}">${rat.attributes.name} ${rat.attributes.platform !== rescue.attributes.platform ? '<span class="badge badge-yellow">Wrong Platform!</span>' : ''}</span>`);
    }

    for (let rat of rescue.attributes.unidentifiedRats) {
      ratHtml.push(`<span class="rat-unidentified">${rat}</span> <span class="badge badge-yellow">unidentified</span>`);
    }

    if (ratHtml.length > 0) {
      detailContent += `<tr class="rdetail-info"><td class="rdetail-info-title">Rats</td><td class="rdetail-info-value tbl-border-box">${ratHtml.shift()}</td></tr>`;

      if (ratHtml.length > 0) {
        for (let rat of ratHtml) {
          detailContent += `<tr class="rdetail-info"><td class="rdetail-info-empty"></td><td class="rdetail-info-value tbl-border-box">${rat}</td></tr>`;
        }
      }

      detailContent += '<tr class="rdetail-info-seperator"><td class="tbl-border-none"></td><td></td></tr>'; // Separator
    }

    // Quotes
    if (Array.isArray(rescue.attributes.quotes) && rescue.attributes.quotes.length > 0) {

      let quotes = rescue.attributes.quotes.map(quote => `<span class="rdetail-quote-time">[${makeDateHumanReadable(new Date(`${quote.createdAt}Z`))}]</span> "<span class="rdetail-quote-message">${quote.message}</span>" - ${quote.lastAuthor}`);

      detailContent += `<tr class="rdetail-info"><td class="rdetail-info-title">Quotes</td><td class="rdetail-info-value tbl-border-box">${quotes.shift()}</td></tr>`;

      if (quotes.length > 0) {
        for (let quote of quotes) {
          detailContent += `<tr class="rdetail-info"><td class="rdetail-info-empty"></td><td class="rdetail-info-value tbl-border-box">${quote}</td></tr>`;
        }
      }
    }

    detailContent += '</tbody></table>';

    // Update the detail section.

    window.console.debug(`fr.client.UpdateRescueDetail - Rescue DetailView Updated: ${rescue.id} :`, rescue);

    this.setHtml('#rescueDetailContent', detailContent);

    Jq(`button.btn.btn-detail[data-rescue-sid="${rescue.id.split('-')[0]}"]`).addClass('active'); // Set new active button.
    Jq('body').addClass('rdetail-active');

    if (!rescue.attributes.system) {
      return;
    }

    window.console.debug('fr.client.UpdateRescueDetail - Checking sysapi for additional system info.');
    this.getSystemHtml(rescue).then((html) => {
      this.setHtml(`span[data-system-name="${rescue.attributes.system.toUpperCase()}"]`, html);
    }).catch(() => {
      this.setHtml(`span[data-system-name="${rescue.attributes.system.toUpperCase()}"]`,
        '<a target="_blank" href="https://www.edsm.net/"><span class="badge badge-red" title="Go to EDSM.net" >NOT IN EDSM</span></a>');
    });
  }

  getSystemHtml(rescue) {
    if (!rescue) {
      return Promise.reject('');
    }
    return StarSystemAPI.getSystem(rescue.attributes.system).then((data) => {
      window.console.debug('this.UpdateRescueDetail - Additional info found! Adding system-related warnings and edsm link.');

      let sysInfo = data;
      let sysInfoHtml = [];

      // The new systems API doesn't contain information about permits
      /*if (sysInfo.attributes.needs_permit && sysInfo.attributes.needs_permit === 1) {
        sysInfoHtml += '<span class="badge badge-yellow" title="This system requires a permit!">PERMIT</span> ';
      }*/

      if (sysInfo.attributes.is_populated && sysInfo.attributes.is_populated === 1) {
        sysInfoHtml.push('<span class="badge badge-yellow" title="This system is populated, check for stations!">POPULATED</span>');
      }

      if (sysInfo.bodies && sysInfo.bodies.length > 0) {
        let mainStar = sysInfo.bodies.find(function (body) {
          return body.attributes.isMainStar;
        });
        if (mainStar && mainStar.attributes.isScoopable) {
          sysInfoHtml.push('<span class="badge badge-yellow" title="This system\'s main star is scoopable!">SCOOPABLE</span>');
        } else if (sysInfo.bodies.length > 1 && sysInfo.bodies.filter((body) => body.attributes.isScoopable).length > 0) {
          sysInfoHtml.push('<span class="badge badge-yellow" title="This system contains a scoopable star!">SCOOPABLE [SECONDARY]</span>');
        }
      }

      if (sysInfo.id) {
        sysInfoHtml.push(`<a target="_blank" href="https://www.edsm.net/en/system/id/${sysInfo.id}/name/${sysInfo.attributes.name}"><span class="badge badge-green" title="View on EDSM.net" >EDSM</span></a>`);
      }
      return Promise.resolve(sysInfoHtml.join(' '));
    });
  }
  setHtml(target, html) {
    Jq(target)
      .animate({
        opacity: 0.2
      }, ANIMATE_OPACITY_DOWN_SPEED)
      .html(html)
      .animate({
        opacity: 1
      }, ANIMATE_OPACITY_UP_SPEED);
  }
  replaceHtml(target, html) {
    Jq(target).replaceWith(html);
    Jq(target)
      .animate({
        opacity: 0.2
      }, ANIMATE_OPACITY_DOWN_SPEED)
      .animate({
        opacity: 1
      }, ANIMATE_OPACITY_UP_SPEED);
  }
  appendHtml(target, html) {
    Jq(target).append(html);
  }
}