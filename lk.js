
var lk = (function() {
  var self = {};
  var demoUrl = 'http://crunchbase.linkurio.us/';

  if (typeof $ === 'undefined') throw new Error('"jQuery" is not declared');
  if (typeof chance === 'undefined') throw new Error('"chance" is not declared');

  self.getUrlVar = function (key) {
    var match = new RegExp('[?&]' + key + '=([^&#]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1]) || "";
  };

  self.email = self.getUrlVar('u');

  self.generateEmail = function () {
    self.email = self.getUrlVar('u') || chance.email();
  };

  /**
   * @param {HTMLButtonElement} button
   * @param {object} wrappedButton jquery wrapped button
   * @param {function} beforeDemoOpen
   * @param {function} failCb
   */
  self.doLogin = function(button, wrappedButton, beforeDemoOpen, failCb) {
    button.form.action = demoUrl + 'api/auth/loginRedirect';

    self.generateEmail();
    console.log('created fake email: ' + self.email);

    wrappedButton.html('Connecting as "' + self.email + '" ...');
    $('input#usernameOrEmail').val(self.email);
    $('input#password').val('demo');
    $('input#path').val('/dashboard');

    // enable cross-domain (work in progress)
    $.support.cors = true;
    $.ajaxPrefilter(function(options) {
      options.crossDomain = true;
      options.xhrFields = {withCredentials: true};
    });

    // does this even work?
    function resetCookie() {
      document.cookie = 'connect.sid=; path=/; expires=Thu, 01-Jan-70 00:00:01 GMT;';
    }
    resetCookie();

    // login as admin
    $.ajax({
      type: 'POST',
      cache: false,
      url: demoUrl + 'api/auth/login',
      data: JSON.stringify({"usernameOrEmail": "admin", "password": "demo_admin"}),
      processData: false,
      contentType: 'application/json',
      dataType: "json"
    }).fail(function (data) {
      failCb('admin login', data, "Unable to connect to the demo.");
    }).done(function() {
      console.log('logged in');

      // register the user
      $.ajax({
        type: 'POST',
        cache: false,
        url: demoUrl + 'api/admin/users',
        data: JSON.stringify({username: self.email, email: self.email, password: 'demo'}),
        processData: false,
        contentType: 'application/json'
      }).fail(function (data) {
        failCb('user create', data, "Could not create your demo account.");
      }).done(function() {
        console.log('demo account created');

        // log out the admin
        $.ajax(demoUrl + 'api/auth/logout').fail(function (data) {
          failCb('admin logout', data, "Something went wrong while creating your demo account.");
        }).done(function() {
          console.log('logged out');
          resetCookie();

          beforeDemoOpen();
          button.form.submit();
        });
      });
    });
  };

  self.register = function (button) {
    var wrappedButton = $('#registerBtn');
    var buttonText = wrappedButton.html();

    wrappedButton.addClass('disabled');
    wrappedButton.html('Checking demo session...');

    var fail = function fail(step, errorData, message) {
      wrappedButton.removeClass('disabled');
      wrappedButton.html(buttonText);
      console.log(step + ' error: ' + JSON.stringify(errorData, null, ' '));
      alert(message + '\nPlease let us know at contact@linkurio.us');
    };

    var beforeDemoOpen = function() {
      wrappedButton.html('Loading the demo ...');
      $(window.parent.document.getElementById('login-header')).hide();
      $(window.parent.document.getElementById('demo-header')).show();
    };

    $.ajax(demoUrl + 'api/auth/me').always(function(data, type) {
      if (type === 'error') {
        // not logged in
        self.doLogin(button, wrappedButton, beforeDemoOpen, fail);
      } else {
        console.log('already logged in the demo');
        beforeDemoOpen();
        document.location.href = demoUrl;
      }
    });
  };

  return self;
})();
