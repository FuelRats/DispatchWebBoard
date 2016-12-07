var fr = fr !== undefined ? fr : {};
var debug = debug !== undefined ? debug : true;

function getTimeSpan(date1, date2) {
    return Math.round(date1 / 1000) - Math.round(date2 / 1000);
}

fr.client = {
    cId: (debug ? "95a43559-69c3-40a6-86bb-f97d5d028e5e" : "6ae5920a-8764-4338-9877-aa4d9f851e0e"),
	currentToken: null,
	CookieBase: 'fr_db_',
    Rescues: {},
    CachedRats: {},
    SelectedRescue: null,
	init: function() {
        if (debug) console.log("fr.client.init - fr.Client loaded. DEBUG MODE ACTIVE.");
        fr.client.RequestRescueList();
        fr.client.UpdateClock();
	},
	GetCookie: function(name) {
        try {
            var cookie = document.cookie;
            name = fr.client.CookieBase + name;
            var valueStart = cookie.indexOf(name + "=") + 1;
            if (valueStart === 0) {
                return null;
            }
            valueStart += name.length;
            var valueEnd = cookie.indexOf(";", valueStart);
            if (valueEnd == -1)
                valueEnd = cookie.length;
            return decodeURIComponent(cookie.substring(valueStart, valueEnd));
        } catch (e) {
        }
        return null;
    },
    SetCookie: function(name, value, expire) {
        var temp = fr.client.CookieBase + name + "=" + escape(value) + (expire !== 0 ? "; path=/; expires=" + ((new Date((new Date()).getTime() + expire)).toUTCString()) + ";" : "; path=/;");
        document.cookie = temp;
    },
    CanSetCookies: function() {
        SetCookie('CookieTest', 'true', 0);
        var can = GetCookie('CookieTest') !== null;
        DelCookie('CookieTest');
        return can;
    },
    DelCookie: function(name) {
        document.cookie = fr.client.CookieBase + name + '=0; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    },
    HandleTPA: function (tpa) {
        if(debug) console.log("fr.client.HandleTPA - New TPA");
        if(debug) console.log(tpa);
        switch (tpa.meta.action) {
            case 'rescues:read':
                for (var i in tpa.data)
                    fr.client.AddRescue(tpa.data[i]); 
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
                break;
            default:
                console.log("Unhandled TPA: " + tpa);
                break;
        }
          
    },
    RequestRescueList: function () {
        fr.ws.send('rescues:read', { 'open': 'true' });
        var rTable = $('<table id="rescueTable" class="table table-striped table-bordered"></table>');
        var rHead = $('<thead><th>Case #</th><th>CMDR Name</th><th>System</th><th>Rats</th><th width="45px"></th></thead>');
        rTable.append(rHead);
        $('#rescueBoard').empty().append(rTable);
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
    AddRescue: function (tpa) {
        var table = $('#rescueTable');
        var rescue = tpa;

        if (!rescue.data) return;

        if ($('#rescue-' + rescue.id).length > 0) {
            fr.client.UpdateRescue(tpa);
            return;
        }

        var rats = rescue.rats;
        var ratHtml = [];
        
        for (var r in rats) {
            var rInfo = fr.client.FetchRatInfo(rats[r]);
            ratHtml.push('<span class="rat-' + rats[r] + '">' + (rInfo !== null ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
        }
        
        var row = $(
        '<tr id="rescue-' + rescue.id + '">' +
            '<td>' + (rescue.data.boardIndex !== undefined  ? rescue.data.boardIndex : 'X') + '</td>' +
            '<td title="' + (rescue.data !== undefined ? 'Nick: ' + rescue.data.IRCNick : '') + '">' + rescue.client + ' <span class="rescue-platform">' + (rescue.platform != 'xb' ? 'PC' : 'Xbox') + '</span></td>' +
            '<td>' + (rescue.system !== null ? rescue.system : 'unknown') + '</td>' +
            '<td>' + ratHtml.join(', ') + '</td>' +
            '<td onClick="javascript:fr.client.SetSelectedRescue(\'' + rescue.id + '\')"><button id="detailBtn-'+rescue.id+'" type="button" class="btn btn-default btn-xs btn-fr-detail"><span class="glyphicon glyphicon-info-sign"></span></button></td>' +
        '</tr>'
        );
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
        if(debug) console.log("fr.client.AddRescue: Rescue Added to board.");
        fr.client.Rescues[rescue.id] = rescue;
        table.append(row);  
    },
    UpdateRescue: function (tpa) {
        var rescueRow = $('#rescue-' + tpa.id);
        var rescue = tpa;

        var rats = rescue.rats;
        var ratHtml = [];
            
        for (var r in rats) {
            var rInfo = fr.client.FetchRatInfo(rats[r]);
            ratHtml.push('<span class="rat-' + rats[r] + '">' + (rInfo !== null ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
        }        

        rescueRow.html('<td>' + (rescue.data.boardIndex !== undefined  ? rescue.data.boardIndex : 'X') + '</td>' +
            '<td title="' + (rescue.data !== undefined ? 'IRC: ' + rescue.data.IRCNick : '') + '">' + rescue.client + ' <span class="rescue-platform">' + (rescue.platform != 'xb' ? 'PC' : 'Xbox') + '</span></td>' +
            '<td>' + (rescue.system !== null ? rescue.system : 'unknown') + '</td>' +
            '<td>' + ratHtml.join(', ') + 
            '<td onClick="javascript:fr.client.SetSelectedRescue(\'' + rescue.id + '\')"><button id="detailBtn-'+rescue.id+'" type="button" class="btn btn-default btn-xs btn-fr-detail"><span class="glyphicon glyphicon-info-sign"></span></button></td>' +
            '</td>');
        
        if (rescue.epic) {
            rescueRow.addClass('rescue-epic');
        } else {
            rescueRow.removeClass('rescue-epic');
        }

        if (rescue.codeRed) {
            rescueRow.addClass('rescue-codered');
        } else {
            rescueRow.removeClass('rescue-codered');
        }

        if (!rescue.active) {
            rescueRow.addClass('rescue-inactive');
        } else {
            rescueRow.removeClass('rescue-inactive');
        }

        var notes = rescue.quotes.join('\n');
        rescueRow.attr('title', notes);

        rescueRow.animate({
            opacity: 0.3
        }, 500).animate({
            opacity: 1
        }, 500);

        if (!rescue.open) {
            setTimeout(function () { rescueRow.hide('slow').remove(); }, 5000);
            if(debug) console.log("fr.client.UpdateRescue - Rescue Removed: " + rescue.id + " : " + rescue.client);
            delete fr.client.Rescues[rescue.id];
            return;
        }

        if(debug) console.log("fr.client.UpdateRescue - Rescue Updated: " + rescue.id + " : " + rescue.client);
        fr.client.Rescues[rescue.id] = rescue;
        if(tpa.id === fr.client.SelectedRescue.id) {
            if(debug) console.log("fr.client.UpdateRescue - Rescue DetailView Updating: " + rescue.id + " : " + rescue.client);
            fr.client.SelectedRescue = rescue;
            fr.client.UpdateRescueDetail();
        }
    },
    UpdateClock: function () {
        var nowTime = new Date();
        nowTime.setUTCFullYear(nowTime.getUTCFullYear() + 1286);

        var edTime = nowTime.getUTCFullYear() +
           '-' + (nowTime.getUTCMonth()    < 10 ? '0' : '') + nowTime.getUTCMonth()   +
           '-' + (nowTime.getUTCDate()     < 10 ? '0' : '') + nowTime.getUTCDate()    +
           ' ' + (nowTime.getUTCHours()    < 10 ? '0' : '') + nowTime.getUTCHours()   +
           ':' + (nowTime.getUTCMinutes()  < 10 ? '0' : '') + nowTime.getUTCMinutes() +
           ':' + (nowTime.getUTCSeconds()  < 10 ? '0' : '') + nowTime.getUTCSeconds();

        $('.ed-clock').text(edTime);
        setTimeout(fr.client.UpdateClock, 500);
    },
    RescueClockTimeoutID: null,
    UpdateRescueClock: function () {
        if(fr.client.SelectedRescue !== null) {
            var secondsElapsed = getTimeSpan(Date.now(),Date.parse(fr.client.SelectedRescue.createdAt));
            var seconds = secondsElapsed % 60;
            secondsElapsed -= seconds;
            var minutes = Math.floor(secondsElapsed / 60) % 60;
            secondsElapsed -= (minutes * 60);
            var hours   = Math.floor(secondsElapsed / 3600);

            var tstr = (hours   < 10 ? '0' : '') + hours + 
                 ':' + (minutes < 10 ? '0' : '') + minutes + 
                 ':' + (seconds < 10 ? '0' : '') + seconds;
            $('.rdetail-time-sincecreate').text(tstr);
        }
    },
    SetSelectedRescue: function (key) {
        if(key === null || (fr.client.SelectedRescue !== null && key === fr.client.SelectedRescue.id)) {
            fr.client.SelectedRescue = null;
            if(fr.client.RescueClockTimeoutID !== null) {
                window.clearInterval(fr.client.RescueClockTimeoutID);
                fr.client.RescueClockTimeoutID = null;
            }
            fr.client.UpdateRescueDetail();
            return;
        }
        if(fr.client.Rescues[key] === null) {
            console.log("SetSelectedRescue - invalid key: " + key);
            return;
        }
        if(debug) console.log("SetSelectedRescue - New SelectedRescue: " + fr.client.Rescues[key].id);
        if(fr.client.RescueClockTimeoutID === null) fr.client.RescueClockTimeoutID = window.setInterval(fr.client.UpdateRescueClock, 500);
        fr.client.SelectedRescue = fr.client.Rescues[key];
        fr.client.UpdateRescueDetail();
    },
    UpdateRescueDetail: function () {
        $('.btn-fr-detail').removeClass('active').removeClass('btn-info').addClass('btn-default');
        if (!fr.client.SelectedRescue) {
            $('#rescueDetail').addClass('fr-detail-hidden');
            return;
        }

        var rescue = fr.client.SelectedRescue;

        var detailContent = '<div class="rdetail-header">' +
                              '<div class="rdetail-client">#' + rescue.data.boardIndex + ' - ' + (rescue.title !== null ? rescue.title : rescue.client) + (rescue.codeRed ? ' <span class="label label-danger">Code Red</span>' : '') + (rescue.active ? '' : ' <span class="label label-warning">Inactive</span>') + '</div>' +
                              '<div class="rdetail-time-sincecreate">00:00:00</div>' +
                            '</div>' +
                            '<table class="table table-rescue">' +
                                '<tbody>' +
                                    '<tr id="RescueInfo-NickName"><td width="90px" class="tbl-border-none" ><strong>IRC Nick:</strong></td><td>' + rescue.data.IRCNick + '</td></tr>' +
                                    '<tr id="RescueInfo-System"><td class="tbl-border-none"><strong>System:</strong></td><td>' + rescue.system + '</td></tr>' +
                                    '<tr id="RescueInfo-Platform"><td class="tbl-border-none"><strong>Platform:</strong></td><td>' + rescue.platform.toUpperCase() + '</td></tr>' +
                                    '<tr id="RescueInfo-Language"><td class="tbl-border-none"><strong>Language:</strong></td><td>' + rescue.data.langID.toUpperCase() + '</td></tr>' +
                                    '<tr id="RescueInfo-UUID"><td class="tbl-border-none"><strong>UUID:</strong></td><td>' + rescue.id + '</td></tr>' +
                                    '<tr><td class="tbl-border-none"></td><td></td></tr>';
        // Rats
        var ratHtml = [];
        for (var r in rescue.rats) {
            var rInfo = fr.client.FetchRatInfo(rescue.rats[r]);
            ratHtml.push('<span class="rat-' + rescue.rats[r] + '">' + (rInfo !== null ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
        }
        detailContent += '<tr><td class="tbl-border-none"><strong>Rats:</strong></td><td class="tbl-border-left tbl-border-right">' + (ratHtml.length > 0 ? ratHtml[0] :'') + '</td></tr>';
        if(ratHtml.length > 1)
            for(var i = 1 ; i < ratHtml.length ; i++)
                detailContent +='<tr><td class="tbl-border-none"></td><td class="tbl-border-left tbl-border-right">' + ratHtml[i] + '</td></tr>';

        if(rescue.unidentifiedRats.length > 0)
            for(var i = 0 ; i < rescue.unidentifiedRats.length ; i++)
                detailContent +='<tr><td class="tbl-border-none"></td><td class="tbl-border-left tbl-border-right">' + rescue.unidentifiedRats[i] + ' <span class="label label-warning">unidentified</span></td></tr>';

        detailContent += '<tr><td class="tbl-border-none"></td><td></td></tr>'; // Separator

        // Quotes
        detailContent += '<tr><td class="tbl-border-none"><strong>Quotes:</strong></td><td class="tbl-border-left tbl-border-right">' + (rescue.quotes.length > 0 ? rescue.quotes[0] : '') + '</td></tr>';
        if(rescue.quotes.length > 1)
            for(var i = 1 ; i < rescue.quotes.length ; i++)
                detailContent +='<tr><td class="tbl-border-none"></td><td class="tbl-border-left tbl-border-right">' + rescue.quotes[i] + '</td></tr>';

        detailContent += '<tr><td class="tbl-border-none"></td><td></td></tr></tbody></table>';

        //show the detail section.
        if(debug) console.log("fr.client.UpdateRescueDetail - Rescue DetailView Updated: " + rescue.id + " : " + rescue.client);
        $('#rescueDetail').animate({opacity: 0.2}, 100).html(detailContent).removeClass('fr-detail-hidden').animate({opacity: 1}, 500);
        $('#detailBtn-'+rescue.id).addClass('active').addClass('btn-info').removeClass('btn-default');
    }
};