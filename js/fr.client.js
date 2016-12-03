var fr = fr !== undefined ? fr : {};
var debug = debug !== undefined ? debug : true;

function getTimeSpan(date1, date2) {
    return Math.round(date1 / 1000) - Math.round(date2 / 1000);
}

fr.client = {
    cId: "4eace3e0-6564-4d41-87d4-bae2e2d2f6df",
	currentToken: null,
	CookieBase: 'fr_db_',
    Rescues: {},
    CachedRats: {},
    SelectedRescue: null,
	init: function() {
        fr.client.RequestRescueList();
        fr.client.UpdateClock();
        fr.client.UpdateRescueClock();
        $('#VersionInfo').text('FuelRats Dispatch Board v0.2' + (debug ? ' - DEBUG MODE' :''));
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
        if(debug) console.log("HandleTPA - New TPA");
        if(debug) console.log(tpa);
        switch (tpa.meta.action) {
            case 'rescues:read':
                if (tpa.meta.updateList !== undefined) {
                    for (var r in tpa.data) {
                        fr.client.AddRescue(tpa.data[r]);
                    }
                } else {
                    fr.client.GetRescueList(tpa);
                }    
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
        var rHead = $('<thead><th>Case #</th><th>CMDR Name</th><th>System</th><th>Rats</th></thead>');
        rTable.append(rHead);
        $('#rescueBoard').empty().append(rTable);
    },
    FetchRatInfo: function (ratId) {
        if (fr.client.CachedRats[ratId]) {
            if(debug) console.log("FetchRatInfo - Cached Rat Requested: ");
            if(debug) console.log(fr.client.CachedRats[ratId]);
            return fr.client.CachedRats[ratId];
        } else {
            if(debug) console.log("FetchRatInfo - Gathering RatInfo: " + ratId);
            fr.ws.send('rats:read', { 'id': ratId }, { 'searchId': ratId });
            return null;
        }
    },
    UpdateRats: function (tpa) {
        var rat = $('.rat-' + tpa.meta.searchId);
        if (tpa.data.length > 0) {
            if(!fr.client.CachedRats[tpa.data[0].id]) {
                if(debug) console.log("UpdateRats - Caching RatInfo:  " + tpa.data[0].id + " : " + tpa.data[0].CMDRname);
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
        '<tr id="rescue-' + rescue.id + '" onClick="javascript:fr.client.SetSelectedRescue(' + rescue.id + ')">' +
            '<td>' + (rescue.data.boardIndex !== undefined  ? rescue.data.boardIndex : 'X') + '</td>' +
            '<td title="' + (rescue.data !== undefined ? 'Nick: ' + rescue.data.IRCNick : '') + '">' + rescue.client + ' <span class="rescue-platform">' + (rescue.platform != 'xb' ? 'PC' : 'Xbox') + '</span></td>' +
            '<td>' + (rescue.system !== null ? rescue.system : 'unknown') + '</td>' +
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
        if(debug) console.log("AddRescue: Rescue Added to board.");
        fr.client.Rescues[rescue.id] = rescue;
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
            ratHtml.push('<span class="rat-' + rats[r] + '">' + (rInfo !== null ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
        }        

        rescueRow.html('<td>' + (rescue.data.boardIndex !== undefined  ? rescue.data.boardIndex : 'X') + '</td>' +
            '<td title="' + (rescue.data !== undefined ? 'IRC: ' + rescue.data.IRCNick : '') + '">' + rescue.client + ' <span class="rescue-platform">' + (rescue.platform != 'xb' ? 'PC' : 'Xbox') + '</span></td>' +
            '<td>' + (rescue.system !== null ? rescue.system : 'unknown') + '</td>' +
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
            if(debug) console.log("UpdateRescue - Rescue Removed: " + rescue.id + " : " + rescue.client);
            delete fr.client.Rescues[rescue.id];
            return;
        }

        if(debug) console.log("UpdateRescue - Rescue Updated: " + rescue.id + " : " + rescue.client);
        fr.client.Rescues[rescue.id] = rescue;
        if(tpa.id === fr.client.SelectedRescue.id) {
            if(debug) console.log("UpdateRescue - Rescue DetailView Updating: " + rescue.id + " : " + rescue.client);
            fr.client.SelectedRescue = rescue;
            fr.client.UpdateRescueDetail();
        }
    },
    GetRescueList: function (tpa) {
        var table = $('#rescueTable');

        for (var i in tpa.data) {
            var rescue = tpa.data[i];

            if (rescue.data === null) continue; //TODO add better handling for a null data field.

            var rats = rescue.rats;
            var ratHtml = [];
            
            for (var r in rats) {
                var rInfo = fr.client.FetchRatInfo(rats[r]);
                ratHtml.push('<span class="rat-' + rats[r] + '">' + (rInfo !== null ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
            }
            
            var row = $(
            '<tr id="rescue-' + rescue.id + '" onClick="javascript:fr.client.SetSelectedRescue(\'' + rescue.id + '\')">' +
                '<td>' + (rescue.data.boardIndex !== undefined  ? rescue.data.boardIndex : 'X') + '</td>' +
                '<td title="' + (rescue.data !== undefined ? 'Nick: ' + rescue.data.IRCNick : '') + '">' + rescue.client + ' <span class="rescue-platform">' + (rescue.platform != 'xb' ? 'PC' : 'Xbox') + '</span></td>' +
                '<td>' + (rescue.system !== null ? rescue.system : 'unknown') + '</td>' +
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
            fr.client.Rescues[rescue.id] = rescue;
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
    },
    UpdateRescueClock: function () {
        if(fr.client.SelectedRescue !== null) {
            var secondsElapsed = getTimeSpan(Date.now(),Date.parse(fr.client.SelectedRescue.createdAt));
            var hours   = Math.floor(secondsElapsed / 3600) % 24;
            var minutes = Math.floor(secondsElapsed / 60) % 60;
            var seconds = secondsElapsed % 60;
            var tstr = '';
            tstr += (hours < 10 ? '0' : '') + hours;
            tstr += ':' + (minutes < 10 ? '0' : '') + minutes;
            tstr += ':' + (seconds < 10 ? '0' : '') + seconds;
            $('.rdetail-time-sincecreate').text(tstr);
            setTimeout(fr.client.UpdateRescueClock, 500);
        }
    },
    SetSelectedRescue: function (key) {
        if(key === null || (fr.client.SelectedRescue !== null && key === fr.client.SelectedRescue.id)) {
            fr.client.SelectedRescue = null;
            fr.client.UpdateRescueDetail();
            return;
        }
        if(fr.client.Rescues[key] === null) {
            console.log("SetSelectedRescue - invalid key: " + key);
            return;
        }
        if(debug) console.log("SetSelectedRescue - New SelectedRescue: " + fr.client.Rescues[key].id);
        fr.client.SelectedRescue = fr.client.Rescues[key];
        fr.client.UpdateRescueDetail();
    },
    UpdateRescueDetail: function () {
        if (!fr.client.SelectedRescue) {
            $('#rescueDetail').css('display','none');
            $('#spacer').addClass('col-md-2').removeClass('col-md-0');
            $('#rescueBoard').addClass('col-md-8').removeClass('col-md-5');
            return;
        }

        var rescue = fr.client.SelectedRescue;

        var detailContent = '<div class="rdetail-header">' +
                              '<div class="rdetail-client">#' + rescue.data.boardIndex + ' - ' + (rescue.codeRed ? '<font class="font-cred">CODE RED</font> - ' : '') + (rescue.title !== null ? rescue.title : rescue.client) + '</div>' +
                              '<div class="rdetail-time-sincecreate">00:00:00</div>' +
                            '</div>' +
                            '<table class="table table-rescue">' +
                                '<tbody>' +
                                    '<tr id="RescueInfo-NickName">' +
                                        '<td width="90px" ><strong>IRC Nick:</strong></td>' +
                                        '<td>' + rescue.data.IRCNick + '</td>' +
                                    '</tr>' +
                                    '<tr id="RescueInfo-System">' +
                                        '<td><strong>System:</strong></td>' +
                                        '<td>' + rescue.system + '</td>' +
                                    '</tr>' +
                                    '<tr>' +
                                        '<td><strong>Platform:</strong></td>' +
                                        '<td>' + rescue.platform + '</td>' +
                                    '</tr>' +
                                    '<tr>' +
                                        '<td><strong>UUID:</strong></td>' +
                                        '<td>' + rescue.id + '</td>' +
                                    '</tr>' +
                                    '<tr><td></td><td></td></tr>';
        // Rats
        var ratHtml = [];
        for (var r in rescue.rats) {
            var rInfo = fr.client.FetchRatInfo(rescue.rats[r]);
            ratHtml.push('<span class="rat-' + rescue.rats[r] + '">' + (rInfo !== null ? rInfo.CMDRname : '<i>Loading</i>') + '</span>');
        }
        detailContent += '<tr><td><strong>Rats:</strong></td><td>' + (ratHtml.length > 0 ? ratHtml[0] :'') + '</td></tr>';
        if(ratHtml.length > 1)
            for(var i = 1 ; i < ratHtml ; i++)
                detailContent +='<tr><td></td><td>' + ratHtml[i] + '</td></tr>';

        detailContent += '<tr><td></td><td></td></tr>'; // Separator

        // Quotes
        detailContent += '<tr><td><strong>Quotes:</strong></td><td>' + (rescue.quotes.length > 0 ? rescue.quotes[0] : '') + '</td></tr>';
        if(rescue.quotes.length > 1)
            for(var i = 1 ; i < rescue.quotes.length ; i++)
                detailContent +='<tr><td></td><td>' + rescue.quotes[i] + '</td></tr>';

        detailContent += '<tr><td></td><td></td></tr></tbody></table>';



        //show the detail section.
        if(debug) console.log("UpdateRescueDetail - Rescue DetailView Updated: " + rescue.id + " : " + rescue.client);
        $('#rescueDetail').animate({opacity: 0.2}, 100).html(detailContent).css('display', 'initial').animate({opacity: 1}, 500);
        $('#spacer').addClass('col-md-0').removeClass('col-md-2');
        $('#rescueBoard').addClass('col-md-5').removeClass('col-md-8');
        fr.client.UpdateRescueClock();
    }
};