import $ from 'jquery'; // I'm so sorry.
import AppConfig from './config/config.js';
import Clipboard from 'clipboard';
import RatSocket from './classes/RatSocket.js';
import * as StarSystemAPI from './api/StarSystemAPI.js';
import * as frConst from './util/frConstants.js';
import {getUrlParam, mapRelationships, makeTimeSpanString, makeDateHumanReadable} from './helpers';

let instance = null;
export default class ClientControl {
  constructor(AuthHeader) {

    if(!instance) {
      instance = this;
    }

    this.clipboard = null;
    this.CachedRescues = {};
    this.SelectedRescue = null;
    this.socket = null;
    this.theme = 'default';
    this.AuthHeader = AuthHeader;
    
    window.console.debug('fr.client.init - Client manager loaded.');
    $('#navbar-brand-title').text(AppConfig.AppTitle);
    
    window.onpopstate = this.HandlePopState;

    // Theming shit. This needs to be actually made a thing instead of just a hack to make it work.
    let themever = 1;
    let saveTheme = function saveTheme() {
      window.localStorage.setItem(`${AppConfig.AppNamespace}.window.theme`, JSON.stringify({
        'style': $('body').attr('style'),
        '_meta': {
          'version': themever
        }
      }));
    };
    window.onbeforeunload = () => {
      saveTheme();
    };
    if(window.localStorage.getItem(`${AppConfig.AppNamespace}.window.theme`)) {
      this.theme = JSON.parse(window.localStorage.getItem(`${AppConfig.AppNamespace}.window.theme`));
      if(typeof this.theme !== 'string' && this.theme._meta.version === themever) {
        $('body').attr('style', this.theme.style);
      } else {
        // TODO preserve old theme... somehow....
        saveTheme();
      }
    }

    $('body').on('click', 'button.btn.btn-detail', (event) => {
      this.SetSelectedRescue(event.currentTarget.dataset.rescueSid);
    }).on('click', '.class-toggle', (event) => {
      $(event.currentTarget.dataset.target).toggleClass(event.currentTarget.dataset.targetClass);
    }).on('click', 'a.panel-settings-toggle', (event) => {
      window.alert("This doesn't do anything yet. lol!");
      event.preventDefault();
    });

    if (Clipboard && Clipboard.isSupported()) {
      this.clipboard = new Clipboard('.btn-clipboard');
      $('body').addClass('clipboard-enable');
    }

    this.socket = new RatSocket(AppConfig.WssURI);
    this.socket.on('ratsocket:reconnect', ctx => this.handleReconnect(ctx))
      .on('rescueCreated', (ctx, data) => {
        if(data.included) { data = mapRelationships(data); }
        this.AddRescue(ctx, data.data);
      }).on('rescueUpdated', (ctx, data) => {
        if(data.included) {
          data = mapRelationships(data);
        }
        for(let i = 0; i < data.data.length; i += 1) {
          this.UpdateRescue(ctx, data.data[i]);
        }
      }).connect(this.AuthHeader)
      .then(() => this.socket.subscribe('0xDEADBEEF'))
      .then(() => this.socket.request({action:['rescues', 'read'], status: { $not: 'closed' }}))
      .then(res => this.PopulateBoard(res.context, res.data))
      .catch(error => window.console.error(error)); // TODO proper error handling, display shutter with error message.
                                            
    this.UpdateClocks();

    return instance;
  }

  handleReconnect(ctx) {
    ctx.request({
      action: ['rescues', 'read'],
      status: { $not: 'closed' },
      meta: {
        'updateList': 'true'
      }
    }).then((data) => {
      window.console.debug('ClientControl.handleReconnect - Data Received: ', data);
    }).catch((error) => {
      window.console.error('fr.client.handleReconnect - reconnect data update failed!', error);
    });
  }

  PopulateBoard(ctx, data) {
    let rescues = data.data;
    for (let i in rescues) {
      if (rescues.hasOwnProperty(i)) {
        this.AddRescue(ctx, rescues[i]);
      }
    }
    this.ParseQueryString();
    $('body').removeClass('loading');
  }

  FetchRatInfo(ratId) {
    if (sessionStorage.getItem(`${AppConfig.AppNamespace}.rat.${ratId}`)) {
      let ratData = JSON.parse(sessionStorage.getItem(`${AppConfig.AppNamespace}.rat.${ratId}`));
      window.console.debug('fr.client.FetchRatInfo - Cached Rat Requested: ', ratData);
      return Promise.resolve(ratData);
    } else {
      window.console.debug(`fr.client.FetchRatInfo - Gathering RatInfo: ${ratId}`);
      return this.socket.request({
        action:'rats:read',
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

  AddRescue(ctx, rescue) {
    if (!rescue || rescue.attributes.status === 'closed') {
      return;
    }
    let sid = rescue.id.split('-')[0];

    // Ensure rescue doesn't already exist. If it does, pass to update function instead.
    if ($(`tr.rescue[data-rescue-sid="${sid}"]`).length > 0) {
      this.UpdateRescue(rescue);
      return;
    }

    window.console.debug('fr.client.AddRescue: Rescue Added to board.');

    this.CachedRescues[sid] = rescue;
    this.appendHtml('#rescueRows', this.GetRescueTableRow(rescue));

    if(typeof rescue.attributes.system === 'string') {
      // Retrieve system information now to speed things up later on....
      StarSystemAPI.getSystem(rescue.attributes.system).then(() => {
        window.console.debug('fr.client.AddRescue - Additional info found! Caching...');
      }).catch(() =>{
        window.console.debug('fr.client.AddRescue - No additional system information found.');
      });
    }
  }

  UpdateRescue(ctx, rescue) {
    if (!rescue) {
      return;
    }
    
    let sid = rescue.id.split('-')[0];
    let rescueRow = $(`tr.rescue[data-rescue-sid="${sid}"]`);
    if (rescueRow.length < 1) {
      window.console.debug('fr.client.UpdateRescue: Attempted to update a non-existent rescue: ', rescue);
      this.AddRescue(ctx, rescue);
      return;
    }
    if (rescue.attributes.status === 'closed') {
      setTimeout(function() {
        rescueRow.hide('slow')
          .remove();
      }, 5000);

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

    let row = $(`<tr class="rescue" data-rescue-sid="${shortid}">` +
      `<td class="rescue-row-index">${typeof rescue.attributes.data.boardIndex === 'number' ? rescue.attributes.data.boardIndex : '?'}</td>` +
      `<td class="rescue-row-client" title="${rescue.attributes.data.IRCNick || ''}">${rescue.attributes.client || '?'}</td>` +
      `<td class="rescue-row-language" title="${language.long}">${language.short}</td>` +
      `<td class="rescue-row-platform" title="${platform.long}">${platform.short}</td>` +
      `<td class="rescue-row-system btn-clipboard" data-clipboard-text="${rescue.attributes.system || 'Unknown'}">${rescue.attributes.system || 'Unknown'} <span class="clipboard-icon">${frConst.iconSVG.clipboard}</span></td>` +
      `<td class="rescue-row-rats">${ratHtml.join(', ')}</td>` +
      `<td class="rescue-row-detail"><button type="button" class="btn btn-detail" data-rescue-sid="${shortid}" title="More details...">${frConst.iconSVG.more}</button></td>` +
      '</tr>');

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
    row.attr('title', rescue.attributes.quotes !== null ? rescue.attributes.quotes.map(quote => `[${quote.createdAt}] "${quote.message}" - ${quote.author}`).join('\n') : 'No known quotes....');
    return row;
  }

  UpdateClocks() {
    let nowTime = new Date();

    $('.ed-clock').text(makeDateHumanReadable(nowTime));

    if (this.SelectedRescue !== null) {
      $('.rdetail-timer').text(makeTimeSpanString(nowTime, Date.parse(this.SelectedRescue.attributes.createdAt)))
        .prop('title', 'Last Updated: ' + makeTimeSpanString(nowTime, Date.parse(this.SelectedRescue.attributes.updatedAt)));
    }

    setTimeout(() => { this.UpdateClocks(); }, 1000 - nowTime.getMilliseconds());
  }

  SetSelectedRescue(key, preventPush) {
    if (key === null || this.SelectedRescue && key.toString() === this.SelectedRescue.id.split('-')[0]) {
      this.SelectedRescue = null;
      if (history.pushState && !preventPush) {
        window.history.pushState({'a': null}, document.title, window.location.pathname);
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
      window.history.pushState({'a': key}, document.title, window.location.pathname + `?a=${encodeURIComponent(key)}`);
    }
    this.UpdateRescueDetail();
  }

  UpdateRescueDetail() {
    $('button.btn-detail.active').removeClass('active'); // clear active buttons.
    if (!this.SelectedRescue) {
      $('body').removeClass('rdetail-active');
      return;
    }
    let rescue = this.SelectedRescue;

    let caseNo = typeof rescue.attributes.data.boardIndex === 'number' ? `#${rescue.attributes.data.boardIndex} - ` : '';
    let title = rescue.attributes.title ? rescue.attributes.title : rescue.attributes.client;
    let tags = (rescue.attributes.codeRed ? ' <span class="badge badge-red">Code Red</span>' : '') + (rescue.attributes.status === 'inactive' ? ' <span class="badge badge-yellow">Inactive</span>' : '');

    let language = rescue.attributes.data.langID ? frConst.language[rescue.attributes.data.langID] ? frConst.language[rescue.attributes.data.langID] : 
      { 'short': rescue.attributes.data.langID, 'long': rescue.attributes.data.langID } : frConst.language.unknown;

    let platform = rescue.attributes.platform ? frConst.platform[rescue.attributes.platform] : frConst.platform.unknown;

    // Construct detail html.
    let detailContent =                `<div class="rdetail-header">
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
    for (let ratID in rats) {
      if(!rats.hasOwnProperty(ratID)) {continue;}
      ratHtml.push(`<span class="rat" data-rat-uuid="${ratID}">${rats[ratID].attributes.name} ${rats[ratID].attributes.platform !== rescue.attributes.platform ? '<span class="badge badge-yellow">Wrong Platform!</span>' : ''}</span>`);
    }
    for (let rat of rescue.attributes.unidentifiedRats) {
      ratHtml.push(`<span class="rat-unidentified">${rat}</span> <span class="badge badge-yellow">unidentified</span>`);
    }

    if (ratHtml.length > 0) {
      detailContent +=
        '<tr class="rdetail-info"><td class="rdetail-info-title">Rats</td><td class="rdetail-info-value tbl-border-box">' +
        ratHtml[0] + '</td></tr>';
      if (ratHtml.length > 1) {
        for (let rh = 1; rh < ratHtml.length; rh++) {
          detailContent += `<tr class="rdetail-info"><td class="rdetail-info-empty"></td><td class="rdetail-info-value tbl-border-box">${ratHtml[rh]}</td></tr>`;
        }
      }
      detailContent += '<tr class="rdetail-info-seperator"><td class="tbl-border-none"></td><td></td></tr>'; // Separator
    }

    // Quotes
    if (rescue.attributes.quotes && rescue.attributes.quotes.length > 0) {

      let quotes = [];
      for (let quote of rescue.attributes.quotes) {
        // <span class="rdetail-quote-time">[${quote.createdAt}]</span> "<span class="rdetail-quote-message">${quote.message}</span>" - ${quote.author}
        quotes.push(`<span class="rdetail-quote-time">[${makeDateHumanReadable(new Date(quote.createdAt))}]</span> "<span class="rdetail-quote-message">${quote.message}</span>" - ${quote.lastAuthor}`);
      }

      detailContent += `<tr class="rdetail-info"><td class="rdetail-info-title">Quotes</td><td class="rdetail-info-value tbl-border-box">${quotes[0]}</td></tr>`;

      if (quotes.length > 1) {
        for (let q = 1; q < quotes.length; q++) {
          detailContent += `<tr class="rdetail-info"><td class="rdetail-info-empty"></td><td class="rdetail-info-value tbl-border-box">${quotes[q]}</td></tr>`;
        }
      }
    }
    detailContent += '</tbody></table>';

    // Update the detail section.

    window.console.debug(`fr.client.UpdateRescueDetail - Rescue DetailView Updated: ${rescue.id} :`, rescue);

    this.setHtml('#rescueDetailContent', detailContent);

    $(`button.btn.btn-detail[data-rescue-sid="${rescue.id.split('-')[0]}"]`).addClass('active'); // Set new active button.
    $('body').addClass('rdetail-active');

    if (!rescue.attributes.system) {
      return;
    }

    window.console.debug('fr.client.UpdateRescueDetail - Checking sysapi for additional system info.');
    this.getSystemHtml(rescue).then((html) => {
      this.setHtml(`span[data-system-name="${rescue.attributes.system.toUpperCase()}"]`, html);
    }).catch(() => {
      this.setHtml(`span[data-system-name="${rescue.attributes.system.toUpperCase()}"]`,
        '<a target="_blank" href="https://www.eddb.io/"><span class="badge badge-red" title="Go to EDDB.io" >NOT IN EDDB</span></a>');
    });
  }

  getSystemHtml(rescue) {
    if(!rescue) {
      return Promise.reject('');
    }
    return StarSystemAPI.getSystem(rescue.attributes.system).then((data) => {
      window.console.debug('this.UpdateRescueDetail - Additional info found! Adding system-related warnings and eddb link.');

      let sysInfo = data;
      let sysInfoHtml = '';

      if (sysInfo.attributes.needs_permit && sysInfo.attributes.needs_permit === 1) {
        sysInfoHtml += '<span class="badge badge-yellow" title="This system requires a permit!">PERMIT</span> ';
      }

      if (sysInfo.attributes.is_populated && sysInfo.attributes.is_populated === 1) {
        sysInfoHtml += ' <span class="badge badge-yellow" title="This system is populated, check for stations!">POPULATED</span> ';
      }

      if (sysInfo.bodies && sysInfo.bodies.length > 0) {
        let mainStar = sysInfo.bodies.find(function(body) {
          return body.attributes.is_main_star;
        });
        if (mainStar && frConst.scoopables.includes(mainStar.attributes.spectral_class)) {
          sysInfoHtml += ' <span class="badge badge-yellow" title="This system\'s main star is scoopable!">SCOOPABLE</span> ';
        } else if (sysInfo.bodies.length > 1 && sysInfo.bodies.filter((body) => frConst.scoopables.includes(body.attributes.spectral_class)).length > 0) {
          sysInfoHtml += ' <span class="badge badge-yellow" title="This system contains a scoopable star!">SCOOPABLE [SECONDARY]</span> ';
        }
      }

      if (sysInfo.id) {
        sysInfoHtml += `<a target="_blank" href="https://www.eddb.io/system/${sysInfo.id}"><span class="badge badge-green" title="View on EDDB.io" >EDDB</span></a>`;
      }
      return Promise.resolve(sysInfoHtml);
    });
  }
  setHtml(target, html) {
    $(target)
      .animate({ opacity: 0.2 }, 100)
      .html(html)
      .animate({ opacity: 1 }, 500);
  }
  replaceHtml(target, html) {
    $(target).replaceWith(html);
    $(target)
      .animate({opacity: 0.2}, 100)
      .animate({opacity: 1}, 500);
  }
  appendHtml(target, html) {
    $(target).append(html);
  }
}