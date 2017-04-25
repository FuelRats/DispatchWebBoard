var fr = fr !== undefined ? fr : {};
var debug = debug !== undefined ? debug : false;

function getTimeSpan(date1, date2) {
    return Math.round(date1 / 1000) - Math.round(date2 / 1000);
}

// fr.config, fr.ws, and fr.sysapi are required. if they're not found, set to null. TODO: Add sysapi
fr.client = !fr.config || !fr.ws ? null : {
	currentToken: null,
  CachedRescues: {},
  CachedRats: {},
  SelectedRescue: null,
  initComp: false,
	init: function() {
    if(!fr.client.initComp) {
      if (debug) console.log("fr.client.init - fr.Client loaded. DEBUG MODE ACTIVE.");
      window.onpopstate = fr.client.HandlePopState;
      fr.ws.HandleTPA = fr.client.HandleTPA;
      fr.ws.send('rescues:read', { 'open': 'true' },{});
      fr.client.UpdateClocks();
      $('#navbar-brand-title').text(fr.config.WebPageTitle);
      $('body').on('click', 'button.btn-fr-detail',function(e) {
        fr.client.SetSelectedRescue($(this).data('rescue-id'));
      });
      fr.client.initComp = true;
    } else {
      if (debug) console.log("fr.client.init - init completed already!");
    }
	},
  HandleTPA: function (tpa) {
    if(debug) console.log("fr.client.HandleTPA - New TPA");
    if(debug) console.log(tpa);
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
      console.log("Unhandled TPA");
      console.log(tpa);
      break;
    }
  },
  FetchRatInfo: function (ratId) {
    if (fr.client.CachedRats[ratId]) {
      if(debug) console.log("fr.client.FetchRatInfo - Cached Rat Requested: ");
      if(debug) console.log(fr.client.CachedRats[ratId]);
      return fr.client.CachedRats[ratId];
    } else {
      if(debug) console.log("fr.client.FetchRatInfo - Gathering RatInfo: " + ratId);
      fr.ws.send('rats:read', { 'id': ratId }, { 'searchId': ratId });
      return null;
    }
  },
  UpdateRats: function (tpa) {
    var rat = $('.rat-' + tpa.meta.searchId);
    if (tpa.data.length > 0) {
      if(!fr.client.CachedRats[tpa.data[0].id]) {
        if(debug) console.log("fr.client.UpdateRats - Caching RatInfo:  " + tpa.data[0].id + " : " + tpa.data[0].CMDRname);
        fr.client.CachedRats[tpa.data[0].id] = tpa.data[0];
      }
      rat.text(tpa.data[0].CMDRname);
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
  HandlePopState: function (event) {
    fr.client.SetSelectedRescue(event.state.a, true);
  },
  AddRescue: function (tpa) {
    if(!tpa) return;
    var rescue = tpa;
    var sid = rescue.id.split('-')[0];
    // Ensure rescue doesn't already exist. If so, pass to update logic instead.
    if ($('#rescue-' + sid).length > 0) {
      fr.client.UpdateRescue(tpa);
      return;
    }
    if(debug) console.log("fr.client.AddRescue: Rescue Added to board.");
    fr.client.CachedRescues[sid] = rescue;
    $('#rescueTable').append(fr.client.GetRescueTableRow(tpa)); 
  },
  UpdateRescue: function (tpa) {
    if(!tpa) return;
    var rescue = tpa;
    var sid = rescue.id.split('-')[0];
    var rescueRow = $('#rescue-' + sid);
    if(!rescueRow) {
      if(debug) console.log("fr.client.UpdateRescue: Attempted to update a non-existant rescue.");
      if(debug) console.log(rescue);
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
    $('#rescue-' + sid).animate({opacity: 0.2}, 100)
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
  GetRescueTableRow: function (rescue) {
    if (!rescue) return;
    var shortid = rescue.id.split('-')[0];
    var rats = rescue.rats;
    var ratHtml = [];
    for (var r in rats) {
      var rInfo = fr.client.FetchRatInfo(rats[r]);
      ratHtml.push('<span class="rat-' + rats[r] + '">' + (rInfo ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
    }
    for (var uRat in rescue.unidentifiedRats) {
      ratHtml.push('<span class="rat-unidentified"><i>' + rescue.unidentifiedRats[uRat] + '</i></span>');
    }
    var row = $('<tr id="rescue-' + rescue.id.split('-')[0] + '">' +
                  '<td>' + (rescue.data ? rescue.data.boardIndex !== undefined || rescue.data.boardIndex !== null ? rescue.data.boardIndex : '?' : '?') + '</td>' +
                  '<td title="' + (rescue.data ? rescue.data.IRCNick ? 'Nick: ' + rescue.data.IRCNick : '' : '') + '">' + (rescue.client ? rescue.client : '?') + '</td>' +
                  '<td>' + (rescue.data && rescue.data.langID ? rescue.data.langID.toUpperCase().replace("UNKNOWN", "N/A") : '?') + '</td>' +
                  '<td>' + (rescue.platform ? fr.const ? fr.const.platformHumanReadable.short[rescue.platform] : rescue.platform : '?') + '</td>' +
                  '<td>' + (rescue.system ? rescue.system : '') + '</td>' +
                  '<td>' + ratHtml.join(', ') + '</td>' +
                  '<td><button id="detailBtn-'+ shortid +'" type="button" class="btn btn-detail" data-rescue-id="' + shortid + '"><span class="fa fa-info" aria-hidden="true"></span></button></td>' +
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
      '-' + ((nowTime.getUTCMonth() + 1)    < 10 ? '0' : '') + (nowTime.getUTCMonth() + 1) +
      '-' + (nowTime.getUTCDate()     < 10 ? '0' : '') + nowTime.getUTCDate()    +
      ' ' + (nowTime.getUTCHours()    < 10 ? '0' : '') + nowTime.getUTCHours()   +
      ':' + (nowTime.getUTCMinutes()  < 10 ? '0' : '') + nowTime.getUTCMinutes() +
      ':' + (nowTime.getUTCSeconds()  < 10 ? '0' : '') + nowTime.getUTCSeconds());

    if(fr.client.SelectedRescue !== null) {
      $('.rdetail-timer').text(getTimeSpanString(nowTime,Date.parse(fr.client.SelectedRescue.createdAt)));
      $('.rdetail-timer').prop('title', 'Last Updated: ' + getTimeSpanString(nowTime,Date.parse(fr.client.SelectedRescue.updatedAt)));
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
      console.log("SetSelectedRescue - invalid key: " + key);
      return;
    }
    if(debug) console.log("SetSelectedRescue - New SelectedRescue: " + fr.client.CachedRescues[key].id);
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
                              (rescue.system                     ? '<tr class="rdetail-info"><td class="rdetail-info-title">System</td><td class="rdetail-info-value">' + rescue.system + '</td></tr>' : '') +
                              (rescue.platform                   ? '<tr class="rdetail-info"><td class="rdetail-info-title">Platform</td><td class="rdetail-info-value">' + (fr.const ? fr.const.platformHumanReadable.long[rescue.platform] : rescue.platform) + '</td></tr>' : '') +
                              (rescue.data ? rescue.data.langID  ? '<tr class="rdetail-info"><td class="rdetail-info-title">Language</td><td class="rdetail-info-value">' + rescue.data.langID.toUpperCase() + '</td></tr>' : '' : '') +
                                                                   '<tr class="rdetail-info"><td class="rdetail-info-title">UUID</td><td class="rdetail-info-value">' + rescue.id + '</td></tr>' +
                                                                   '<tr class="rdetail-info-seperator"><td class="tbl-border-none"></td><td></td></tr>';
    
    // Rats
    var ratHtml = [];
    for (var rat in rescue.rats) {
      var rInfo = fr.client.FetchRatInfo(rescue.rats[rat]);
      ratHtml.push('<span class="rat-' + rescue.rats[rat] + '">' + (rInfo !== null ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
    }
    for (var uRat in rescue.unidentifiedRats) {
      ratHtml.push('<span class="rat-unidentified">' + rescue.unidentifiedRats[uRat] + '</span> <span class="badge badge-yellow">unidentified</span>');
    }
    if(ratHtml.length > 0) {
      detailContent += '<tr class="rdetail-info"><td class="rdetail-info-title">Rats</td><td class="rdetail-info-value tbl-border-box">' + ratHtml[0] + '</td></tr>';
      if(ratHtml.length > 1)
        for(var i = 1 ; i < ratHtml.length ; i++)
          detailContent +='<tr class="rdetail-info"><td class="rdetail-info-empty"></td><td class="rdetail-info-value tbl-border-box">' + ratHtml[i] + '</td></tr>';
      detailContent += '<tr class="rdetail-info-seperator"><td class="tbl-border-none"></td><td></td></tr>'; // Separator
    }

    // Quotes
    if(rescue.quotes.length > 0) {
      detailContent += '<tr class="rdetail-info"><td class="rdetail-info-title">Quotes</td><td class="rdetail-info-value tbl-border-box">' + (rescue.quotes.length > 0 ? rescue.quotes[0] : '<i>None</i>') + '</td></tr>';
      if(rescue.quotes.length > 1)
        for(var i = 1 ; i < rescue.quotes.length ; i++)
          detailContent +='<tr class="rdetail-info"><td class="rdetail-info-empty"></td><td class="rdetail-info-value tbl-border-box">' + rescue.quotes[i] + '</td></tr>';
    }

    detailContent +='</tbody></table>';

    //Update the detail section.
    if(debug) console.log("fr.client.UpdateRescueDetail - Rescue DetailView Updated: " + rescue.id + " : " + rescue.client);
    if(debug) console.log(rescue);
    $('#rescueDetail').animate({opacity: 0.2}, 100).html(detailContent).animate({opacity: 1}, 500);
    $('#detailBtn-'+rescue.id.split('-')[0]).addClass('active').addClass('btn-info').removeClass('btn-default'); // Set new active button.
    $('body').addClass('rdetail-active');
  }
};