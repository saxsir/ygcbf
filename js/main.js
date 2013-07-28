// @notice Load the SDK asynchronously
(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  // js.src = "//connect.facebook.net/en_US/all.js";
  // @notice for debug
  js.src = "//connect.facebook.net/en_US/all/debug.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// @notice facebookのSDKロードし終わったら呼ばれる
window.fbAsyncInit = function () {
  // @notice 初期化
  FB.init({
    appId: '339478286183272', // App ID from the app dashboard
    // channelUrl : 'channel.html', // Channel file for x-domain comms
    status: true, // Check Facebook Login status
    cookie: true, // enable cookies to allow the server to access the session
    xfbml: true // Look for social plugins on the page
  });

  // @notice SDKロード後にやりたいことはこの下にかく
  FB.getLoginStatus(updateButton);
  FB.Event.subscribe('auth.statusChange', updateButton);

  $('#eval').click(function () {
    // console.log(uid); //debug
    // /1410951086?fields=friends.fields(likes.limit(5),name,picture.type(normal)),name
    FB.api('/' + uid + '?fields=friends.limit(40).fields(likes.limit(50),name,picture.type(normal)),name', function (result) {
      // console.log('response', result); //debug
      ygcbf.analyze(result);
    });
  });
};

// @notice ログインとログアウトメソッド
function updateButton(response) {
  console.log('Updating Button', response);
  var button = document.getElementById('fb-auth');

  if (response.status === 'connected') {
    uid = response.authResponse.userID;
    button.innerHTML = 'Logout';
    button.className = 'btn btn-danger';
    button.onclick = function () {
      FB.logout(function (response) {
        console.log('FB.logout callback', response);
      });
    };
  } else {
    button.innerHTML = 'Login';
    button.className = 'btn btn-success';
    button.onclick = function () {
      FB.login(function (response) {
        console.log('FB.login callback', response);
        if (response.status === 'connected') {
          console.log('User is logged in');
        } else {
          console.log('User is logged out');
        }
      }, {
        scope: 'friends_likes'
      });
    };
  }
}
