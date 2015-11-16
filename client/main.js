//
// Helper functions
//

Handlebars.registerHelper('arrayify', function(obj) {
    result = [];
    for (var key in obj) result.push({key: key, value: obj[key]});
    return result;
});

Handlebars.registerHelper("toCapitalCase", function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
});

function getRandomLocation() {
  var locationIndex = Math.floor(Math.random() * LOCATIONS.length);
  return LOCATIONS[locationIndex];
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

//
// View support
//

// Display area extents
// Initialize to full window
var X_MIN = 0;
var X_MAX = window.innerWidth;
var Y_MIN = 0;
var Y_MAX = window.innerHeight;

function initView() {
	calculateExtents();
	renderViewableArea();
}

var VIEW_RATIO = 4.0/3.0;
var INV_VIEW_RATIO = 1.0/VIEW_RATIO;

function calculateExtents() {
	// Calculate window width and height
	var clientWidth = window.innerWidth;
	var clientHeight = window.innerHeight;

	// Initialize variables for target width and height
	var targetWidth = clientWidth;
	var targetHeight = clientHeight;

	if (clientHeight < INV_VIEW_RATIO*clientWidth ) {
		// When height is relatively smaller, width constrained to view ratio
		targetWidth = Math.max(Math.floor(VIEW_RATIO*clientHeight), 900);
		targetHeight = clientHeight;
	} else {
		// When width is relatively smaller, height unconstrained
		targetWidth = clientWidth;
		targetHeight = clientHeight;
	}

	// Center horizontally
	X_MIN = Math.floor((clientWidth - targetWidth)/2);
	X_MAX = X_MIN + targetWidth;

	// Top-align vertically
	Y_MIN = 0;
	Y_MAX = Y_MIN + targetHeight;
}

function renderViewableArea() {
	var leftBlock = document.getElementById("leftBlock");
	var rightBlock = document.getElementById("rightBlock");
	var topBlock = document.getElementById("topBlock");
	var bottomBlock = document.getElementById("bottomBlock");
  var mainContent = document.getElementById("main-content");

	leftBlock.style.position = "absolute";
	leftBlock.style.left = 0 + "px";
	leftBlock.style.top = 0 + "px";
	leftBlock.style.width = X_MIN + "px";
	leftBlock.style.height = (window.innerHeight) + "px";

	rightBlock.style.position = "absolute";
	rightBlock.style.left = X_MAX + "px";
	rightBlock.style.top = 0 + "px";
	rightBlock.style.width = (window.innerWidth - X_MAX) + "px";
	rightBlock.style.height = (window.innerHeight) + "px";

	topBlock.style.position = "absolute";
	topBlock.style.left = 0 + "px";
	topBlock.style.top = 0 + "px";
	topBlock.style.width = (window.innerWidth) + "px";
	topBlock.style.height = Y_MIN + "px";

	bottomBlock.style.position = "absolute";
	bottomBlock.style.left = 0 + "px";
	bottomBlock.style.top = Y_MAX + "px";
	bottomBlock.style.width = (window.innerWidth) + "px";
	bottomBlock.style.height = (window.innerHeight - Y_MAX) + "px";

  mainContent.style.position = "absolute";
  mainContent.style.left = X_MIN + "px";
	mainContent.style.top = Y_MIN + "px";
	mainContent.style.width = (X_MAX - X_MIN) + "px";
	mainContent.style.height = (Y_MAX - Y_MIN) + "px";
}

//
// Language support
//

function initUserLanguage() {
  var language = amplify.store("language");

  if (language) {
    Session.set("language", language);
  }

  setUserLanguage(getUserLanguage());
}

function getUserLanguage() {
  var language = Session.get("language");

  if (language) {
    return language;
  } else {
    return "en";
  }
};

function setUserLanguage(language) {
  TAPi18n.setLanguage(language).done(function () {
    Session.set("language", language);
    amplify.store("language", language);
  });
}

function getLanguageDirection() {
  var language = getUserLanguage()
  var rtlLanguages = ["he"];

  if ($.inArray(language, rtlLanguages) !== -1) {
    return "rtl";
  } else {
    return "ltr";
  }
}

function getLanguageList() {
  var languages = TAPi18n.getLanguages();
  var languageList = _.map(languages, function(value, key) {
    var selected = "";

    if (key == getUserLanguage()) {
      selected = "selected";
    }

    // Gujarati isn'thandled automatically by tap-i18n,
    // so we need to set the language name manually
    if (value.name == "gu") {
        value.name = "ગુજરાતી";
    }

    return {
      code: key,
      selected: selected,
      languageDetails: value
    };
  });

  if (languageList.length <= 1) {
    return null;
  }

  return languageList;
}

//
// Retrieval of game objects
//

function getCurrentGame() {
  var gameID = Session.get("gameID");

  if (gameID) {
    return Games.findOne(gameID);
  }
}

function getAccessLink() {
  var game = getCurrentGame();

  if (!game) {
    return;
  }

  return Meteor.settings.public.url + game.accessCode + "/";
}

function getCurrentViewer() {
  var viewerID = Session.get("viewerID");

  if (viewerID) {
    return Viewers.findOne(viewerID);
  }
}

function getCurrentTeam() {
  var teamID = Session.get("teamID");

  if (teamID) {
    return Teams.findOne(teamID);
  }
}

//
// Create game objects
//

function generateAccessCode() {
  var code = "";
  var possible = "abcdefghijklmnopqrstuvwxyz";

    for (var i = 0; i < 6; i++) {
      code += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return code;
}

function generateNewGame() {
  var game = {
    accessCode: generateAccessCode(),
    state: "waitingForViewers",
    words: null
  };

  var gameID = Games.insert(game);
  return Games.findOne(gameID);
}

function generateNewViewer(game, name) {
  var viewer = {
    gameID: game._id,
    name: name,
    role: null,
    isSpy: false,
    isFirstViewer: false
  };

  var viewerID = Viewers.insert(viewer);
  return Viewers.findOne(viewerID);
}

function generateNewTeam(game) {
  var team = {
    gameID: game._id,
    // TODO: Add more team properties
  };

  var teamID = Teams.insert(team);
  return Teams.findOne(teamID);
}

//
// Game setup
//

function getRandomWords(num) {
  // Duplicate the word list and convert to uppercase
  var gameWords = WORDS.slice();

  // Shuffle the list to randomize
  var shuffledGameWords = shuffleArray(gameWords);

  // Grab the first 25
  shuffledGameWords = shuffledGameWords.slice(0, num);

  // Convert to uppercase
  for (i = 0; i < shuffledGameWords.length; i++) {
    shuffledGameWords[i] = shuffledGameWords[i].toUpperCase();
  }

  return shuffledGameWords;
}

function getRandomAssignments(numBlue, numRed, numNeutral, numAssassin) {
  var assignments = [];

  for (i = 0; i < numBlue; i++) {
    assignments.push("blue");
  }

  for (i = 0; i < numRed; i++) {
    assignments.push("red");
  }

  for (i = 0; i < numNeutral; i++) {
    assignments.push("neutral");
  }

  for (i = 0; i < numAssassin; i++) {
    assignments.push("assassin");
  }

  return shuffleArray(assignments);
}

function assignRoles(viewers, location) {
  var default_role = location.roles[location.roles.length - 1];
  var roles = location.roles.slice();
  var shuffled_roles = shuffleArray(roles);
  var role = null;

  viewers.forEach(function(viewer) {
    if (!viewer.isSpy) {
      role = shuffled_roles.pop();

      if (role === undefined) {
        role = default_role;
      }

      Viewers.update(viewer._id, {$set: {role: role}});
    }
  });
}

function resetClientState() {
  var viewer = getCurrentViewer();

  if (viewer) {
    Viewers.remove(viewer._id);
  }

  Session.set("gameID", null);
  Session.set("viewerID", null);
}

function trackGameState() {
  var gameID = Session.get("gameID");
  var viewerID = Session.get("viewerID");

  if (!gameID || !viewerID) {
    return;
  }

  var game = Games.findOne(gameID);
  var viewer = Viewers.findOne(viewerID);

  if (!game || !viewer) {
    Session.set("gameID", null);
    Session.set("viewerID", null);
    Session.set("currentView", "startMenu");
    Session.set("currentBkgd", "neutral");
    return;
  }

  if (game.state === "inProgress") {
    Session.set("currentView", "guesserGameView");
    Session.set("currentBkgd", game.turn);
  } else if (game.state === "assassinVisible") {
    Session.set("currentView", "guesserGameView");
    Session.set("currentBkgd", "black");
  } else if (game.state === "waitingForViewers") {
    Session.set("currentView", "lobby");
    Session.set("currentBkgd", "neutral");
  }
}

function leaveGame() {
  var viewer = getCurrentViewer();

  Session.set("currentView", "startMenu");
  Session.set("currentBkgd", "neutral");
  Viewers.remove(viewer._id);

  Session.set("viewerID", null);
  Session.set("currentBkgd", "neutral");
}

function hasHistoryApi () {
  return !!(window.history && window.history.pushState);
}

initUserLanguage();

Meteor.setInterval(function () {
  Session.set("time", new Date());
}, 100);

if (hasHistoryApi()) {
  function trackUrlState () {
    var accessCode = null;
    var game = getCurrentGame();
    if (game) {
      accessCode = game.accessCode;
    } else {
      accessCode = Session.get("urlAccessCode");
    }

    var currentURL = "/";
    if (accessCode) {
      currentURL += accessCode+"/";
    }
    window.history.pushState(null, null, currentURL);
  }
  Tracker.autorun(trackUrlState);
}
Tracker.autorun(trackGameState);

FlashMessages.configure({
  autoHide: true,
  autoScroll: false
});

//
// main rendering
//

Template.main.created = function() {
  $(window).resize(function() {
    calculateExtents();
    renderViewableArea();
  });
};

Template.main.destroyed = function() {
  $(window).off('resize');
};

Template.main.rendered = function() {
    if(!this._rendered) {
      this._rendered = true;
      initView();
    }
}

Template.main.helpers({
  bkgd: function() {
    return Session.get("currentBkgd");
  },
  whichView: function() {
    return Session.get("currentView");
  },
  language: function() {
    return getUserLanguage();
  },
  textDirection: function() {
    return getLanguageDirection();
  }
});

//
// footer rendering
//

Template.footer.helpers({
  languages: getLanguageList
})

Template.footer.events({
  "click .btn-set-language": function (event) {
    var language = $(event.target).data("language");
    setUserLanguage(language);
  },
  "change .language-select": function (event) {
    var language = event.target.value;
    setUserLanguage(language);
  }
})

//
// startMenu view rendering
//

Template.startMenu.events({
  "click #btn-new-game": function() {
    Session.set("currentView", "createGame");
    Session.set("currentBkgd", "neutral");
  },
  "click #btn-join-game": function () {
    Session.set("currentView", "joinGame");
  }
});

Template.startMenu.helpers({
  alternativeURL: function() {
    return Meteor.settings.public.alternative;
  }
});

Template.startMenu.rendered = function() {
  resetClientState();
};

//
// createGame view rendering
//

function createGame(viewerName) {
  console.log("createGame: "+viewerName);

  if (!viewerName) {
    return false;
  }

  var game = generateNewGame();
  var viewer = generateNewViewer(game, viewerName);

  Meteor.subscribe("games", game.accessCode);

  Session.set("loading", true);

  Meteor.subscribe("viewers", game._id, function onReady() {
    Session.set("loading", false);

    Session.set("gameID", game._id);
    Session.set("viewerID", viewer._id);
    Session.set("currentView", "lobby");
    Session.set("currentBkgd", "neutral");
  });

  return false;
}

Template.createGame.events({
  // "submit #create-game": function(event) {
  //
  //   var viewerName = event.target.viewerName.value;
  //
  //   if (!viewerName) {
  //     return false;
  //   }
  //
  //   var game = generateNewGame();
  //   var viewer = generateNewViewer(game, viewerName);
  //
  //   Meteor.subscribe("games", game.accessCode);
  //
  //   Session.set("loading", true);
  //
  //   Meteor.subscribe("viewers", game._id, function onReady() {
  //     Session.set("loading", false);
  //
  //     Session.set("gameID", game._id);
  //     Session.set("viewerID", viewer._id);
  //     Session.set("currentView", "lobby");
  //   });
  //
  //   return false;
  // },
  "click .btn-guesserViewer": function () {
    return createGame("guesser");
  },
  "click .btn-giverViewer": function () {
    return createGame("giver");
  },
  "click .btn-moderatorViewer": function () {
    return createGame("moderator");
  },
  "click .btn-back": function () {
    Session.set("currentView", "startMenu");
    Session.set("currentBkgd", "neutral");
    return false;
  }
});

Template.createGame.helpers({
  isLoading: function() {
    return Session.get("loading");
  }
});

Template.createGame.rendered = function (event) {
  $("#viewer-name").focus();
};

//
// joinGame view rendering
//

function joinGame(accessCode, viewerName) {
  console.log("joinGame: "+accessCode+","+viewerName);
  accessCode = accessCode.trim();
  accessCode = accessCode.toLowerCase();

  Session.set("loading", true);

  Meteor.subscribe("games", accessCode, function onReady() {
    Session.set("loading", false);

    var game = Games.findOne({
      accessCode: accessCode
    });

    if (game) {
      Meteor.subscribe("viewers", game._id);
      viewer = generateNewViewer(game, viewerName);

      Session.set("urlAccessCode", null);
      Session.set("gameID", game._id);
      Session.set("viewerID", viewer._id);
      Session.set("currentView", "lobby");
      Session.set("currentBkgd", game.turn);
    } else {
      FlashMessages.sendError(TAPi18n.__("ui.invalid access code"));
    }
  });

  return false;
}

Template.joinGame.events({
  // "submit #join-game": function(event) {
  //
  //   var accessCode = event.target.accessCode.value;
  //   var viewerName = event.target.viewerName.value;
  //
  //   accessCode = accessCode.trim();
  //   accessCode = accessCode.toLowerCase();
  //
  //   Session.set("loading", true);
  //
  //   Meteor.subscribe("games", accessCode, function onReady() {
  //     Session.set("loading", false);
  //
  //     var game = Games.findOne({
  //       accessCode: accessCode
  //     });
  //
  //     if (game) {
  //       Meteor.subscribe("viewers", game._id);
  //       viewer = generateNewViewer(game, viewerName);
  //
  //       Session.set("urlAccessCode", null);
  //       Session.set("gameID", game._id);
  //       Session.set("viewerID", viewer._id);
  //       Session.set("currentView", "lobby");
  //     } else {
  //       FlashMessages.sendError(TAPi18n.__("ui.invalid access code"));
  //     }
  //   });
  //
  //   return false;
  // },
  "click .btn-guesserViewer": function(event) {
    var accessCode = $("#access-code").val();
    return joinGame(accessCode, "guesser");
  },
  "click .btn-giverViewer": function(event) {
    var accessCode = $("#access-code").val();
    return joinGame(accessCode, "giver");
  },
  "click .btn-moderatorViewer": function(event) {
    var accessCode = $("#access-code").val();
    return joinGame(accessCode, "moderator");
  },
  "click .btn-back": function() {
    Session.set("urlAccessCode", null);
    Session.set("currentView", "startMenu");
    Session.set("currentBkgd", "neutral");
    return false;
  }
});

Template.joinGame.helpers({
  isLoading: function() {
    return Session.get("loading");
  }
});


Template.joinGame.rendered = function (event) {
  resetClientState();

  var urlAccessCode = Session.get("urlAccessCode");

  if (urlAccessCode) {
    $("#access-code").val(urlAccessCode);
    $("#access-code").hide();
    $("#viewer-name").focus();
  } else {
    $("#access-code").focus();
  }
};

//
// lobby view rendering
//

Template.lobby.helpers({
  game: function () {
    return getCurrentGame();
  },
  accessLink: function () {
    return getAccessLink();
  },
  viewer: function () {
    return getCurrentViewer();
  },
  viewers: function () {
    var game = getCurrentGame();
    var currentViewer = getCurrentViewer();

    if (!game) {
      return null;
    }

    var viewers = Viewers.find({"gameID": game._id}, {"sort": {"createdAt": 1}}).fetch();

    viewers.forEach (function(viewer) {
      if (viewer._id === currentViewer._id) {
        viewer.isCurrent = true;
      }
    });

    return viewers;
  }
});

Template.lobby.events({
  "click .btn-leave": leaveGame,
  "click .btn-start": function () {

    var game = getCurrentGame();
    var location = getRandomLocation();
    var words = getRandomWords(25);
    var first = shuffleArray(["blue", "red"])[0];
    var assignments = getRandomAssignments(
                        first == "blue" ? 9 : 8,
                        first == "blue" ? 8 : 9,
                        7,
                        1);

    var wordAssignments = [];

    for (i = 0; i < Math.max(words.length, assignments.length); i++) {
      wordAssignments.push({
          word: words[i],
          assignment: assignments[i],
          state: "hidden"
      });
    }

    //console.log("WORDS="+wordAssignments);
    //console.log("LENGTH="+wordAssignments.length);

    var viewers = Viewers.find({gameID: game._id});
    var localEndTime = moment().add(game.lengthInMinutes, "minutes");
    var gameEndTime = TimeSync.serverTime(localEndTime);

    var spyIndex = Math.floor(Math.random() * viewers.count());
    var firstViewerIndex = Math.floor(Math.random() * viewers.count());

    viewers.forEach(function(viewer, index) {
      Viewers.update(viewer._id, {$set: {
        isSpy: index === spyIndex,
        isFirstViewer: index === firstViewerIndex
      }});
    });

    assignRoles(viewers, location);

    Session.set("currentBkgd", first);

    Games.update(game._id, {$set: {
      state: "inProgress",
      location: location,
      first: first,
      turn: first,
      words: wordAssignments,
      endTime: gameEndTime,
      paused: false,
      pausedTime: null
    }});
  },
  "click .btn-toggle-qrcode": function() {
    $(".qrcode-container").toggle();
  },
  "click .btn-remove-viewer": function(event) {
    var viewerID = $(event.currentTarget).data("viewer-id");
    Viewers.remove(viewerID);
  },
  "click .btn-edit-viewer": function(event) {
    var game = getCurrentGame();
    resetClientState();
    Session.set("urlAccessCode", game.accessCode);
    Session.set("currentView", "joinGame");
    Session.set("currentBkgd", game.turn);
  }
});

Template.lobby.rendered = function (event) {
  var url = getAccessLink();
  var qrcodesvg = new Qrcodesvg(url, "qrcode", 250);
  qrcodesvg.draw();
};

function getTimeRemaining() {
  var game = getCurrentGame();
  var localEndTime = game.endTime - TimeSync.serverOffset();

  if (game.paused) {
    var localPausedTime = game.pausedTime - TimeSync.serverOffset();
    var timeRemaining = localEndTime - localPausedTime;
  } else {
    var timeRemaining = localEndTime - Session.get("time");
  }

  if (timeRemaining < 0) {
    timeRemaining = 0;
  }

  return timeRemaining;
}

//
// guesserGameView view rendering
//

Template.guesserGameView.helpers({
  game: getCurrentGame,
  viewer: getCurrentViewer,
  words: function() {
    var words = getCurrentGame().words;
    var showAllAssignments = getCurrentViewer().name != "guesser";

    var result = [];
    for (var i = 0; i < words.length; i++) {
      var state = "";
      if (words[i]["state"] == "hidden" && !showAllAssignments) {
        state = "unknown";
      } else {
        state = words[i]["state"] + "-" + words[i]["assignment"];
      }

      var wordItem = {};
      wordItem["word"] = words[i]["word"];
      wordItem["state"] = state;

      console.log(wordItem);
      result.push(wordItem);
    }

    return result;
  },
  viewers: function () {
    var game = getCurrentGame();

    if (!game) {
      return null;
    }

    var viewers = Viewers.find({
      "gameID": game._id
    });

    return viewers;
  },
//  words: function() {
//    return getRandomWords();
//  },
  gameFinished: function () {
    var timeRemaining = getTimeRemaining();

    return timeRemaining === 0;
  },
  timeRemaining: function () {
    var timeRemaining = getTimeRemaining();

    return moment(timeRemaining).format("mm[<span>:</span>]ss");
  }
});

Template.guesserGameView.events({
  "click .word": function(event) {
    var wordID = $(event.currentTarget).data("word-id");
    if (wordID == null) {
      return;
    }

    var game = getCurrentGame();
    var state = game.state;
    var words = game.words;
    var turn = game.turn;
    var wordIndex = -1;

    for (var i = 0; i < words.length; i++) {
      if (wordID == words[i]["word"]) {
        wordIndex = i;
        break;
      }
    }

    var currentWordState = words[wordIndex]["state"];

    // If a new word was revealed, change team control if the word doesn't
    // match current team's color.
    if (currentWordState == "hidden"
        && words[wordIndex]["assignment"] != turn) {
      turn = (turn == "blue") ? "red" : "blue";
    }

    if (currentWordState == "hidden" && words[wordIndex]["assignment"] == "assassin") {
      state = "assassinVisible";
    } else if (currentWordState == "visible" && words[wordIndex]["assignment"] == "assassin") {
      state = "inProgress";
    }

    words[wordIndex]["state"] = (currentWordState == "visible") ? "hidden" : "visible";

    Games.update(game._id, {$set: {
      state: state,
      words: words,
      turn: turn
    }});

    console.log(wordID);
  },
  "click .btn-pass": function() {
    var game = getCurrentGame();
    var turn = game.turn;
    turn = (turn == "blue") ? "red" : "blue";
    Games.update(game._id, {$set: {
      turn: turn
    }});

    Session.set("currentBkgd", turn);
  },
  "click .btn-leave": leaveGame,
  "click .btn-end": function() {
    var game = getCurrentGame();
    Games.update(game._id, {$set: {state: "waitingForViewers"}});
    Session.set("currentBkgd", "neutral");
  },
  "click .btn-toggle-status": function() {
    $(".status-container-content").toggle();
  },
  "click .game-countdown": function() {
    var game = getCurrentGame();
    var currentServerTime = TimeSync.serverTime(moment());

    if (game.paused) {
      var newEndTime = game.endTime - game.pausedTime + currentServerTime;
      Games.update(game._id, {$set: {paused: false, pausedTime: null, endTime: newEndTime}});
    } else {
      Games.update(game._id, {$set: {paused: true, pausedTime: currentServerTime}});
    }
  }
});
