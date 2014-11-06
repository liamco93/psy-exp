// Generated by CoffeeScript 1.7.1

/*
  TODO: be able to display errors on page if they occur
    an issue because of asynchronicity, need to hook up the page somehow
  TODO: update page as db is updated
 */

(function() {
  var Experiment, Q, User, addUser, createExperiment, createUser, crypto, dbSchemata, emailer, expUsersTemplate, generateExpLink, handleError, inviteAll, inviteOne, jade, logInAdmin, logInUser, mongoose, promiseInvite, settings, showAdminCPanel, showExpUsers, showExperiments, showUserLogin, showUserPage, submitUserForm, _;

  mongoose = require('mongoose');

  jade = require('jade');

  crypto = require('crypto');

  _ = require('underscore');

  Q = require('q');

  emailer = require('./modules/emailer');

  dbSchemata = require('./modules/dbSetup');

  settings = require('./config');

  User = mongoose.model('users', dbSchemata.UserSchema);

  Experiment = mongoose.model('experiments', dbSchemata.ExperimentSchema);

  handleError = function(err, res) {
    console.error(err);
    return res.send(500);
  };


  /*
    Start of User functions:
      show user login page
      log in user
      show user experiment page
      handle data from user experiment page submission
   */


  /*
    Serves user login page /TODO: no such page
   */

  showUserLogin = function(req, res) {
    console.log("GET user login page");
    return jade.renderFile('server/views/user-login.jade', {}, function(errJade, htmlResult) {
      if (errJade) {
        return handleError(errJade, res);
      } else {
        return res.send(htmlResult);
      }
    });
  };


  /*
    Logs in user
   */

  logInUser = function(req, res) {
    var hashedPass;
    console.log("POST attempting to log in " + req.params.uid);
    hashedPass = crypto.createHash('sha512');
    hashedPass.update(req.params.pass, 'ascii');
    return Users.findOne({
      uid: req.params.uid,
      hashedPassword: hashedPass.digest('hex')
    }, function(errQuery, usrQuery) {
      if (errQuery) {
        return handleError(errQuery, res);
      } else if (!usrQuery) {
        console.error('logInUser: invalid uid or pass');
        return res.send(400);
      } else {
        return res.send(200);
      }
    });
  };


  /*
    Adds a new user to the db
    TODO: hash password
    TODO: verify field inputs
    TODO: check if referral, so can auto-add exp
   */

  createUser = function(req, res) {
    var hashedPass;
    console.log("POST creating user from " + req.body.email);
    hashedPass = crypto.createHash('sha512');
    hashedPass.update(req.body.pass, 'ascii');
    return User.create({
      email: req.body.email,
      hashedPassword: hashedPass.digest('hex'),
      demographics: {
        age: req.body.age,
        gender: req.body.gender,
        ethnicity: req.body.ethnicity
      }
    }, function(saveErr, usr) {
      if (saveErr) {
        return handleError(saveErr, res);
      } else {
        console.log(usr);
        return res.send(200);
      }
    });
  };


  /*
  	Serves user's experiment page, showing user uid and status
   */

  showUserPage = function(req, res) {
    console.log("GET request from " + req.params.hashstring);
    return Experiment.findOne({
      'users.link': req.params.hashstring
    }, function(errQuery, query) {
      var found, i, target;
      if (errQuery) {
        return handleError(errQuery, res);
      } else if (!query) {
        console.error('showUserPage: hash not found');
        return res.send(404);
      } else {
        i = 0;
        found = false;
        while ((i < query.users.length) && (!found)) {
          if (query.users[i].link = req.params.hashstring) {
            target = query.users[i];
            found = true;
          }
          i++;
        }
        if (target === void 0 || target.linkExpiry === void 0) {
          console.error('showUserPage: something strange happened');
          res.send(500);
        } else if ((new Date(target.linkExpiry)).getTime() < (new Date()).getTime()) {
          console.error('showUserPage: link expired');
          return res.send(400, 'link expired');
        } else {
          return jade.renderFile('server/views/user-submit.jade', {
            uid: target.uid,
            status: target.status
          }, function(errJade, htmlResult) {
            if (errJade) {
              return handleError(errJade, res);
            } else {
              return res.send(htmlResult);
            }
          });
        }
      }
    });
  };


  /*
    Handles experiment page submission, currently only updates user status
   */

  submitUserForm = function(req, res) {
    console.log("POST request from " + req.params.id);
    return User.findByIdAndUpdate(mongoose.Types.ObjectId(req.params.id), {
      '$set': {
        'status': 'completed'
      }
    }, function(errQuery, usrQuery) {
      if (errQuery) {
        return handleError(errQuery, res);
      } else if (!usrQuery) {
        console.error('submitUserForm: _id not found');
        return res.send(404);
      } else {
        console.log('uid: ' + usrQuery.uid + '| status: ' + usrQuery.status);
        return res.send(200);
      }
    });
  };


  /*
    Start of Admin functions
      log in admin
      show admin page/login
      create a new experiment
      show experiment table
      show user table
      add a user
      invites a user
      invites all users
   */


  /*
    Logs in the Admin
   */

  logInAdmin = function(req, res) {
    console.log("POST admin log in with credentials " + req.body.user + " " + req.body.pass);
    if (req.body.pass === settings.confSite.adminUser[req.body.user]) {
      req.session.name = req.body.user;
      return res.send(200);
    } else {
      return res.send(400);
    }
  };


  /*
    Show admin page
   */

  showAdminCPanel = function(req, res) {
    var page;
    console.log("GET admin control panel");
    if (req.session.name) {
      page = 'server/views/admin-gui.jade';
    } else {
      page = 'server/views/admin-login.jade';
    }
    return jade.renderFile(page, {}, function(errJade, htmlResult) {
      if (errJade) {
        return handleError(errJade, res);
      } else {
        return res.send(htmlResult);
      }
    });
  };


  /*
    Creates a new experiment
   */

  createExperiment = function(req, res) {
    console.log("POST new experiment");
    return Experiment.create({
      name: req.body.name,
      "private": req.body["private"] === 'true' ? true : false,
      anonymous: req.body.anonymous === 'true' ? true : false,
      timeLimit: req.body.timeLimit,
      start: new Date(req.body.start),
      end: new Date(req.body.end),
      users: []
    }, function(saveErr, exp) {
      if (saveErr) {
        return handleError(saveErr, res);
      } else {
        console.log(exp);
        return res.send(200);
      }
    });
  };


  /*
    Returns full table of experiments
   */

  showExperiments = function(req, res) {
    console.log("GET experiments table");
    return Experiment.find({}, function(errQuery, doc) {
      if (errQuery) {
        return handleError(errQuery, res);
      } else {
        return res.send(doc);
      }
    });
  };


  /*
    Renders the Jade page for the user table of an experiment
   */

  expUsersTemplate = function(req, res) {
    console.log("GET page for experiment " + req.params.eid);
    return jade.renderFile("server/views/admin-gui-usertable.jade", {
      eid: req.params.eid
    }, function(errJade, htmlResult) {
      if (errJade) {
        return handleError(errJade, res);
      } else {
        return res.send(htmlResult);
      }
    });
  };


  /*
    Queries db for users in an experiment
   */

  showExpUsers = function(req, res) {
    console.log("GET users from experiment " + req.params.eid);
    return Experiment.findById(mongoose.Types.ObjectId(req.params.eid), "users", function(errExpQuery, expQuery) {
      if (errExpQuery) {
        return handleError(errExpQuery, res);
      } else {
        return res.send(expQuery);
      }
    });
  };


  /*
    Adds one user using fields {uid, email}
   */

  addUser = function(req, res) {
    console.log("POST add user uid:" + req.body.uid + " email:" + req.body.email + " to exp " + req.body.eid);
    return Experiment.find({
      '_id': mongoose.Types.ObjectId(req.body.eid),
      '$or': [
        {
          'users.uid': req.body.uid
        }, {
          'users.email': req.body.email
        }
      ]
    }, function(errQuery, usrQuery) {
      if (errQuery) {
        return handleError(errQuery, res);
      } else if (usrQuery.length) {
        console.error('addUser: uid or email already exists');
        return res.send(400);
      } else {
        return Experiment.findById(mongoose.Types.ObjectId(req.body.eid), function(errExpQuery, expQuery) {
          if (errExpQuery) {
            return handleError(errExpQuery, res);
          } else {
            expQuery.users.push({
              'uid': req.body.uid,
              'email': req.body.email,
              'status': 'uninvited',
              'link': "WHY",
              'linkExpiry': Date(),
              'data': {}
            });
            return expQuery.save(function(errSave, newUserDoc) {
              if (errSave) {
                return handleError(errSave, res);
              } else {
                console.log("Saved " + newUserDoc);
                return res.send(200);
              }
            });
          }
        });
      }
    });
  };


  /*
    Generates the experiment link hash for the user.
    hash is a hash of:
      experiment object id
      user id
      expiry date
    Is a separate function in case link format should change, like if there would be performance improvements to having
    some data explicit in the link or we need to add/remove info to/from the hash.
   */

  generateExpLink = function(expObjId, uid, expiryDate) {
    var hashed, unifiedString;
    unifiedString = "" + expObjId + uid + expiryDate;
    hashed = crypto.createHash('sha1');
    hashed.update(unifiedString, 'ascii');
    return hashed.digest('hex');
  };


  /*
    Sends an e-mail to uninvited user indicated by uid
    Updates status to invited
   */

  inviteOne = function(req, res) {
    var xutable;
    console.log("POST invite " + req.body.uid + " from exp " + req.body.eid);
    xutable = Experiment.findOne({
      '_id': mongoose.Types.ObjectId(req.body.eid),
      'users.uid': req.body.uid,
      'users.status': 'uninvited'
    });
    return xutable.exec(function(errQuery, query) {
      var expiry, found, i, linkhash, linkstring, target;
      if (errQuery) {
        return handleError(errQuery, res);
      } else if (query.length === 0) {
        console.error('inviteOne: no such user or no uninvited users');
        return res.send(400);
      } else {
        i = 0;
        found = false;
        while ((i < query.users.length) && (!found)) {
          if ((query.users[i].uid === parseInt(req.body.uid)) && (query.users[i].status === 'uninvited')) {
            target = query.users[i];
            found = true;
          }
          i++;
        }
        if (target === void 0) {
          console.error('inviteOne: user already invited');
          res.send(400);
          return;
        }
        expiry = new Date();
        expiry.setDate(expiry.getDate() + query.timeLimit);
        linkhash = generateExpLink(query._id, target.uid, expiry);
        linkstring = settings.confSite.rootUrl + 'exp/' + linkhash;
        return jade.renderFile('server/views/email-invite.jade', {
          expname: query.name,
          link: linkstring
        }, function(errJade, htmlResult) {
          if (errJade) {
            return handleError(errJade, res);
          } else {
            return emailer.sendEmail(target.email, 'Invitation', htmlResult, function(resMail) {
              console.log(resMail);
              target.status = 'invited';
              target.linkExpiry = expiry;
              target.link = linkhash;
              return query.save(function(errSave) {
                if (errSave) {
                  return handleError(errSave, res);
                } else {
                  return res.send(200);
                }
              });
            }, function(errMail) {
              return handleError(errMail.message, res);
            });
          }
        });
      }
    });
  };


  /*
    Promise-returning function to ensure that e-mails are sent and user statuses are modified
      synchronously in inviteAll
   */

  promiseInvite = function(expname, linkstring, email, index) {
    var deferred;
    deferred = Q.defer();
    jade.renderFile('server/views/email-invite.jade', {
      expname: expname,
      link: linkstring
    }, function(errJade, htmlResult) {
      if (errJade) {
        return deferred.resolve(false);
      } else {
        return emailer.sendEmail(email, 'Invitation', htmlResult, function(errMail, resMail) {
          if (errMail) {
            return deferred.resolve(false);
          } else {
            return deferred.resolve(index);
          }
        });
      }
    });
    return deferred.promise;
  };


  /*
    Sends e-mails to all uninvited users
    Updates each status to invited
   */

  inviteAll = function(req, res) {
    console.log("POST: invite all uninvited from exp " + req.body.eid);
    return Experiment.findOne({
      '_id': mongoose.Types.ObjectId(req.body.eid),
      'users.status': 'uninvited'
    }, function(errQuery, query) {
      var expiry, i, linkhash, linkhashes, linkstring, promises, u, _i, _len, _ref;
      if (errQuery) {
        console.error(errQuery);
        return res.send(500);
      } else if (query === null) {
        console.error('inviteAll: no uninvited users');
        return res.send(400);
      } else {
        promises = [];
        linkhashes = {};
        expiry = new Date();
        expiry.setDate(expiry.getDate() + query.timeLimit);
        _ref = query.users;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          u = _ref[i];
          if (u.status === 'uninvited') {
            linkhash = generateExpLink(query._id, u.uid, expiry);
            linkstring = settings.confSite.rootUrl + 'exp/' + linkhash;
            promises.push(promiseInvite(query.name, linkstring, u.email, i));
            linkhashes[i] = linkhash;
          }
        }
        return Q.all(promises).then(function(indices) {
          var deferred, _j, _len1;
          deferred = Q.defer();
          for (_j = 0, _len1 = indices.length; _j < _len1; _j++) {
            i = indices[_j];
            if (i !== false) {
              query.users[i].status = 'invited';
              query.users[i].linkExpiry = expiry;
              query.users[i].link = linkhashes[i];
            }
          }
          query.save(function(errSave) {
            if (errSave) {
              return deferred.reject(500);
            } else {
              return deferred.resolve(200);
            }
          });
          return deferred.promise;
        }).done((function(result) {
          return res.send(result);
        }), (function(result) {
          return res.send(result);
        }));
      }
    });
  };

  exports.showUserLogin = showUserLogin;

  exports.logInUser = logInUser;

  exports.createUser = createUser;

  exports.showUserPage = showUserPage;

  exports.submitUserForm = submitUserForm;

  exports.showAdminCPanel = showAdminCPanel;

  exports.logInAdmin = logInAdmin;

  exports.showExperiments = showExperiments;

  exports.createExperiment = createExperiment;

  exports.expUsersTemplate = expUsersTemplate;

  exports.showExpUsers = showExpUsers;

  exports.addUser = addUser;

  exports.inviteOne = inviteOne;

  exports.inviteAll = inviteAll;

}).call(this);

//# sourceMappingURL=requestHandlers.map
