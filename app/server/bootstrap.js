Meteor.startup(function () {
  Accounts.loginServiceConfiguration.remove({service: "github"});

  Accounts.loginServiceConfiguration.insert({
    service: "github",
    clientId: "bd285d4f3ae20341c961",
    secret: "84c1be16493bcbe412a88727051f6dc1ee97a632",
  });
});
