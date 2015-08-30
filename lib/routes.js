Router.route("/", function () {
  this.render("main");
  Session.set("currentView", "startMenu");
});

Router.route("/:accessCode", function () {
  var accessCode = this.params.accessCode;
  this.render("main");
  Session.set("urlAccessCode", accessCode);
  Session.set("currentView", "joinGame");
});

Router.route("/:accessCode/:viewType", function () {
  var accessCode = this.params.accessCode;
  var viewType = this.params.viewType;
  this.render("main");
  if (viewType !== "guesser" && viewType !== "giver" && viewType !== "moderator") {
    viewType = "guesser";
  }
  Session.set("urlAccessCode", accessCode);
  Session.set("viewType", viewType);
  Session.set("currentView", "guesserGameView");
});
