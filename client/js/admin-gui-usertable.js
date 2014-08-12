// Generated by CoffeeScript 1.7.1
(function() {
  var loadUsers;

  loadUsers = function() {
    return $.get("/admin/viewusers/" + ($('#userTable').attr("eid")), function(data, txtStatus, jqXHR) {
      var user, _i, _len, _ref;
      $('#userData').children().detach();
      console.log(data);
      _ref = data.users;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        user = _ref[_i];
        $('#userData').append('<tr><td>' + user.uid + '</td><td>' + user.email + '</td><td class="ui left pointing dropdown">' + user.status + '<div class="menu"><div class="item">asdf</div></div></td></tr>');
      }
      return $('.ui.dropdown').dropdown();
    });
  };

  $(function() {
    return loadUsers();
  });

  $('#invOne').submit(function() {
    $.post('/admin/invite', {
      uid: this.uid.value
    }).done(function() {
      $('#resultInvOne').html("OK");
      return loadUsers();
    }).fail(function(data) {
      if (data.status === 400) {
        return $('#resultInvOne').html("UID does not exist or was already invited");
      } else if (data.status === 500) {
        return $('#resultInvOne').html("Something went wrong");
      }
    });
    return false;
  });

  $('#invAll').submit(function() {
    $.post('/admin/inviteall').done(function() {
      $('#resultInvAll').html("OK");
      return loadUsers();
    }).fail(function(data) {
      if (data.status === 400) {
        return $('#resultInvAll').html("No uninvited users");
      } else if (data.status === 500) {
        return $('#resultInvAll').html("Something went wrong");
      }
    });
    return false;
  });

  $('#addUsr').submit(function() {
    $.post('/admin/adduser', {
      eid: $('#userTable').attr("eid"),
      uid: this.uid.value,
      email: this.email.value
    }).done(function() {
      $('#resultAddUsr').html("OK");
      return loadUsers();
    }).fail(function(data) {
      return console.log(data.status);

      /*if data.status is 400
        $('#resultAddUsr').html("UID or e-mail already exists")
      else if data.status is 500
        $('#resultAddUsr').html("Something went wrong")
       */
    });
    return false;
  });

}).call(this);

//# sourceMappingURL=admin-gui-usertable.map
