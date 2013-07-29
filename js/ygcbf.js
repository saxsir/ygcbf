var ygcbf = {};

// @notice データ解析の際に呼び出されるメイン関数
ygcbf.analyze = function(_data) {
  // @notice ログインしているユーザー情報を取得
  var username = _data.name;
  var user_id = _data.id;

  // @notice likeのあるユーザーのみを抜き出す
  var friends = [];
  _data.friends.data.forEach(function(friend){
    if (friend.likes) {
      friends.push(friend);
    }
  });

  // @notice カテゴリ一覧を取得
  var cats = this.getCats(friends);
  // console.log('cats'); console.log(cats);

  // @notice 後で使いやすいように友だちのデータを整形しておく
  var friendData = this.getFriendData(friends, cats);
  console.log('friendData');console.log(friendData);

  // @notice 解析に利用するデータを友人データから取り出す
  // @notice likeは単純な数ではなくその人のlike全体に占める割合
  var names = [];
  var data = [];
  friendData.forEach(function(friend){
    names.push(friend.name);
    var likeData = [];
    cats.forEach(function(cat){
      likeData.push(friend.likes[cat] / friend.likesNum * 100);
    });
    data.push(likeData);
  });
  console.log('names');console.log(names);
  console.log('cats');console.log(cats);
  console.log('data');console.log(data);

  // @notice 解析する
  console.log('');
  console.log('Run kclustering..');
  var clusters = new clustersjs.Clusters();
  var k = friendData.length / 10;
  if (k < 2) { k = 2;}
  var kclust = clusters.kcluster(data, undefined, k);

  // @notice htmlに結果を表示してる
  $('#result').empty();
  kclust.forEach(function(clust, i){
    var wrap = $('<div>');
    var inner = $('<div>').attr('class', 'tagsinput');
    var h3 = $('<h3>').html ('クラスター' + i);
    var ul = $('<ul>');
    clust.forEach(function(userIndex){
      var li = $('<li>').attr('class', 'tag');

      var a = $('<a>').attr({
        //href : 'https://www.facebook.com/' + friendData[userIndex].uid,
        target : '_blank'
      }).on('click', function(){
        $('#myChart').remove();
        wrap.after($('<canvas>').attr({
          'id' : 'myChart',
          'width' : 1000,
          'height' : 600
        }));
        var ctx = document.getElementById("myChart").getContext("2d");
        var gdata = [];
        cats.forEach(function(cat){
          gdata.push(friendData[userIndex].likes[cat]);
        });
        var graph_data = {
          labels : cats,
          datasets : [{
            fillColor : "#3498DB",
            strokeColor : "#2980B9",
            pointColor : "rgba(151,187,205,1)",
            pointStrokeColor : "#fff",
            data : gdata
          }]
        };
        var myNewChart = new Chart(ctx).Bar(graph_data, {
          scaleOverlay : true
        });
        //var myNewChart = new Chart(ctx).Radar(graph_data, {});
        console.log(friendData[userIndex]);
      }).html(friendData[userIndex].name);

      var img = $('<img>').attr({
        style : 'margin-left: 10px;',
        src : friendData[userIndex].picture,
        alt : friendData[userIndex].name
      });

      a.append(img);
      li.append(a);
      ul.append(li);
    });
    var fcat = ygcbf.getFeatures(friendData, clust, cats);
    h3.append('（好きなジャンル: <span style="color:red;">' +  fcat + '</span>）');
    inner.append(ul);
    wrap.append(h3);
    wrap.append(inner);
    $('#result').append(wrap);
  });
};

// @notice 配列から重複した要素を取り除く関数
ygcbf.unique = function(_array) {
  var storage = {};
  var uniqueArray = [];
  var i, al, value;
  for (i=0, al = _array.length; i < al; i++) {
    value = _array[i];
    if (!(value in storage)) {
      storage[value] = true;
      uniqueArray.push(value);
    }
  }
  return uniqueArray;
};

// @notice 扱いやすいように整形した友人データを返す
ygcbf.getFriendData = function(_friends, _cats) {
  var self = this, friendData = [];
  // console.log(cats);
  _friends.forEach(function(friend){
    var likes = {};

    //@notice 各友人のlikesのデータを取得
    _cats.forEach(function(cat){
      likes[cat] = 0;
    });
    friend.likes.data.forEach(function(like){
      likes[like.category] = likes[like.category] + 1;
    });
    // console.log(likes);

    var likesNum = 0;
    _cats.forEach(function(cat){
      likesNum += likes[cat];
    });

    var user = new self.UserData({
      'name' : friend.name,
      'uid' : friend.id,
      'gender' : friend.gender,
      'picture' : friend.picture.data.url,
      'likes' : likes,
      'likesNum' : likesNum
    });
    friendData.push(user);
  });
  return friendData;
};

//@notice ユーザーオブジェクト(友だちデータを管理する)の雛型
ygcbf.UserData = function(data) {
  this.name = data.name;
  this.uid = data.uid;
  this.gender = data.gender;
  this.picture = data.picture;
  this.likes = data.likes;
  this.likesNum = data.likesNum;
};

// @notice likesに出現するカテゴリーの一覧を返す
ygcbf.getCats = function(_friends) {
  var cats = [];
  _friends.forEach(function(friend){
    friend.likes.data.forEach(function(like){
      cats.push(like.category);
    });
  });

  // @notice 重複削除してリターン
  return this.unique(cats);
};

// @notice getFeatureを書きなおしてみた
ygcbf.getFeatures = function(_friendData, _clust, _cats) {
  var clustDsets = {};
  // @notice 全カテゴリの数を0で初期化
  _cats.forEach(function(cat){
    clustDsets[cat] = 0;
  });

  _clust.forEach(function(userIndex){
    _cats.forEach(function(cat){
      clustDsets[cat]+= _friendData[userIndex].likes[cat];
    });
  });
  console.log(clustDsets);

  var maxCatIndex = 0, maxCat = 0;
  _cats.forEach(function(cat, index){
    if (maxCat < clustDsets[cat]) {
      maxCat = clustDsets[cat];
      maxCatIndex = index;
    }
  });

  /*
        wrap.after($('<canvas>').attr({
          'id' : 'myChart',
          'width' : 1000,
          'height' : 600
        }));
        var ctx = document.getElementById("myChart").getContext("2d");
        var gdata = [];
        cats.forEach(function(cat){
          gdata.push(friendData[userIndex].likes[cat]);
        });
        var graph_data = {
          labels : cats,
          datasets : [{
            fillColor : "#3498DB",
            strokeColor : "#2980B9",
            pointColor : "rgba(151,187,205,1)",
            pointStrokeColor : "#fff",
            data : gdata
          }]
        };
        var myNewChart = new Chart(ctx).Bar(graph_data, {});
        //var myNewChart = new Chart(ctx).Radar(graph_data, {});
        console.log(friendData[userIndex]);
*/
  //console.log(maxCat);
  //console.log(maxCatIndex);
  return _cats[maxCatIndex];
};
