/* globals Clipboard, RatSocket, StarSystems, Util */
fr.client = {

function getTimeSpan(date1, date2) {
    return Math.round(date1 / 1000) - Math.round(date2 / 1000);
}

// fr.config, fr.ws, and fr.sysapi are required. if they're not found, set to null.
fr.client = !fr.config || !fr.ws || !fr.sysapi  ? null : {
	currentToken: null,
  clipboard: null,
  CachedRescues: {},
  SelectedRescue: null,
  initComp: false,
  socket: null,
  sysApi: null,
  theme: 'default',

  init: function() {
    if (this.initComp) {
      window.console.debug("fr.client.init - init completed already!");
      return;
    }
    window.console.debug("fr.client.init - Client manager loaded.");
    $('#navbar-brand-title').text(fr.config.WebPageTitle);
    
    window.onpopstate = this.HandlePopState;
    window.onbeforeunload = () => {
        window.localStorage.setItem(`${fr.config.AppNamespace}.window.theme`, $('body').attr('style'));
    };

    if(!window.localStorage.getItem(`${fr.config.AppNamespace}.window.theme`)) {
      window.localStorage.setItem(`${fr.config.AppNamespace}.window.theme`, 'default');
    } else {
      this.theme = window.localStorage.getItem(`${fr.config.AppNamespace}.window.theme`);
    }
    if(this.theme !== 'default') {
      $('body').attr('style', this.theme);
    }

    $('body').on('click', 'button.btn.btn-detail', (event) => {
        this.SetSelectedRescue(event.currentTarget.dataset.rescueSid);
      }).on('click', '.class-toggle', (event) => {
        $(event.currentTarget.dataset.target).toggleClass(event.currentTarget.dataset.targetClass);
      }).on('click', 'a.panel-settings-toggle', (event) => {
        window.alert("This doesn't do anything yet. lol!");
        event.preventDefault();
      });

    if (Clipboard.isSupported()) {
      this.clipboard = new Clipboard('.btn-clipboard');
      $('body').addClass("clipboard-enable");
    }

    this.sysApi = new StarSystems();

    this.socket = new RatSocket(fr.config.WssURI);
    this.socket.on('ratsocket:reconnect', ctx => this.handleReconnect(ctx) )
               .on('rescue:created', (ctx, data) => this.AddRescue(ctx, data.data))
               .on('rescue:updated', (ctx, data) => this.UpdateRescue(ctx, data.data))
               .connect().then(() => this.socket.authenticate(fr.user.AuthHeader))
                         .then(() => this.socket.subscribe('0xDEADBEEF'))
                         .then(() => this.socket.request({action:'rescues:read',data: { 'open': 'true' }}))
                         .then(res => this.PopulateBoard(res.context, res.data))
                         .catch(error => window.console.error(error)); //TODO proper error handling, display shutter with error message.

    this.UpdateClocks();

    this.initComp = true;
  },
  handleReconnect: function(ctx) {
    ctx.request({
      'action': 'rescues:read',
      'data': {
        'open': 'true'
      },
      'meta': {
        'updateList': 'true'
      }
    });
  },
  PopulateBoard: function(ctx, data) {
    let rescues = data.data;
    for (let i in rescues) {
      if (rescues.hasOwnProperty(i)) {
        this.AddRescue(ctx, rescues[i]);
      }
      fr.client.initComp = true;
    } else {
      if (debug) console.log("fr.client.init - init completed already!");
    }
	},
  HandleTPA: function (tpa) {
    if(debug) console.log("fr.client.HandleTPA - New TPA: ", tpa);
    switch (tpa.meta.action) {
    case 'rescues:read':
      for (var i in tpa.data)
          fr.client.AddRescue(tpa.data[i]);
      fr.client.ParseQueryString();
      $('body').removeClass("loading");
      break;
    case 'rescue:created':
      fr.client.AddRescue(tpa.data);
      break;
    case 'rescue:updated':
      fr.client.UpdateRescue(tpa.data);
      break;
    case 'rats:read':
      fr.client.UpdateRats(tpa);
      break;
    case 'welcome':
    case 'stream:subscribe':
    case 'authorization':
      break;
    default:
      console.log("fr.client.Handle.TPA - Unhandled TPA: ", tpa);
      break;
    }
  },
  FetchRatInfo: function(ratId) {
    if (sessionStorage.getItem(`${fr.config.AppNamespace}.rat.${ratId}`)) {
      let ratData = JSON.parse(sessionStorage.getItem(`${fr.config.AppNamespace}.rat.${ratId}`));
      window.console.debug("fr.client.FetchRatInfo - Cached Rat Requested: ", ratData);
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
        sessionStorage.setItem(`${fr.config.AppNamespace}.rat.${ratId}`, JSON.stringify(res.data));
        return Promise.resolve(res.data);
      });
    }
  },
  UpdateRats: function (tpa) {
    var rat = $('.rat[data-rat-name="' + tpa.meta.searchId + '"]');
    if (tpa.data.length > 0) {
      var ratData = tpa.data[0];
      if(!sessionStorage.getItem("rat." + ratData.id)) {
        if(debug) console.log("fr.client.UpdateRats - Caching RatInfo: ", ratData);
        sessionStorage.setItem("rat." + ratData.id, JSON.stringify(ratData));
      }
      rat.text(ratData.CMDRname);
    } else {
      rat.html('<i>Not found</i>');
    }
  },
  ParseQueryString: function () {
    var activeRescue = $.getUrlParam("a");
    if(activeRescue && fr.client.CachedRescues[activeRescue])
      fr.client.SetSelectedRescue(activeRescue, true);
    else if(history.replaceState)
      window.history.replaceState({"a":null},document.title, window.location.pathname);
  },
  AddRescue: function(ctx, data) {
    if (!data) {
      return;
    }
    let rescue = data;
    let sid = rescue.id.split('-')[0];

    // Remove need to check for edge case conditions by resolving possible nulls when they arrive.
    if (rescue.data === null) {
      rescue.data = {};
    }
    if (rescue.system === null) {
      rescue.system = "";
    }

    // Ensure rescue doesn't already exist. If so, pass to update logic instead.
    if ($('tr.rescue[data-rescue-sid="' + sid + '"]').length > 0) {
      fr.client.UpdateRescue(tpa);
      return;
    }

    window.console.debug("fr.client.AddRescue: Rescue Added to board.");

    this.CachedRescues[sid] = rescue;
    this.appendHtml('#rescueTable', this.GetRescueTableRow(rescue));

    // Retrieve system information now to speed things up later on....
    this.sysApi.get(rescue.system).then(() => {
      window.console.debug("fr.client.AddRescue - Additional info found! Caching...");
    }).catch(() =>{
      window.console.debug("fr.client.AddRescue - No additional system information found.");
    });
  },
  UpdateRescue: function(ctx, data) {
    if (!data) {
      return;
    }
    let rescue = data;
    let sid = rescue.id.split('-')[0];
    let rescueRow = $(`tr.rescue[data-rescue-sid="${sid}"]`);
    if (!rescueRow) {
      window.console.debug("fr.client.UpdateRescue: Attempted to update a non-existant rescue: ", rescue);
      return;
    }
    if (!rescue.open) {
      setTimeout(function () { rescueRow.hide('slow').remove(); }, 5000);
      if(debug) console.log("fr.client.UpdateRescue - Rescue Removed: " + rescue.id + " : " + rescue.client);
      if(rescue.id && fr.client.SelectedRescue && rescue.id === fr.client.SelectedRescue.id) {
        fr.client.SetSelectedRescue(null);
      }
      delete fr.client.CachedRescues[sid];
      return;
    }
    if(debug) console.log("fr.client.UpdateRescue - Rescue Updated: " + rescue.id + " : " + rescue.client);
    rescueRow.replaceWith(fr.client.GetRescueTableRow(tpa));
    $('tr.rescue[data-rescue-sid="' + sid + '"]').animate({opacity: 0.2}, 100)
                                                 .animate({opacity: 1}, 500);
    fr.client.CachedRescues[sid] = rescue;
    if(rescue.id && fr.client.SelectedRescue && rescue.id === fr.client.SelectedRescue.id) {
      if(debug) console.log("fr.client.UpdateRescue - Rescue DetailView Updating: " + rescue.id + " : " + rescue.client);
      fr.client.SelectedRescue = rescue;
      fr.client.UpdateRescueDetail();
    }
  },
  /**
   * Forms the rescue table row HTML.
   * @param {Object} rescue - Object containing rescue info
   */
  GetRescueTableRow: function(rescue) {
    if (!rescue) {
      return;
    }
    let updateRatInfo = (tpa) => {
      let rat = $(`.rescue-row-rats > .rat[data-rat-uuid="${tpa.meta.searchId}"]`);
      if (tpa.data.length > 0) {
        let ratData = tpa.data[0];
        rat.text(ratData.CMDRname);
      } else {
        rat.html('<i>Rat not found!</i>').attr('title', tpa.meta.searchId);
      }
    };
    let catchRatError = (error) => {
      window.console.error('fr.client.UpdateRescueDetail - Rat info error: ', error);

      if(typeof error === "object" && 
            typeof error.meta === "object" && 
            typeof error.meta.searchId === "string") {
        $(`.rescue-row-rats > .rat[data-rat-uuid="${error.meta.searchId}"]`).html('<i>Connection Error</i>').attr('title', error.meta.searchId);
      }
    };

    let shortid = rescue.id.split('-')[0];
    let rats = rescue.rats;
    let ratHtml = [];
    for (let rat in rats) {
      if (rats.hasOwnProperty(rat)) {
        this.FetchRatInfo(rats[rat])
          .then(updateRatInfo)
          .catch(catchRatError);
        ratHtml.push(`<span class="rat" data-rat-uuid="${rescue.rats[rat]}"><i>Loading</i></span>`);
      }
    }

    for (let rat in rescue.unidentifiedRats) {
      if (rescue.unidentifiedRats.hasOwnProperty(rat)) {
        ratHtml.push(`<span class="rat-unidentified"><i>${rescue.unidentifiedRats[rat]}</i></span>`);
      }
    }

    let language = rescue.data.langID ? fr.const.language[rescue.data.langID] ? fr.const.language[rescue.data.langID] : {
        "short": rescue.data.langID,
        "long": rescue.data.langID
      } :
      fr.const.language.unknown;

    let platform = rescue.platform ? fr.const.platform[rescue.platform] : fr.const.platform.unknown;

    let row = $(`<tr class="rescue" data-rescue-sid="${shortid}">` +
      `<td class="rescue-row-index">${typeof rescue.data.boardIndex === "number" ? rescue.data.boardIndex : '?'}</td>` +
      `<td class="rescue-row-client" title="${rescue.data.IRCNick || ''}">${rescue.client || '?'}</td>` +
      `<td class="rescue-row-language" title="${language.long}">${language.short}</td>` +
      `<td class="rescue-row-platform" title="${platform.long}">${platform.short}</td>` +
      `<td class="rescue-row-system btn-clipboard" data-clipboard-text="${rescue.system}">${rescue.system} <i class="fa fa-clipboard" title="Click to Copy!"></i></td>` +
      `<td class="rescue-row-rats">${ratHtml.join(', ')}</td>` +
      `<td class="rescue-row-detail"><button type="button" class="btn btn-detail" data-rescue-sid="${shortid}"><span class="fa fa-info" aria-hidden="true"></span></button></td>` +
      '</tr>');

    if (rescue.epic) {
      row.addClass('rescue-epic');
    } else {
      row.removeClass('rescue-epic');
    }
    if (rescue.codeRed) {
      row.addClass('rescue-codered');
    } else {
      row.removeClass('rescue-codered');
    }
    if (!rescue.active) {
      row.addClass('rescue-inactive');
    } else {
      row.removeClass('rescue-inactive');
    }
    var notes = rescue.quotes.join('\n');
    row.attr('title', notes);
    return row;
  },
  UpdateClocks: function () {
    var nowTime = new Date();

    $('.ed-clock').text((nowTime.getUTCFullYear() + 1286) +
      ' ' + ( fr.const.monthString[nowTime.getUTCMonth()] ) +
      ' ' + (nowTime.getUTCDate()     < 10 ? '0' : '') + nowTime.getUTCDate()    +
      ' ' + (nowTime.getUTCHours()    < 10 ? '0' : '') + nowTime.getUTCHours()   +
      ':' + (nowTime.getUTCMinutes()  < 10 ? '0' : '') + nowTime.getUTCMinutes() +
      ':' + (nowTime.getUTCSeconds()  < 10 ? '0' : '') + nowTime.getUTCSeconds());

    if (this.SelectedRescue !== null) {
      $('.rdetail-timer').text(Util.getTimeSpanString(nowTime, Date.parse(this.SelectedRescue.createdAt)))
          .prop('title', 'Last Updated: ' + Util.getTimeSpanString(nowTime, Date.parse(this.SelectedRescue.updatedAt)));
    }

    setTimeout(fr.client.UpdateClocks, 1000 - nowTime.getMilliseconds());
  },
  SetSelectedRescue: function (key, preventPush) {
    if(key === null || (fr.client.SelectedRescue && key == fr.client.SelectedRescue.id.split('-')[0])) {
      fr.client.SelectedRescue = null;
      if(history.pushState && !preventPush)
        window.history.pushState({"a":null},document.title, window.location.pathname);
      fr.client.UpdateRescueDetail();
      return;
    }
    if(!fr.client.CachedRescues[key]) {
      console.log("fr.client.SetSelectedRescue - invalid key: " + key);
      return;
    }
    if(debug) console.log("fr.client.SetSelectedRescue - New SelectedRescue: " + fr.client.CachedRescues[key].id);
    fr.client.SelectedRescue = fr.client.CachedRescues[key];
    if(history.pushState && !preventPush)
      window.history.pushState({"a":key},document.title, window.location.pathname + '?a=' + encodeURIComponent(key));
    fr.client.UpdateRescueDetail();
  },
  UpdateRescueDetail: function () {
    $('button.btn-detail.active').removeClass('active');     // clear active buttons.

    if (!fr.client.SelectedRescue) {
      $('body').removeClass('rdetail-active');
      return;
    }

    var rescue = fr.client.SelectedRescue;

    //Construct detail html.
    var detailContent = '<div class="rdetail-header">' +
                          '<div class="rdetail-title">' + (rescue.data ? rescue.data.boardIndex !== null || resuce.data.boardIndex !== null ? '#' + rescue.data.boardIndex + ' - '  : '' : '') + (rescue.title ? rescue.title : rescue.client) + (rescue.codeRed ? ' <span class="badge badge-red">Code Red</span>' : '') + (rescue.active ? '' : ' <span class="badge badge-yellow">Inactive</span>') + '</div>' +
                          '<div class="rdetail-timer">00:00:00</div>' +
                        '</div>' +
                        '<table class="rdetail-body table table-rescue">' +
                            '<thead><td width="90px"></td><td></td></thead>' +
                            '<tbody>' +
                              (rescue.data ? rescue.data.IRCNick ? '<tr class="rdetail-info"><td class="rdetail-info-title">IRC Nick</td><td class="rdetail-info-value">' + rescue.data.IRCNick + '</td></tr>' : '' : '') +
                              (rescue.system                     ? '<tr class="rdetail-info"><td class="rdetail-info-title">System</td><td class="rdetail-info-value">' + rescue.system + '<span class="float-right system-apidata" data-system-name="' + rescue.system.toUpperCase() +'"><i>Retrieving info...</i</span></td></tr>' : '') +
                              (rescue.platform                   ? '<tr class="rdetail-info"><td class="rdetail-info-title">Platform</td><td class="rdetail-info-value">' + (fr.const && fr.const.platform[rescue.platform] ? fr.const.platform[rescue.platform].long : rescue.platform) + '</td></tr>' : '') +
                              (rescue.data ? rescue.data.langID  ? '<tr class="rdetail-info"><td class="rdetail-info-title">Language</td><td class="rdetail-info-value">' + (fr.const && fr.const.language[rescue.data.langID] ? fr.const.language[rescue.data.langID].long + ' (' + fr.const.language[rescue.data.langID].short + ')' : rescue.data.langID) + '</td></tr>' : '' : '') +
                                                                   '<tr class="rdetail-info"><td class="rdetail-info-title">UUID</td><td class="rdetail-info-value">' + rescue.id + '</td></tr>' +
                                                                   '<tr class="rdetail-info-seperator"><td class="tbl-border-none"></td><td></td></tr>';
    
    // Rats
    var ratHtml = [];
    for (var rat in rescue.rats) {
      var rInfo = fr.client.FetchRatInfo(rescue.rats[rat]);
      ratHtml.push('<span class="rat rat-name" data-rat-name="' + rescue.rats[rat] + '">' + (rInfo !== null ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
    }

    for (var uRat in rescue.unidentifiedRats) {
      ratHtml.push('<span class="rat-unidentified">' + rescue.unidentifiedRats[uRat] + '</span> <span class="badge badge-yellow">unidentified</span>');
    }
    if(ratHtml.length > 0) {
      detailContent += '<tr class="rdetail-info"><td class="rdetail-info-title">Rats</td><td class="rdetail-info-value tbl-border-box">' + ratHtml[0] + '</td></tr>';
      if(ratHtml.length > 1)
        for(var rh = 1 ; rh < ratHtml.length ; rh++)
          detailContent +='<tr class="rdetail-info"><td class="rdetail-info-empty"></td><td class="rdetail-info-value tbl-border-box">' + ratHtml[rh] + '</td></tr>';
      detailContent += '<tr class="rdetail-info-seperator"><td class="tbl-border-none"></td><td></td></tr>'; // Separator
    }

    // Quotes
    if(rescue.quotes.length > 0) {
      detailContent += '<tr class="rdetail-info"><td class="rdetail-info-title">Quotes</td><td class="rdetail-info-value tbl-border-box">' + (rescue.quotes.length > 0 ? rescue.quotes[0] : '<i>None</i>') + '</td></tr>';
      if(rescue.quotes.length > 1)
        for(var q = 1 ; q < rescue.quotes.length ; q++)
          detailContent +='<tr class="rdetail-info"><td class="rdetail-info-empty"></td><td class="rdetail-info-value tbl-border-box">' + rescue.quotes[q] + '</td></tr>';
    }

    detailContent +='</tbody></table>';

    //Update the detail section.
    if(debug) console.log("fr.client.UpdateRescueDetail - Rescue DetailView Updated: " + rescue.id + " : " + rescue.client);
    $('#rescueDetailContent').animate({opacity: 0.2}, 100).html(detailContent).animate({opacity: 1}, 500);
    $('button.btn.btn-detail[data-rescue-sid="'+rescue.id.split('-')[0] + '"]').addClass('active'); // Set new active button.
    $('body').addClass('rdetail-active');

    if (!rescue.system) {
      return;
    }

    window.console.debug("fr.client.UpdateRescueDetail - Checking sysapi for additional system info.");
    this.getSystemHtml(rescue).then((html) => {
      this.setHtml(`span[data-system-name="${rescue.system.toUpperCase()}"]`, html);
    }).catch(() => {
      this.setHtml(`span[data-system-name="${rescue.system.toUpperCase()}"]`,
                   '<a target="_blank" href="https://www.eddb.io/"><span class="badge badge-red" title="Go to EDDB.io" >NOT IN EDDB</span></a>');
    });
  },
  getSystemHtml: function(rescue) {
    if(!rescue) {
      return Promise.reject("");
    }
    return this.sysApi.get(rescue.system).then((data) => {
      window.console.debug("this.UpdateRescueDetail - Additional info found! Adding system-related warnings and eddb link.");

      let sysInfo = data;
      let sysName = sysInfo.attributes.name.toUpperCase();
      let sysInfoHtml = '';

      if (sysInfo.attributes.needs_permit && sysInfo.attributes.needs_permit === 1) {
        sysInfoHtml += '<span class="badge badge-yellow" title="This system requires a permit!">PERMIT</span> ';
      }

      if (sysInfo.attributes.is_populated && sysInfo.attributes.is_populated === 1) {
        sysInfoHtml += ' <span class="badge badge-yellow" title="This system is populated, check for stations!">POPULATED</span> ';
      }

      if (sysInfo.bodies && sysInfo.bodies.length > 0) {
        var mainStar = sysInfo.bodies.find(function (body) {
          return body.attributes.is_main_star;
        });
        if(mainStar && fr.const.scoopables.includes(mainStar.attributes.spectral_class)){
          sysInfoHtml += ' <span class="badge badge-yellow" title="This system\'s main star is scoopable!">SCOOPABLE</span> ';
        } else if (sysInfo.bodies.length > 1 && sysInfo.bodies.filter(function(body){return fr.const.scoopables.includes(body.attributes.spectral_class);}).length > 0) {
          sysInfoHtml += ' <span class="badge badge-yellow" title="This system contains a scoopable star!">SCOOPABLE [SECONDARY]</span> ';
        }
      }

      if(sysInfo.id) {
        sysInfoHtml += '<a target="_blank" href="https://www.eddb.io/system/' + sysInfo.id + '"><span class="badge badge-green" title="View on EDDB.io" >EDDB</span></a>';
      }
      $('span[data-system-name="' + sysName + '"]').animate({opacity: 0.2}, 100).html(sysInfoHtml).animate({opacity: 1}, 500);
    }, function() {
      $('span[data-system-name="' + rescue.system.toUpperCase() + '"]').animate({opacity: 0.2}, 100).html('<a target="_blank" href="https://www.eddb.io/"><span class="badge badge-red" title="Go to EDDB.io" >NOT IN EDDB</span></a>').animate({opacity: 1}, 500);
    }); 
  }
};