
var lk = (function() {
  var self = {};

  // CONFIG
  var groups = [6];
  var adminUser = 'demo';
  var adminPass = 'demo_pass';
  var defaultTargetPath = '/new?populate=expandNodeId&item_id=4838';
  
  // detect current URL
  var hostPort = document.location.hostname + (document.location.port ? ':' + document.location.port : '');
  var demoUrl = document.location.protocol + '//' + hostPort + '/';

  if (typeof $ === 'undefined') throw new Error('"jQuery" is not declared');
  if (typeof chance === 'undefined') throw new Error('"chance" is not declared');

  self.getUrlVar = function (key) {
    var match = new RegExp('[?&]' + key + '=([^&#]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1]) || '';
  };

  self.email = self.getUrlVar('u');

  self.generateEmail = function () {
    self.email = self.getUrlVar('u') || chance.email();
  };

  /**
   * @param {HTMLFormElement} form
   * @param {object} wrappedButton jquery wrapped button
   * @param {string} targetPath path to open upon logging in
   * @param {function} beforeDemoOpen
   * @param {function} failCb
   */
  self.doLogin = function(form, wrappedButton, targetPath, beforeDemoOpen, failCb) {
    form.action = demoUrl + 'api/auth/loginRedirect';

    self.generateEmail();
    console.log('created random email: ' + self.email);

    wrappedButton.html('Connecting as "' + self.email + '" ...');
    $('input#usernameOrEmail').val(self.email);
    $('input#password').val('demo');
    $('input#path').val(targetPath);

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
      data: JSON.stringify({usernameOrEmail: adminUser, password: adminPass}),
      processData: false,
      contentType: 'application/json',
      dataType: 'json'
    }).fail(function (data) {
      failCb('admin login', data, 'Unable to connect to Linkurious.');
    }).done(function() {
      console.log('logged in');

      // register the user
      $.ajax({
        type: 'POST',
        cache: false,
        url: demoUrl + 'api/admin/users',
        data: JSON.stringify({
          username: self.email,
          email: self.email,
          password: 'demo',
          groups: groups
        }),
        processData: false,
        contentType: 'application/json'
      }).fail(function (data) {
        failCb('user create', data, 'Could not create your account.');
      }).done(function() {
        console.log('demo account created');

        // log out the admin
        $.ajax(demoUrl + 'api/auth/logout').fail(function (data) {
          failCb('admin logout', data, 'Something went wrong while creating your account.');
        }).done(function() {
          console.log('logged out');
          resetCookie();

          beforeDemoOpen();
          form.submit();
        });
      });
    });
  };

  /**
   * @param {string} [targetPath="/dashboard"]
   */
  self.register = function(targetPath) {
    if (typeof targetPath !== 'string') { targetPath = null; } 
    if (!targetPath) { targetPath = defaultTargetPath; }
    
    var wrappedButton = $('#registerBtn');
    var form = $('#form').get(0);
    var buttonText = wrappedButton.html();

    wrappedButton.addClass('disabled');
    wrappedButton.html('Checking session...');

    var fail = function fail(step, errorData, message) {
      wrappedButton.removeClass('disabled');
      wrappedButton.html(buttonText);
      console.log(step + ' error: ' + JSON.stringify(errorData, null, ' '));
      alert(message + '\nPlease let us know at contact@linkurio.us');
    };

    var beforeDemoOpen = function() {
      wrappedButton.html('Loading ...');
      $(window.parent.document.getElementById('login-header')).hide();
      $(window.parent.document.getElementById('demo-header')).show();
    };

    $.ajax(demoUrl + 'api/auth/me').always(function(data, type) {
      if (type === 'error') {
        // not logged in
        self.doLogin(form, wrappedButton, targetPath, beforeDemoOpen, fail);
      } else {
        console.log('already logged in');
        beforeDemoOpen();
        document.location.href = demoUrl + targetPath.substr(1);
      }
    });
  };

  return self;
})();
