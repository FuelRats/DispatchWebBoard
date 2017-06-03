/* globals Clipboard, getTimeSpanString */
// fr.config, fr.ws, and fr.sysapi are required. if they're not found, set to null.
fr.client = !fr.config || !fr.ws || !fr.sysapi ? null : {
  currentToken: null,
  clipboard: null,
  CachedRescues: {},
  SelectedRescue: null,
  initComp: false,
  init: function() {
    if (!fr.client.initComp) {
      if (debug) {
        window.console.log("fr.client.init - fr.Client loaded. DEBUG MODE ACTIVE.");
      }
      window.onpopstate = fr.client.HandlePopState;
      fr.ws.HandleTPA = fr.client.HandleTPA;
      fr.ws.send('rescues:read', {
        'open': 'true'
      }, {});
      fr.client.UpdateClocks();
      $('#navbar-brand-title').text(fr.config.WebPageTitle);
      $('body').on('click', 'button.btn.btn-detail', function() {
        fr.client.SetSelectedRescue($(this).data('rescue-sid'));
      }).on('click', 'button.btn.btn-nav-toggle', function() {
        $($(this).data('target')).toggleClass('expand');
        $(this).toggleClass('active');
      });
      if (Clipboard.isSupported()) {
        fr.client.clipboard = new Clipboard('.btn-clipboard');
        $('body').addClass("clipboard-enable");
      }
      fr.client.initComp = true;
    } else {
      if (debug) {
        window.console.log("fr.client.init - init completed already!");
      }
    }
  },
  HandleTPA: function(tpa) {
    if (debug) {
      window.console.log("fr.client.HandleTPA - New TPA: ", tpa);
    }
    switch (tpa.meta.action) {
      case 'rescues:read':
        fr.client.AddExistingRescues(tpa.data);
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
        window.console.log("fr.client.Handle.TPA - Unhandled TPA: ", tpa);
        break;
    }
  },
  AddExistingRescues: function(tpa) {
    for (let i in tpa) {
      if (tpa.hasOwnProperty(i)) {
        fr.client.AddRescue(tpa[i]);
      }
    }
    fr.client.ParseQueryString();
    $('body').removeClass("loading");
  },
  FetchRatInfo: function(ratId) {
    if (sessionStorage.getItem("rat." + ratId)) {
      let ratData = JSON.parse(sessionStorage.getItem("rat." + ratId));
      if (debug) {
        window.console.log("fr.client.FetchRatInfo - Cached Rat Requested: ", ratData);
      }
      return ratData;
    } else {
      if (debug) {
        window.console.log("fr.client.FetchRatInfo - Gathering RatInfo: " + ratId);
      }
      fr.ws.send('rats:read', {
        'id': ratId
      }, {
        'searchId': ratId
      });
      return null;
    }
  },
  UpdateRats: function(tpa) {
    let rat = $('.rat[data-rat-name="' + tpa.meta.searchId + '"]');
    if (tpa.data.length > 0) {
      let ratData = tpa.data[0];
      if (!sessionStorage.getItem("rat." + ratData.id)) {
        if (debug) {
          window.console.log("fr.client.UpdateRats - Caching RatInfo: ", ratData);
        }
        sessionStorage.setItem("rat." + ratData.id, JSON.stringify(ratData));
      }
      rat.text(ratData.CMDRname);
    } else {
      rat.html('<i>Not found</i>');
    }
  },
  ParseQueryString: function() {
    let activeRescue = $.getUrlParam("a");
    if (activeRescue && fr.client.CachedRescues[activeRescue]) {
      fr.client.SetSelectedRescue(activeRescue, true);
    } else if (history.replaceState) {
      window.history.replaceState({
        "a": null
      }, document.title, window.location.pathname);
    }
  },
  HandlePopState: function(event) {
    fr.client.SetSelectedRescue(event.state.a, true);
  },
  AddRescue: function(tpa) {
    if (!tpa) {
      return;
    }
    let rescue = tpa;
    let sid = rescue.id.split('-')[0];
    // Ensure rescue doesn't already exist. If so, pass to update logic instead.
    if ($('tr.rescue[data-rescue-sid="' + sid + '"]').length > 0) {
      fr.client.UpdateRescue(tpa);
      return;
    }
    if (debug) {
      window.console.log("fr.client.AddRescue: Rescue Added to board.");
    }
    fr.client.CachedRescues[sid] = rescue;
    $('#rescueTable').append(fr.client.GetRescueTableRow(tpa));
  },
  UpdateRescue: function(tpa) {
    if (!tpa) {
      return;
    }
    let rescue = tpa;
    let sid = rescue.id.split('-')[0];
    let rescueRow = $('tr.rescue[data-rescue-sid="' + sid + '"]');
    if (!rescueRow) {
      if (debug) {
        window.console.log("fr.client.UpdateRescue: Attempted to update a non-existant rescue: ", rescue);
      }
      return;
    }
    if (!rescue.open) {
      setTimeout(function() {
        rescueRow.hide('slow').remove();
      }, 5000);
      if (debug) {
        window.console.log("fr.client.UpdateRescue - Rescue Removed: " + rescue.id + " : " + rescue.client);
      }
      if (rescue.id && fr.client.SelectedRescue && rescue.id === fr.client.SelectedRescue.id) {
        fr.client.SetSelectedRescue(null);
      }
      delete fr.client.CachedRescues[sid];
      return;
    }
    if (debug) {
      window.console.log("fr.client.UpdateRescue - Rescue Updated: " + rescue.id + " : " + rescue.client);
    }
    rescueRow.replaceWith(fr.client.GetRescueTableRow(tpa));
    $('tr.rescue[data-rescue-sid="' + sid + '"]').animate({
        opacity: 0.2
      }, 100)
      .animate({
        opacity: 1
      }, 500);
    fr.client.CachedRescues[sid] = rescue;
    if (rescue.id && fr.client.SelectedRescue && rescue.id === fr.client.SelectedRescue.id) {
      if (debug) {
        window.console.log("fr.client.UpdateRescue - Rescue DetailView Updating: " + rescue.id + " : " + rescue.client);
      }
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
    let shortid = rescue.id.split('-')[0];
    let rats = rescue.rats;
    let ratHtml = [];
    for (let rat in rats) {
      if (rats.hasOwnProperty(rat)) {
        let rInfo = fr.client.FetchRatInfo(rats[rat]);
        ratHtml.push('<span class="rat rat-name" data-rat-name="' + rescue.rats[rat] + '">' + (rInfo ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
      }
    }
    for (let rat in rescue.unidentifiedRats) {
      if (rescue.unidentifiedRats.hasOwnProperty(rat)) {
        ratHtml.push('<span class="rat-unidentified"><i>' + rescue.unidentifiedRats[rat] + '</i></span>');
      }
    }
    let row = $('<tr class="rescue" data-rescue-sid="' + shortid + '">' +
      '<td class="rescue-row-index">' + (rescue.data ? rescue.data.boardIndex !== undefined || rescue.data.boardIndex !== null ? rescue.data.boardIndex : '?' : '?') + '</td>' +
      '<td class="rescue-row-client" title="' + (rescue.data ? rescue.data.IRCNick ? 'Nick: ' + rescue.data.IRCNick : '' : '') + '">' + (rescue.client ? rescue.client : '?') + '</td>' +
      '<td class="rescue-row-language"' + (rescue.data && rescue.data.langID ? fr.const && fr.const.language[rescue.data.langID] ? 'title="' + fr.const.language[rescue.data.langID].long + '">' + fr.const.language[rescue.data.langID].short : '>' + rescue.data.langID : '>?') + '</td>' +
      '<td class="rescue-row-platform"' + (rescue.platform ? fr.const && fr.const.platform[rescue.platform] ? 'title="' + fr.const.platform[rescue.platform].long + '">' + fr.const.platform[rescue.platform].short : '>' + rescue.platform : '>?') + '</td>' +
      '<td class="rescue-row-system' + (rescue.system ? ' btn-clipboard" data-clipboard-text="' + rescue.system + '">' + rescue.system + '<i class="fa fa-clipboard" title="Click to Copy!"></i>' : '">') + '</td>' +
      '<td class="rescue-row-rats">' + ratHtml.join(', ') + '</td>' +
      '<td class="rescue-row-detail"><button type="button" class="btn btn-detail" data-rescue-sid="' + shortid + '"><span class="fa fa-info" aria-hidden="true"></span></button></td>' +
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
    let notes = rescue.quotes.join('\n');
    row.attr('title', notes);
    return row;
  },
  UpdateClocks: function() {
    let nowTime = new Date();

    $('.ed-clock').text((nowTime.getUTCFullYear() + 1286) +
      ' ' + fr.const.monthString[nowTime.getUTCMonth()] +
      ' ' + (nowTime.getUTCDate() < 10 ? '0' : '') + nowTime.getUTCDate() +
      ' ' + (nowTime.getUTCHours() < 10 ? '0' : '') + nowTime.getUTCHours() +
      ':' + (nowTime.getUTCMinutes() < 10 ? '0' : '') + nowTime.getUTCMinutes() +
      ':' + (nowTime.getUTCSeconds() < 10 ? '0' : '') + nowTime.getUTCSeconds());

    if (fr.client.SelectedRescue !== null) {
      $('.rdetail-timer').text(getTimeSpanString(nowTime, Date.parse(fr.client.SelectedRescue.createdAt)));
      $('.rdetail-timer').prop('title', 'Last Updated: ' + getTimeSpanString(nowTime, Date.parse(fr.client.SelectedRescue.updatedAt)));
    }

    setTimeout(fr.client.UpdateClocks, 1000 - nowTime.getMilliseconds());
  },
  SetSelectedRescue: function(key, preventPush) {
    if (key === null || fr.client.SelectedRescue && key.toString() === fr.client.SelectedRescue.id.split('-')[0]) {
      fr.client.SelectedRescue = null;
      if (history.pushState && !preventPush) {
        window.history.pushState({
          "a": null
        }, document.title, window.location.pathname);
      }
      fr.client.UpdateRescueDetail();
      return;
    }
    if (!fr.client.CachedRescues[key]) {
      window.console.log("fr.client.SetSelectedRescue - invalid key: " + key);
      return;
    }
    if (debug) {
      window.console.log("fr.client.SetSelectedRescue - New SelectedRescue: " + fr.client.CachedRescues[key].id);
    }
    fr.client.SelectedRescue = fr.client.CachedRescues[key];
    if (history.pushState && !preventPush) {
      window.history.pushState({
        "a": key
      }, document.title, window.location.pathname + '?a=' + encodeURIComponent(key));
    }
    fr.client.UpdateRescueDetail();
  },
  UpdateRescueDetail: function() {
    $('button.btn-detail.active').removeClass('active'); // clear active buttons.

    if (!fr.client.SelectedRescue) {
      $('body').removeClass('rdetail-active');
      return;
    }

    let rescue = fr.client.SelectedRescue;

    //Construct detail html.
    let detailContent = '<div class="rdetail-header">' +
      '<div class="rdetail-title">' + (rescue.data ? rescue.data.boardIndex !== undefined && rescue.data.boardIndex !== null ? '#' + rescue.data.boardIndex + ' - ' : '' : '') + (rescue.title ? rescue.title : rescue.client) + (rescue.codeRed ? ' <span class="badge badge-red">Code Red</span>' : '') + (rescue.active ? '' : ' <span class="badge badge-yellow">Inactive</span>') + '</div>' +
      '<div class="rdetail-timer">00:00:00</div>' +
      '</div>' +
      '<table class="rdetail-body table table-rescue">' +
      '<thead><td width="90px"></td><td></td></thead>' +
      '<tbody>' +
      (rescue.data ? rescue.data.IRCNick ? '<tr class="rdetail-info"><td class="rdetail-info-title">IRC Nick</td><td class="rdetail-info-value">' + rescue.data.IRCNick + '</td></tr>' : '' : '') +
      (rescue.system ? '<tr class="rdetail-info"><td class="rdetail-info-title">System</td><td class="rdetail-info-value">' + rescue.system + '<span class="float-right system-apidata" data-system-name="' + rescue.system.toUpperCase() + '"><i>Retrieving info...</i</span></td></tr>' : '') +
      (rescue.platform ? '<tr class="rdetail-info"><td class="rdetail-info-title">Platform</td><td class="rdetail-info-value">' + (fr.const && fr.const.platform[rescue.platform] ? fr.const.platform[rescue.platform].long : rescue.platform) + '</td></tr>' : '') +
      (rescue.data ? rescue.data.langID ? '<tr class="rdetail-info"><td class="rdetail-info-title">Language</td><td class="rdetail-info-value">' + (fr.const && fr.const.language[rescue.data.langID] ? fr.const.language[rescue.data.langID].long + ' (' + fr.const.language[rescue.data.langID].short + ')' : rescue.data.langID) + '</td></tr>' : '' : '') +
      '<tr class="rdetail-info"><td class="rdetail-info-title">UUID</td><td class="rdetail-info-value">' + rescue.id + '</td></tr>' +
      '<tr class="rdetail-info-seperator"><td class="tbl-border-none"></td><td></td></tr>';

    // Rats
    let ratHtml = [];
    for (let rat in rescue.rats) {
      if (rescue.rats.hasOwnProperty(rat)) {
        let rInfo = fr.client.FetchRatInfo(rescue.rats[rat]);
        ratHtml.push('<span class="rat rat-name" data-rat-name="' + rescue.rats[rat] + '">' + (rInfo !== null ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
      }
    }

    for (let rat in rescue.unidentifiedRats) {
      if (rescue.unidentifiedRats.hasOwnProperty(rat)) {
        ratHtml.push('<span class="rat-unidentified">' + rescue.unidentifiedRats[rat] + '</span> <span class="badge badge-yellow">unidentified</span>');
      }
    }
    if (ratHtml.length > 0) {
      detailContent += '<tr class="rdetail-info"><td class="rdetail-info-title">Rats</td><td class="rdetail-info-value tbl-border-box">' + ratHtml[0] + '</td></tr>';
      if (ratHtml.length > 1) {
        for (let rh = 1; rh < ratHtml.length; rh++) {
          detailContent += '<tr class="rdetail-info"><td class="rdetail-info-empty"></td><td class="rdetail-info-value tbl-border-box">' + ratHtml[rh] + '</td></tr>';
        }
      }
      detailContent += '<tr class="rdetail-info-seperator"><td class="tbl-border-none"></td><td></td></tr>'; // Separator
    }

    // Quotes
    if (rescue.quotes.length > 0) {
      detailContent += '<tr class="rdetail-info"><td class="rdetail-info-title">Quotes</td><td class="rdetail-info-value tbl-border-box">' + (rescue.quotes.length > 0 ? rescue.quotes[0] : '<i>None</i>') + '</td></tr>';
      if (rescue.quotes.length > 1) {
        for (let q = 1; q < rescue.quotes.length; q++) {
          detailContent += '<tr class="rdetail-info"><td class="rdetail-info-empty"></td><td class="rdetail-info-value tbl-border-box">' + rescue.quotes[q] + '</td></tr>';
        }
      }
    }

    detailContent += '</tbody></table>';

    //Update the detail section.
    if (debug) {
      window.console.log("fr.client.UpdateRescueDetail - Rescue DetailView Updated: " + rescue.id + " : " + rescue.client);
    }
    $('#rescueDetailContent').animate({
      opacity: 0.2
    }, 100).html(detailContent).animate({
      opacity: 1
    }, 500);
    $('button.btn.btn-detail[data-rescue-sid="' + rescue.id.split('-')[0] + '"]').addClass('active'); // Set new active button.
    $('body').addClass('rdetail-active');

    if (!rescue.system) {
      return;
    }
    if (debug) {
      window.console.log("fr.client.UpdateRescueDetail - Checking sysapi for additional system info.");
    }
    fr.sysapi.GetSysInfo(rescue.system, function(data) {
      if (debug) {
        window.console.log("fr.client.UpdateRescueDetail - Additional info found! Adding system-related warnings and eddb link.");
      }
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
        let mainStar = sysInfo.bodies.find(function(body) {
          return body.attributes.is_main_star;
        });
        if (mainStar && fr.const.scoopables.includes(mainStar.attributes.spectral_class)) {
          sysInfoHtml += ' <span class="badge badge-yellow" title="This system\'s main star is scoopable!">SCOOPABLE</span> ';
        } else if (sysInfo.bodies.length > 1 && sysInfo.bodies.filter(function(body) {
            return fr.const.scoopables.includes(body.attributes.spectral_class);
          }).length > 0) {
          sysInfoHtml += ' <span class="badge badge-yellow" title="This system contains a scoopable star!">SCOOPABLE [SECONDARY]</span> ';
        }
      }

      if (sysInfo.id) {
        sysInfoHtml += '<a target="_blank" href="https://www.eddb.io/system/' + sysInfo.id + '"><span class="badge badge-green" title="View on EDDB.io" >EDDB</span></a>';
      }
      $('span[data-system-name="' + sysName + '"]').animate({
        opacity: 0.2
      }, 100).html(sysInfoHtml).animate({
        opacity: 1
      }, 500);
    }, function() {
      $('span[data-system-name="' + rescue.system.toUpperCase() + '"]').animate({
        opacity: 0.2
      }, 100).html('<a target="_blank" href="https://www.eddb.io/"><span class="badge badge-red" title="Go to EDDB.io" >NOT IN EDDB</span></a>').animate({
        opacity: 1
      }, 500);
    });
  }
};