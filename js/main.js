// @todo 全体的に無駄なループが多いのでリファクタリングしたい
// とりあえずfriend.likesの判定が多いので、最初にlikesがないユーザーのデータは除外するべき
// たぶんそれをやると、makeDataSets内のnameが同じだったら判定とかいらなくなる


// @arguments [_json] json形式で渡される友だちのlikesデータリスト
// @return [Array] カテゴリー名が入った1次元の配列
function getCats(_json) {
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
  return unique(cats);
}

// @arguments [_json] json形式で渡される友だちのlikesデータリスト
// @return [Array] 友だちの名前が入った1次元の配列
function getNames(_json) {
  var names = [];
  var friends = _json.friends.data;
  friends.forEach(function(friend){
    // @notice likesの長さが0ならスルー
    if (friend.likes) {
      names.push(friend.name);
    }
  });

  return names;
}

// @notice 解析しやすい形にデータセットを整形するために、初期化するメソッド
// @arguments [_json] json形式で渡される友だちのlikesデータリスト
// @return [Array] 初期化されたデータセット
function initDataSets(_names, _cats) {
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
}

// @arguments [_json] json形式で渡される友だちのlikesデータリスト
// @return [Array] 解析しやすい形に整形されたデータセット。
// データをいれたオブジェクトの配列で、nameに友だちの名前、dataにlikeしたカテゴリごとの数が入ってる
function makeDataSets(_json, _names, _cats) {
  var dsets = initDataSets(_names, _cats);
  var res = [];

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
}

// @arguments [_dsets] データをいれたオブジェクトの配列
// @return [Array] likeしたカテゴリごとの数を配列にして、全員分まとめて返す
function getData(_dsets, _cats) {
  var data = [], tdata = [];
  _dsets.forEach(function(u){
    tdata = [];
    _cats.forEach(function(cat){
      tdata.push(u.data[cat]);
    });
    data.push(tdata);
  });
  return data;
}

// @arguments [array] 重複した要素が入っている配列（入ってなくてもいいけど）
// @return [Array] 重複要素を削除した配列
function unique(array) {
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
}

// @notice このコードが動けばOK
// @memo jQuery(function($){
$('#eval').click(function(){
  // @notice データの取得
  // @todo アプリにする時はログインしているユーザーごとにfbのgraphAPIから取得する
  var json = JSON.parse($('#friends-data').val());

  // @notice 友だちのlikesデータリストから名前一覧を取得
  var names = [];
  names = getNames(json);
  // console.log(names); //debug

  // @notice 友だちのlikesデータリストからカテゴリ一覧を取得
  var cats = [];
  cats = getCats(json);
  // console.log(cats); //debug

  // @notice 解析用データセットの作成
  var dsets = [];
  dsets = makeDataSets(json, names, cats);
  // console.log(dsets); //debug

  // @notice データセットからdataを取り出す
  var data = [];
  data = getData(dsets, cats);
  // console.log(data); //debug

  // @notice name, cats, dataが揃ったのでこれでクラスタリングできる
  console.log('Run kclustering..');
  var clusters = new clustersjs.Clusters();
  var kclust = clusters.kcluster(data, undefined, 4);
  // console.log(kclust); //debug
  var i;
  kclust.forEach(function(clust, i){
    console.log('<クラスター' + i + '>');
    clust.forEach(function(userIndex){
      console.log(names[userIndex]);
    });
    console.log('');
  });

  // @todo これだけだとなんのクラスタか分からないので、クラスタごとに特徴のあるカテゴリを抽出する
});
