// Client-side JavaScript, bundled and sent to client.
Sections = new Meteor.Collection("sections");
Directories = new Meteor.Collection("directories");
Files = new FS.Collection("files",{stores:["files_uploads","files_gridfs"]});

// ID of currently selected list
Session.setDefault('sl', null);

// Subscribe to 'lists' collection on startup.
// Select a list once data has arrived.
var sectionHandle = Meteor.subscribe('slincks', function () {
  if (!Session.get('sl')) {
    var slinck = Slincks.findOne({}, {sort: {name: 1}});
    if (slinck)
      Router.setPath(slinck.name);
    }
});

var filesHandle = null;
// Always be subscribed to the todos for the selected list.
Deps.autorun(function () {
  var sl = Session.get('sl');
  console.log("autorun:"+sl);
  if (sl)
    filesHandle = Meteor.subscribe('files', sl);
  else
    filesHandle = null;
});


/*
Template.lists.events({
  'mousedown .list': function (evt) { // select list
    Router.setPath(this.name);
  },
  'click .list': function (evt) {
    // prevent clicks on <a> from refreshing the page.
    evt.preventDefault();
  },
  'click #newslincksubmit' :  function (evt) {
      var name = $('#new-name').val();
      Slincks.insert({
        name: name, 
        path: $('#new-path').val()
      });
      $('#new-name').val('');
      $('#new-path').val('');
      Router.setPath(name);
      evt.target.value = "";
    }
});*/

Handlebars.registerHelper('key_value', function(context, options) {
  var result = [];
  _.each(context, function(value, key, list){
    result.push({key:key, value:value});
  });
  return result;
});

Template.breadcrumb.sl = function () {
  var path = Session.get('sl');
  if (path)
    return new $_.Slinck(path);
  else
    return  null;
};

var SlinckRouter = Backbone.Router.extend({
  routes: {
    "raw/*path": "download",
    "edit/*path": "edit",
    "view/*path": "slRoute",
    "*path": "slRoute"
    
  },
  slRoute: function (path) {
    console.log("slRoute:"+path);
    var oldpath = Session.get("sl");
    if (oldpath !== path) {
      Session.set("sl", path);
    }
  },
  setPath: function (path) {
    console.log("se:"+path);
    this.navigate(path, true);
  }
});

Router = new SlinckRouter;

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});

Meteor.startup(function(){
  var cm = CodeMirror(
      $('#view')[0], {
        value: "",
        mode:  "sliki",
      });
  cm.on('change',  function(){
       var h = new $_.Sliki(cm.getDoc().getValue()).render();
       $('#sliki').html(h);
  });
});




