﻿// objects and data

var r1 = "<a href='https://twitter.com/baoyu42'>Юра Разумов</a>";
var r2 = "<a href='https://twitter.com/drugged_monkey'>Саша Матюхин</a>";
var teams = [];
var tours = [];
var allLeads = [];
var tourCount = 0;
var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1hdAunhHHePMEdd0IqZXzN2e8IcQligaoV2YZUt71ehs/pubhtml'; //prod 2015-2016
//var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1M2J8TILI8Qb8c5TjEBv0k065tOXZrtM0O36zMujysgc/pubhtml'; //prod 2014-2015
//var public_spreadsheet_url = 'https://docs.google.com/spreadsheet/pub?key=0ArS_x_k82ET4dExRTks4MHNHLXJwM09wYk9fRDdyYnc&output=html'; //prod 2013-2014
//var public_spreadsheet_url = 'https://docs.google.com/spreadsheet/pub?key=0ArS_x_k82ET4dFM1TDdVdnZTSjJSZkI5WTN0b0lUNnc&output=html'; //staging


function ToursMatch(teamScore, guestScore) {
    this.teamScore = teamScore;
    this.guestScore = guestScore;
}

function TourMatch(teamScore, isTeamLead, isTeamB, guestScore, isGuestLead, isGuestB, tourLabel) {
    this.teamScore = teamScore;
    this.guestScore = guestScore;
    this.isTeamLead = isTeamLead;
    this.isGuestLead = isGuestLead;
    this.isTeamB = isTeamB;
    this.isGuestB = isGuestB;
    this.tourLabel = tourLabel;
}

function Result(teamName, score) {
    this.teamName = teamName;
    this.teamId = 0;
    this.score = score;
}

function CommonTour(tourId, leads, tourA, tourB) {
    this.tourId = tourId;
    this.leads = leads;
    this.A = tourA;
    this.B = tourB;
}

function Tour(tourId, tourType, results, state) {
    this.results = results;
    this.tourId = tourId;
    this.tourType = tourType;
	this.state = state;
    this.max = 0;
}

function Team(teamId, teamName) {
    this.teamId = teamId;
    this.teamName = teamName;
    this.wins = 0;
    this.draws = 0;
    this.loses = 0;
    this.points = 0;
    this.wasLead = false;
    //this.totalAnsweredQuestions = 0;
    //this.totalMaxQuestions = 0;
    this.totalTours = 0;
    this.percents = 0;
    this.place = 0;
}

// ko view model
var microViewModel = new MicroViewModel();

function MicroViewModel() {
    var self = this;

    // observables
    self.isWindowVisible = ko.observable(false);
    self.isMaskVisible = ko.observable(false);
    self.isUiVisible = ko.observable(false);

    self.teams = ko.observableArray(teams);

    self.matches = ko.observableArray([]);
    self.teamName = ko.observable("");
    self.guestName = ko.observable("");
    self.teamScore = ko.observable(0);
    self.guestScore = ko.observable(0);

    self.rand = ko.observable(getRandomInt(1, 2));
    self.sortType = ko.observable(1);	 // TODO: replace this ugly sorting switch (1 for score-based, 2 for alphabetical)

    self.lastTour = ko.observable(" - ");
    self.lastTourType = ko.observable(" - ");

    //computed
    self.matchesScore = ko.computed(function () {
        return self.teamScore() + " : " + self.guestScore();
    }, this);

    self.matchesStyle = ko.computed(function () {
        return self.teamScore() > self.guestScore() ? 'win' : (self.teamScore() < self.guestScore() ? 'lose' : 'draw');
    }, this);

    self.firstPerson = ko.computed(function () {
        return self.rand() == 1 ? r1 : r2;
    }, this);

    self.secondPerson = ko.computed(function () {
        return self.rand() == 1 ? r2 : r1;
    }, this);

    // methods
    self.clearWindow = function () {
        self.matches([]);
        self.teamName("");
        self.guestName("");
        self.teamScore(0);
        self.guestScore(0);
        self.isWindowVisible(false);
        self.isMaskVisible(false);
    };
}

// common functions
function cellClick(cell) {

    var teamId = $(cell).data("teamid");
    var guestId = $(cell).data("guestid");
    var teamPlace = $(cell).data("teamplace");
    var teamName = $(cell).data("teamname");
    var cellVal = $(cell).data("val");
    var derbyFlag = $(cell).hasClass("derby");

    if (teamId && guestId && teamId != guestId) {
        var teamName = getNameById(teamId);
        var guestName = getNameById(guestId);
        var teamScore = 0;
        var isTeamLead = false;
        var isTeamB = false;
        var guestScore = 0;
        var isGuestLead = false;
        var isGuestB = false;

        microViewModel.clearWindow();

        if (teamId != guestId) {
            microViewModel.teamName(getNameById(teamId));
            microViewModel.guestName(getNameById(guestId));

            $.each(tours, function (i, tour) {
                var k = i + 1;
                var teamAResult, teamBResult, guestAResult, guestBResult;
                $.each(tour.A.results, function (j, result) {
                    if (result.teamId == teamId) {
                        teamAResult = result;
                    } else if (result.teamId == guestId) {
                        guestAResult = result;
                    }
                });

                $.each(tour.B.results, function (j, result) {
                    if (result.teamId == teamId) {
                        teamBResult = result;
                    } else if (result.teamId == guestId) {
                        guestBResult = result;
                    }
                });

                if ($.inArray(teamName, tour.leads) == -1 && $.inArray(guestName, tour.leads) == -1) { //нахер английский т.е. обе вели тур
                    if (teamBResult != undefined && guestBResult != undefined) { //обе играли лигу Б
                        isTeamLead = false;
                        isGuestLead = false;
                        isTeamB = true;
                        isGuestB = true;
                        teamScore = teamBResult.score;
                        guestScore = guestBResult.score;

                        if (teamScore > guestScore) {
                            microViewModel.teamScore(microViewModel.teamScore() + 1);
                        } else if (teamScore < guestScore) {
                            microViewModel.guestScore(microViewModel.guestScore() + 1);
                        }
                        microViewModel.matches.push(new TourMatch(teamScore, isTeamLead, isTeamB, guestScore, isGuestLead, isGuestB, k < 7 ? k + "-Б" : "Финал"));
                    }

                    if (teamAResult != undefined && guestAResult != undefined) { //обе играли лигу А
                        isTeamLead = false;
                        isGuestLead = false;
                        isTeamB = false;
                        isGuestB = false;
                        teamScore = teamAResult.score;
                        guestScore = guestAResult.score;

                        if (teamScore > guestScore) {
                            microViewModel.teamScore(microViewModel.teamScore() + 1);
                        } else if (teamScore < guestScore) {
                            microViewModel.guestScore(microViewModel.guestScore() + 1);
                        }
                        microViewModel.matches.push(new TourMatch(teamScore, isTeamLead, isTeamB, guestScore, isGuestLead, isGuestB, k < 7 ? k + "-А" : "Финал"));
                    }

                    if (teamAResult != undefined && teamBResult == undefined
						&& guestAResult == undefined && guestBResult != undefined) { //хозяева играли в А, не играли в Б, гости не вышли из Б
                        isTeamLead = false;
                        isGuestLead = false;
                        isTeamB = false;
                        isGuestB = true;
                        teamScore = teamAResult.score;
                        guestScore = 0;

                        microViewModel.teamScore(microViewModel.teamScore() + 1);
                        microViewModel.matches.push(new TourMatch(teamScore, isTeamLead, isTeamB, guestScore, isGuestLead, isGuestB, k < 7 ? k + "-А" : "Финал"));
                    }

                    if (teamAResult == undefined && teamBResult != undefined
						&& guestAResult != undefined && guestBResult == undefined) { //гости играли в А, не играли в Б, хозяева не вышли из Б
                        isTeamLead = false;
                        isGuestLead = false;
                        isTeamB = true;
                        isGuestB = false;
                        teamScore = 0;
                        guestScore = guestAResult.score;

                        microViewModel.guestScore(microViewModel.guestScore() + 1);
                        microViewModel.matches.push(new TourMatch(teamScore, isTeamLead, isTeamB, guestScore, isGuestLead, isGuestB, k < 7 ? k + "-А" : "Финал"));
                    }

                    if ((teamAResult != undefined || teamBResult != undefined)
						&& guestAResult == undefined && guestBResult == undefined) { //хозяева играли в любой из лиг, гости ни в одной из лиг
                        isTeamLead = false;
                        isGuestLead = false;
                        isTeamB = teamBResult != undefined && teamAResult == undefined;
                        isGuestB = null;
                        teamScore = teamAResult != undefined ? teamAResult.score : teamBResult.score;
                        guestScore = 0;

                        microViewModel.teamScore(microViewModel.teamScore() + 1);
                        microViewModel.matches.push(new TourMatch(teamScore, isTeamLead, isTeamB, guestScore, isGuestLead, isGuestB, k < 7 ? k + (isTeamB ? "-Б" : "-А") : "Финал"));
                    }

                    if (teamAResult == undefined && teamBResult == undefined
						&& (guestAResult != undefined || guestBResult != undefined)) {//гости играли в любой из лиг, хозяева ни в одной из лиг
                        isTeamLead = false;
                        isGuestLead = false;
                        isTeamB = null;
                        isGuestB = guestBResult != undefined && guestAResult == undefined;
                        teamScore = 0;
                        guestScore = guestAResult != undefined ? guestAResult.score : guestBResult.score;

                        microViewModel.guestScore(microViewModel.guestScore() + 1);
                        microViewModel.matches.push(new TourMatch(teamScore, isTeamLead, isTeamB, guestScore, isGuestLead, isGuestB, k < 7 ? k + (isGuestB ? "-Б" : "-А") : "Финал"));
                    }

                    if (teamAResult == undefined && guestAResult == undefined
						&& teamBResult == undefined && guestBResult == undefined) { //обе пропустили
                        isTeamLead = false;
                        isGuestLead = false;
                        isTeamB = null;
                        isGuestB = null;
                        teamScore = 0;
                        guestScore = 0;
                        microViewModel.matches.push(new TourMatch(teamScore, isTeamLead, isTeamB, guestScore, isGuestLead, isGuestB, k < 7 ? k + "-А(Б)" : "Финал"));
                    }
                }
                else if ($.inArray(teamName, tour.leads) > -1 && $.inArray(guestName, tour.leads) == -1) { //team is tour lead
                    isTeamLead = true;
                    isGuestLead = false;
                    isTeamB = false;
                    isGuestB = guestAResult == undefined;
                    teamScore = 0;
                    guestScore = guestAResult != undefined ? guestAResult.score : (guestBResult != undefined ? guestBResult.score : 0);
                    microViewModel.matches.push(new TourMatch(teamScore, isTeamLead, isTeamB, guestScore, isGuestLead, isGuestB, k < 7 ? k + (isGuestB ? "-Б" : "-А") : "Финал"));
                }
                else if ($.inArray(teamName, tour.leads) == -1 && $.inArray(guestName, tour.leads) > -1) { //guest is tour lead
                    isTeamLead = false;
                    isGuestLead = true;
                    isTeamB = teamAResult == undefined;
                    isGuestB = false;
                    teamScore = teamAResult != undefined ? teamAResult.score : (teamBResult != undefined ? teamBResult.score : 0);
                    guestScore = 0;
                    microViewModel.matches.push(new TourMatch(teamScore, isTeamLead, isTeamB, guestScore, isGuestLead, isGuestB, k < 7 ? k + (isTeamB ? "-Б" : "-А") : "Финал"));
                }
                else { //both is tour leads
                    isTeamLead = true;
                    isGuestLead = true;
                    isTeamB = false;
                    isGuestB = false;
                    teamScore = 0;
                    guestScore = 0;
                    microViewModel.matches.push(new TourMatch(teamScore, isTeamLead, isTeamB, guestScore, isGuestLead, isGuestB, k < 7 ? k + "-А(Б)" : "Финал"));
                }
            });
        }
        microViewModel.isWindowVisible(true);
        microViewModel.isMaskVisible(true);
        if (derbyFlag) {
            $('#results')
            .addClass("derbyContainer");
        }
        else {
            $('#results')
            .removeClass("derbyContainer");
        }
        resizeWindow();
    } else if (teamPlace && teamName) {
        if (parseInt($(cell).html()) > 0) {
            $(cell).html(teamName);
        }
        else {
            $(cell).html(teamPlace);
        }
    }
}

function checkLead(team) {
    var flag = false;
    $.each(allLeads, function (j, lead) {
        if (lead == team.teamName) {
            flag = true;
        }
    });
    return flag;
}

function cellHover() {
    var teamId = $(this).data("teamid");
    var guestId = $(this).data("guestid");

    if (teamId && guestId && teamId != guestId) {
        microViewModel.teamName(getNameById(teamId));
        microViewModel.guestName(getNameById(guestId));
        $("#floatingTitle").fadeIn("fast");
    }
    else {
        $("#floatingTitle").fadeOut("fast");
    }
}

function headHover() {
    $("#floatingTitle").hide();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function compareResults(team, guest) {

    var teamScore = 0;
    var guestScore = 0;

    $.each(tours, function (i, tour) {
        var teamAResult, teamBResult, guestAResult, guestBResult;
        $.each(tour.A.results, function (j, result) {
            if (result.teamId == team.teamId) {
                teamAResult = result;
            } else if (result.teamId == guest.teamId) {
                guestAResult = result;
            }
        });

        $.each(tour.B.results, function (j, result) {
            if (result.teamId == team.teamId) {
                teamBResult = result;
            } else if (result.teamId == guest.teamId) {
                guestBResult = result;
            }
        });

        if ($.inArray(team.teamName, tour.leads) == -1 && $.inArray(guest.teamName, tour.leads) == -1) {
            if (teamAResult != undefined && guestAResult != undefined) { //обе играли лигу А
                if (teamAResult.score > guestAResult.score) {
                    teamScore += 1;
                }
                else if (teamAResult.score < guestAResult.score) {
                    guestScore += 1;
                }
            }
            if (teamBResult != undefined && guestBResult != undefined) { //обе играли лигу Б
                if (teamBResult.score > guestBResult.score) {
                    teamScore += 1;
                }
                else if (teamBResult.score < guestBResult.score) {
                    guestScore += 1;
                }
            }
            if (teamAResult != undefined && teamBResult == undefined
				&& guestAResult == undefined && guestBResult != undefined) { //хозяева играли в А, не играли в Б, гости не вышли из Б
                teamScore += 1;
            }
            if (teamAResult == undefined && teamBResult != undefined
				&& guestAResult != undefined && guestBResult == undefined) { //гости играли в А, не играли в Б, хозяева не вышли из Б
                guestScore += 1;
            }
            if ((teamAResult != undefined || teamBResult != undefined)
				&& guestAResult == undefined && guestBResult == undefined) { //хозяева играли в любой из лиг, гости ни в одной из лиг
                teamScore += 1;
            }
            if (teamAResult == undefined && teamBResult == undefined
				&& (guestAResult != undefined || guestBResult != undefined)) {//гости играли в любой из лиг, хозяева ни в одной из лиг
                guestScore += 1;
            }
        }
    });
    return new ToursMatch(teamScore, guestScore);
}

function sortByPoints(a, b) {
    return (b.points - a.points) || (b.percents - a.percents);
}

function sortByAlphabet(a, b) {
    var aName = a.teamName.toLowerCase();
    var bName = b.teamName.toLowerCase();
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}

function getNameById(id) {
    var name = "";
    $.each(teams, function (i, item) {
        if (item.teamId == id) {
            name = item.teamName;
            return false;
        }
    });
    return name;
}

function getIdByName(name) {
    var id = 0;
    $.each(teams, function (i, item) {
        if (item.teamName == name) {
            id = item.teamId;
            return false;
        }
    });
    return id;
}

function resizeWindow() {
    var winH = window.innerHeight;
    var winW = window.innerWidth;
    $('#container').css('top', winH / 2 - $('#container').height() / 2);
    $('#container').css('left', winW / 2 - $('#container').width() / 2);
    $('#mask').css('height', winH);
    $('#mask').css('width', winW);
}

function isTeamUniq(name) {
    var flag = true;
    $.each(teams, function (i, team) {
        if (team.teamName == name) {
            flag = false;
            return false;
        }
    });
    return flag;
}

function tableTopCallback(data) {
    var amatch = /\d{1,1}-A/i;
    var bmatch = /\d{1,1}-B/i;

    var acount = 0;
    var bcount = 0;

    $.each(Object.keys(data), function (i, item) {
        if (item.match(amatch) != null && item.match(amatch).length > 0) {
            acount++;
        }
        if (item.match(bmatch) != null && item.match(bmatch).length > 0) {
            bcount++;
        }
    });

    toursCount = acount + bcount;

    if (bcount < 7 && acount < 7) {
        if (bcount > acount) {
            microViewModel.lastTour("Б " + bcount);
            microViewModel.lastTourType = data[bcount + "-B"].elements[0].state;
        } else if (bcount == acount) {
            microViewModel.lastTour("A " + bcount);
            microViewModel.lastTourType = data[bcount + "-A"].elements[0].state;
        }
    } else {
        microViewModel.lastTour("Финал");
        microViewModel.lastTourType = data[bcount + "-A"].elements[0].state;
    }
    for (var i = 0; i < toursCount / 2; i++) {
        var leads = [];

        var tourB = new Tour((i + 1), "B", $.map(data[(i + 1) + "-B"].elements, function (item, i) {
            if (item.leads != null) {
                leads.push(item.leads);
            }
            return new Result(item.name, parseInt(item.score));
        }), data[(i + 1) + "-B"].elements[0].state);

        var tourA = new Tour((i + 1), "A", $.map(data[(i + 1) + "-A"].elements, function (item, i) {
            if (item.leads != null) {
                leads.push(item.leads);
            }
            return new Result(item.name, parseInt(item.score));
        }), data[(i + 1) + "-A"].elements[0].state);

        tours.push(new CommonTour((i + 1), leads, tourA, tourB));
        $.each(leads, function (k, lead) {
            if (lead.length > 0) {
                allLeads.push(lead);
            }
        });
    }

    //calculations
    //fill teams array from tours array
    $.each(tours, function (i, tour) {

        tour.A.results.sort(function (a, b) { return b.score - a.score });
        tour.A.max = tour.A.results[0].score > 0 ? tour.A.results[0].score : 1;

        if (tour.B.results.length > 0) {
            tour.B.results.sort(function (a, b) { return b.score - a.score });
            tour.B.max = tour.B.results[0].score > 0 ? tour.B.results[0].score : 1;
        }

        $.each(tour.A.results, function (j, result) {
            if (result.teamId == 0) {
                if (isTeamUniq(result.teamName)) {
                    var index = teams.length + 1;
                    teams.push(new Team(index, result.teamName));
                    result.teamId = index;
                } else {
                    result.teamId = getIdByName(result.teamName);
                }
            }
        });

        $.each(tour.B.results, function (j, result) {
            if (result.teamId == 0) {
                if (isTeamUniq(result.teamName)) {
                    var index = teams.length + 1;
                    teams.push(new Team(index, result.teamName));
                    result.teamId = index;
                } else {
                    result.teamId = getIdByName(result.teamName);
                }
            }
        });
    });

    //calculate mathches
    $.each(teams, function (i, team) {
        team.wasLead = checkLead(team);
        $.each(teams, function (j, guest) {
            var cell = {
                value: "",
                style: ""
            };

            if (team.teamId != guest.teamId) {
                var match = compareResults(team, guest);
                if (match.teamScore > match.guestScore) {
                    team.wins += 1;
                    team.points += 2;
                    cell.style = "win";
                }
                else if (match.teamScore == match.guestScore) {
                    team.draws += 1;
                    team.points += 1;
                    cell.style = "draw";
                }
                else {
                    team.loses += 1;
                    cell.style = "lose";
                }
                cell.value = match.teamScore + " : " + match.guestScore;
            }
            else {
                cell.value = " — ";
                cell.style = "self";
            }
            var tname = team.teamName.toLowerCase();
            var gname = guest.teamName.toLowerCase();

            if ((tname.indexOf("ры ам") != -1 && gname.indexOf("ий ле") != -1) || (gname.indexOf("ры ам") != -1 && tname.indexOf("ий ле") != -1)) {
                cell.style += " derby";
            }

            team["team" + guest.teamId] = cell;
        });

        //calculate percents and add table headers
        $.each(tours, function (j, tour) {
            var teamAResult, teamBResult;
            $.each(tour.A.results, function (j, result) {
                if (result.teamId == team.teamId) {
                    teamAResult = result;
                }
            });

            $.each(tour.B.results, function (j, result) {
                if (result.teamId == team.teamId) {
                    teamBResult = result;
                }
            });
            if (teamAResult != undefined && (tour.A.state == "Окончательные" || tour.A.state == "Предварительные")) {
                team.percents += Math.round(teamAResult.score * 1000 / tour.A.max) / 10;
                team.totalTours++;
                // team.totalMaxQuestions += tour.A.max;
                //team.totalAnsweredQuestions += teamAResult.score;
            }
            if (teamBResult != undefined && (tour.B.state == "Окончательные" || tour.B.state == "Предварительные")) {
                team.percents += Math.round(teamBResult.score * 1000 / tour.B.max) / 10;
                team.totalTours++;
                // team.totalMaxQuestions += tour.B.max;
                //team.totalAnsweredQuestions += teamBResult.score;
            }
        });
        team.percents = Math.round(team.percents * 10 / team.totalTours++) / 10;
    });

    switch (microViewModel.sortType()) {
        case 1:
            {
                teams.sort(sortByPoints);
                break;
            }
        case 2:
            {
                teams.sort(sortByAlphabet);
                break;
            }
    }



    var $mainTable = $('#mainTable');
    var $headTrs = $mainTable.find('thead tr');
    var $bodyTrs = $mainTable.find('tbody tr');

    var neigbors = {};

    $.each(teams, function (i, team) {

        if (neigbors[team.points] == undefined) {
            neigbors[team.points] = {};
        }
        if (neigbors[team.points][team.percents] == undefined) {
            neigbors[team.points][team.percents] = [];
        }
        neigbors[team.points][team.percents].push({
            index: i,
            team: team
        })

        var $th = $('<th>');
        $th.addClass('clickable');
        $th.data('teamplace', i + 1);
        $th.data('teamname', team.teamName);
        $th.text(i + 1);
        $headTrs.append($th);

        var $td = $("<td data-bind=\"text: team" + team.teamId + ".value, css : team" + team.teamId + ".style, attr: {'data-teamid': teamId, 'data-guestid': " + team.teamId + " }\"</td>");
        $td.addClass('clickable');
        $bodyTrs.append($td);
    });

    for (var points in neigbors) {
        for (var percents in neigbors[points]) {
            var arr = neigbors[points][percents];
            if (arr.length > 1) {
                var first = arr[0].index + 1;
                var last = arr[arr.length - 1].index + 1;
                var place = (first + last) / 2.0;
                $.each(arr, function (i, item) {
                    teams[item.index].place = place + " ("+ first + " - " + last +")";
                });
            } else {
                teams[arr[0].index].place = arr[0].index + 1;
            }
        }
    }

    ko.applyBindings(microViewModel);
    $(".derby")
        .css("border", '1px lightgray solid')
        .css('background', 'url(flame.png) no-repeat')
        .css('background-position', '12px 2px')
        .css('background-size', '55%');
    $("#mainTable").show();
    $(".footer").show();
    $(".header").show();
    $(".placeBackground").show();
}

//entry point
$(document).ready(function () {
    //events
    $("#mainTable").hide();
    $(".footer").hide();
    $(".header").hide();
    $("#floatingTitle").hide();
    $(".placeBackground").hide();

    $("#mainTable").on('click', function (args) {
        cellClick(args.target);
    });

    $("#mainTable").delegate("td", "mouseover mousemove mouseenter", cellHover);
    $("#mainTable").delegate("th", "mouseover mousemove mouseenter", headHover);

    $(window).resize(function () {
        placePlaces();
    });

    $("#mask").on("click", function (e) {
        microViewModel.clearWindow();
    });

    $(document).keydown(function (e) {
        if (e.keyCode === 27) {
            microViewModel.clearWindow();
        }
    });

    //google spreadsheet init
    Tabletop.init({
        key: public_spreadsheet_url,
        callback: tableTopCallback,
        simpleSheet: false
    })
});