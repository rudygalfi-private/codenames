function cleanUpStaleObjects() {
  // Establish a cutoff for 24 hours previous to now
  var cutOff = moment().subtract(24, "hours").toDate().getTime();

  // Remove the games created before the cutoff
  var numGamesRemoved = Games.remove({
    createdAt: {$lt: cutOff}
  });

  // Remove the viewers created before the cutoff
  var numViewersRemoved = Viewers.remove({
    createdAt: {$lt: cutOff}
  });

  // Remove the teams created before the cutoff
  var numTeamsRemoved = Teams.remove({
    createdAt: {$lt: cutOff}
  });
}

Meteor.startup(function() {
  // Delete all games, viewers, and teams at server startup.
  Games.remove({});
  Viewers.remove({});
  Teams.remove({});
});

// Set up a cron job for every minute
var MyCron = new Cron(60000);

// Run cleanUpStaleObjects every 5 ticks, so every 5 mins
MyCron.addJob(5, cleanUpStaleObjects);

Meteor.publish("games", function(accessCode) {
  return Games.find({"accessCode": accessCode});
});

Meteor.publish("viewers", function(gameID) {
  return Viewers.find({"gameID": gameID});
});

Meteor.publish("teams", function(gameID) {
  return Teams.find({"gameID": gameID});
});
