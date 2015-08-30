Games = new Mongo.Collection("games");
Viewers = new Mongo.Collection("viewers");
Teams = new Mongo.Collection("teams");

Games.allow({
  insert: function (userId, doc) {
    return true;
  },
  update: function (userId, doc, fields, modifier) {
    return true;
  },
  remove: function (userId, doc) {
    return true;
  }
});

Viewers.allow({
  insert: function (userId, doc) {
    return true;
  },
  update: function (userId, doc, fields, modifier) {
    return true;
  },
  remove: function (userId, doc) {
    return true;
  }
});

Teams.allow({
  insert: function (userId, doc) {
    return true;
  },
  update: function (userId, doc, fields, modifier) {
    return true;
  },
  remove: function (userId, doc) {
    return true;
  }
});

Games.deny({
  insert: function(userId, game) {
    game.createdAt = new Date().valueOf();
    return false;
  }
});

Viewers.deny({
  insert: function(userId, game) {
    game.createdAt = new Date().valueOf();
    return false;
  }
});

Teams.deny({
  insert: function(userId, game) {
    game.createdAt = new Date().valueOf();
    return false;
  }
});
