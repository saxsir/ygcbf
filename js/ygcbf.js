// @todo 全体的に無駄なループが多いのでリファクタリングしたい
// とりあえずfriend.likesの判定が多いので、最初にlikesがないユーザーのデータは除外するべき
// たぶんそれをやると、makeDataSets内のnameが同じだったら判定とかいらなくなる

var ygcbf = {};
// @arguments [_json] json形式で渡される友だちのlikesデータリスト
// @return [Array] カテゴリー名が入った1次元の配列
ygcbf.getCats = function(_json) {
  var cats = [];
  var friends = _json.friends.data;
  friends.forEach(function(friend){
    //@notice likesが0の場合はスルー
    if (friend.likes) {
      friend.likes.data.forEach(function(like){
        cats.push(like.category);
      });
    }
  });

 //@notice 重複しているものを削除してリターン
  return this.unique(cats);
};

// @arguments [_json] json形式で渡される友だちのlikesデータリスト
// @return [Array] 友だちの名前が入った1次元の配列
ygcbf.getUser = function(_json) {
  var users = [];
  var friends = _json.friends.data;
  friends.forEach(function(friend){
    // @notice likesの長さが0ならスルー
    if (friend.likes) {
      users.push({
        "uid" : friend.id,
        "name" : friend.name,
        "picture" : friend.picture.data.url
        });
    }
  });

  return users;
};

// @notice 解析しやすい形にデータセットを整形するために、初期化するメソッド
// @arguments [_json] json形式で渡される友だちのlikesデータリスト
// @return [Array] 初期化されたデータセット
ygcbf.initDatasets = function(_names, _cats) {
  var dsets = [];
  _names.forEach(function(name) {
    var data = {};
    _cats.forEach(function(cat){
      data[cat] = 0;
    });
    var user = {};
    user.name = name;
    user.data = data;
    dsets.push(user);
  });
  return dsets;
};

// @arguments [_json] json形式で渡される友だちのlikesデータリスト
// @return [Array] 解析しやすい形に整形されたデータセット。
// データをいれたオブジェクトの配列で、nameに友だちの名前、dataにlikeしたカテゴリごとの数が入ってる
ygcbf.makeDataSets = function(_json, _names, _cats) {
  var dsets = this.initDatasets(_names, _cats);

  var friends = _json.friends.data;
  friends.forEach(function(friend){
    // @notice もしlikesがあるユーザーであれば、dsetsの中から該当するユーザーを探して、そのユーザーに対して処理をする
    if (friend.likes) {
      // @notice forEachだとbreakできないらしい
      dsets.forEach(function(d){
        if (d.name === friend.name) {
          friend.likes.data.forEach(function(like){
            d.data[like.category] = d.data[like.category] + 1;
          });
        }
      });
    }
  });

  return dsets;
};

// @arguments [_dsets] データをいれたオブジェクトの配列
// @return [Array] likeしたカテゴリごとの数を配列にして、全員分まとめて返す
ygcbf.getData = function(_dsets, _cats) {
  var data = [], tdata = [];
  _dsets.forEach(function(u){
    tdata = [];
    _cats.forEach(function(cat){
      tdata.push(u.data[cat]);
    });
    data.push(tdata);
  });
  return data;
};

// @arguments [array] 重複した要素が入っている配列（入ってなくてもいいけど）
// @return [Array] 重複要素を削除した配列
ygcbf.unique = function(array) {
  var storage = {};
  var uniqueArray = [];
  var i, al, value;
  for ( i=0, al = array.length; i < al; i++) {
    value = array[i];
    if (!(value in storage)) {
      storage[value] = true;
      uniqueArray.push(value);
    }
  }
  return uniqueArray;
};

ygcbf.getClustData = function(_dsets, _cats) {
  var tdata = [];
  _dsets.forEach(function (u) {
    tdata = [];
    _cats.forEach(function (cat) {
      tdata.push(u.data[cat]);
    });
  });
  return tdata;
};

// @todo みんながたくさんlikeするカテゴリがあるので、カテゴリごとに重みをつけて計算してあげたい。
ygcbf.getFeatures = function(_json, clustMembers, _cats) {
  var clustDsets = this.initDatasets(clustMembers, _cats);
  var clustData = [];
  var clustSum = {};
  var clustMax = 0;
  var clustMaxCat = "";
  clustSum.name = "クラスターの合計値";
  clustSum.data = {};
  _cats.forEach(function (cat) {
    clustSum.data[cat] = 0;
  });
  var jsonf = _json.friends.data;
  jsonf.forEach(function (friend) {
    // @notice もしlikesがあるユーザーであれば、dsetsの中から該当するユーザーを探して、そのユーザーに対して処理をする
    if (friend.likes) {
      // @notice forEachだとbreakできないらしい
      clustDsets.forEach(function (cd) {
        if (cd.name === friend.name) {
          friend.likes.data.forEach(function (like) {
            clustSum.data[like.category] = clustSum.data[like.category] + 1;
          });
        }
      });
    }
  });
  clustData.push(clustSum);
  var clustd = ygcbf.getClustData(clustData, _cats);
  var index = 0;
  // 最大値とインデックスを取得
  for (var i = 0; i < clustd.length; i++) {
    if (clustd[i] > clustMax) {
      clustMax = clustd[i];
      index = i;
    }
  }
  clustMaxCat = _cats[index];
  return clustMaxCat;
};

// @notice このコードが動けばOK
// @memo jQuery(function($){
ygcbf.analyze = function(_json) {
  // @notice データの取得
  var json = _json;

  // @notice 友だちのlikesデータリストから名前一覧 & プロフ写真のURIを取得
  var users = [];
  users = this.getUser(json);
  // console.log(users); //debug

  var names = [];
  users.forEach(function(user){
    names.push(user.name);
  });

  // console.log(names); //debug

  // @notice 友だちのlikesデータリストからカテゴリ一覧を取得
  var cats = [];
  cats = this.getCats(json);
  // console.log(cats); //debug

  // @notice 解析用データセットの作成
  var dsets = [];
  dsets = this.makeDataSets(json, names, cats);
  // console.log(dsets); //debug

  // @notice データセットからdataを取り出す
  var data = [];
  data = this.getData(dsets, cats);
  // console.log(data); //debug

  // @notice name, cats, dataが揃ったのでこれでクラスタリングできる
  // @todo kの値を自動で適当にやりたい
  console.log('Run kclustering..');
  var clusters = new clustersjs.Clusters();
  var k = 4;
  var kclust = clusters.kcluster(data, undefined, k);
  // console.log(kclust); //debug

  // @notice コンソールに結果を出力
  // @notice 変数clustの中身はそのクラスタに属しているユーザーのインデックス番号
  // @todo これだけだとなんのクラスタか分からないので、クラスタごとに特徴のあるカテゴリを抽出して表示したい
  /*
  kclust.forEach(function(clust, i){
    console.log('<クラスター' + i + '>');
    clust.forEach(function(userIndex){
      console.log(users[userIndex].name);
      console.log(users[userIndex].picture); //debug
    });
    var fcat = ygcbf.getFeatures(json,clust, cats);
    console.log("人気のカテゴリー"+ fcat);
    console.log('');
  });
  */

  // @notice htmlに結果を表示してる
  kclust.forEach(function(clust, i){
    var wrap = $('<div>');
    var inner = $('<div>').attr('class', 'tagsinput');
    var h3 = $('<h3>').html ('クラスター' + i);
    var ul = $('<ul>');
    clust.forEach(function(userIndex){
      var li = $('<li>').attr('class', 'tag')
      .on('mouseover', function(){
        console.log('show image');
      }).on('mouseout', function(){
        console.log('hide image');
      });

      var a = $('<a>').attr({
        href : 'https://www.facebook.com/' + users[userIndex].uid,
        target : '_blank'
      }).html(users[userIndex].name);

      var img = $('<img>').attr({
        style : 'margin-left: 10px;',
        src : users[userIndex].picture,
        alt : users[userIndex].name
      });

      a.append(img);
      li.append(a);
      ul.append(li);
    });
    var fcat = ygcbf.getFeatures(json,clust, cats);
    h3.append('（好きなジャンル: <span style="color:red;">' +  fcat + '</span>）');
    inner.append(ul);
    wrap.append(h3);
    wrap.append(inner);
    $('#result').append(wrap);
  });
};
