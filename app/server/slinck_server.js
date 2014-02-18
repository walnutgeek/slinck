

Sections = new Meteor.Collection("sections");
Directories = new Meteor.Collection("directories");

Files = new FS.Collection("files", {
  stores: [
           new FS.Store.FileSystem("files_uploads", {path: "~/uploads"}),
           new FS.Store.GridFS("files_gridfs")
           ]
});

