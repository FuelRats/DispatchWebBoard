var fr = fr != undefined ? fr : {};

fr.client = {
    cId: "6ae5920a-8764-4338-9877-aa4d9f851e0e",
	currentToken: null,
	CookieBase: 'fr_db_',
	init: function() {
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
        var can = GetCookie('CookieTest') != null;
        DelCookie('CookieTest');
        return can;
    },
    DelCookie: function(name) {
        document.cookie = fr.client.CookieBase + name + '=0; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    },
    HandleTPA: function (tpa) {
        switch (tpa.meta.action) {
            case 'rescues:read':
                if (tpa.meta.updateList != undefined) {
                    for (var r in tpa.data) {
                        fr.client.AddRescue(tpa.data[r]);
                    }
                } else {
                    fr.client.GetRescueList(tpa);
                }    
                break;
            case 'rescue:created':
                fr.client.AddRescue(tpa.data);
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
                console.log(tpa);
                break;
        }
          
    },
    RequestRescueList: function () {
        fr.ws.send('rescues:read', { 'open': 'true' });
        var rTable = $('<table id="rescueTable" class="table table-striped table-condensed table-bordered"></table>');
        var rHead = $('<tr><th>Case #</th><th>CMDR Name</th><th>System</th><th>Rats</th></tr>')
        rTable.append(rHead);
        $('#rescueBoard').empty().append(rTable);
    },
    FetchRatInfo: function (ratId) {
        if (fr.client.CachedRats[ratId]) {
            return fr.client.CachedRats[ratId];
        } else {
            fr.ws.send('rats:read', { 'id': ratId }, { 'searchId': ratId });
            return null;
        }
    },
    UpdateRats: function (tpa) {
        var rat = $('.rat-' + tpa.meta.searchId);
        if (tpa.data.length > 0) {
            rat.text(tpa.data[0].CMDRname);
        } else {
            rat.html('<i>Not found</i>');
        }
    },
    CachedRats: {},
    AddRescue: function (tpa) {
        var table = $('#rescueTable');
        var rescue = tpa;

        if ($('#rescue-' + rescue.id).length > 0) {
            fr.client.UpdateRescue(tpa);
            return;
        }

        var rats = rescue.rats;
        var ratHtml = [];
        
        for (var r in rats) {
            var rInfo = fr.client.FetchRatInfo(rats[r]);
            ratHtml.push('<span class="rat-' + rats[r] + '">' + (rInfo != null ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
        }
        
        var row = $(
        '<tr id="rescue-' + rescue.id + '">' +
            '<td>' + (rescue.data.boardIndex != undefined  ? rescue.data.boardIndex : 'X') + '</td>' +
            '<td title="' + (rescue.data != undefined ? 'IRC: ' + rescue.data.IRCNick : '') + '">' + rescue.client + ' <span class="rescue-platform">' + (rescue.platform != 'xb' ? 'PC' : 'Xbox') + '</span></td>' +
            '<td>' + (rescue.system != null ? rescue.system : 'unknown') + '</td>' +
            '<td>' + ratHtml.join(', ') + '</td>' +
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

        table.append(row);  
    },
    UpdateRescue: function (tpa) {
        var rescueRow = $('#rescue-' + tpa.id);
        var rescue = tpa;

        var rats = rescue.rats;
        var ratHtml = [];
            
        for (var r in rats) {
            var rInfo = fr.client.FetchRatInfo(rats[r]);
            ratHtml.push('<span class="rat-' + rats[r] + '">' + (rInfo != null ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
        }        

        rescueRow.html('<td>' + (rescue.data.boardIndex != undefined  ? rescue.data.boardIndex : 'X') + '</td>' +
            '<td title="' + (rescue.data != undefined ? 'IRC: ' + rescue.data.IRCNick : '') + '">' + rescue.client + ' <span class="rescue-platform">' + (rescue.platform != 'xb' ? 'PC' : 'Xbox') + '</span></td>' +
            '<td>' + (rescue.system != null ? rescue.system : 'unknown') + '</td>' +
            '<td>' + ratHtml.join(', ') + '</td>');
        
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
        }
    },
    GetRescueList: function (tpa) {
        console.log(tpa);

        var table = $('#rescueTable');

        for (var i in tpa.data) {
            var rescue = tpa.data[i];

            var rats = rescue.rats;
            var ratHtml = [];
            
            for (var r in rats) {
                var rInfo = fr.client.FetchRatInfo(rats[r]);
                ratHtml.push('<span class="rat-' + rats[r] + '">' + (rInfo != null ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
            }
            
            var row = $(
            '<tr id="rescue-' + rescue.id + '">' +
                '<td>' + (rescue.data.boardIndex != undefined  ? rescue.data.boardIndex : 'X') + '</td>' +
                '<td title="' + (rescue.data != undefined ? 'IRC: ' + rescue.data.IRCNick : '') + '">' + rescue.client + ' <span class="rescue-platform">' + (rescue.platform != 'xb' ? 'PC' : 'Xbox') + '</span></td>' +
                '<td>' + (rescue.system != null ? rescue.system : 'unknown') + '</td>' +
                '<td>' + ratHtml.join(', ') + '</td>' +
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

            table.append(row);
        }
    },
    UpdateClock: function () {
        var nowTime = new Date();
        nowTime.setUTCFullYear(nowTime.getUTCFullYear() + 1286);

        var edTime = '';
        
        edTime += nowTime.getUTCFullYear();
        edTime += '-' + (nowTime.getUTCMonth() < 10 ? '0' : '') + nowTime.getUTCMonth();
        edTime += '-' + (nowTime.getUTCDate() < 10 ? '0' : '') + nowTime.getUTCDate();
        edTime += ' ' + (nowTime.getUTCHours() < 10 ? '0' : '') + nowTime.getUTCHours();
        edTime += ':' + (nowTime.getUTCMinutes() < 10 ? '0' : '') + nowTime.getUTCMinutes();
        edTime += ':' + (nowTime.getUTCSeconds() < 10 ? '0' : '') + nowTime.getUTCSeconds();

        $('.ed-clock').text(edTime);
        setTimeout(fr.client.UpdateClock, 500);
    }
};