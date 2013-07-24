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
  return $.unique(cats);
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
// @return [Array] 解析しやすい形に整形されたデータセット
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

// @notice このコードが動けばOK
// @memo jQuery(function($){
$('#eval').click(function(){
  var clusters = new clustersjs.Clusters();

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
  var datasets = [];
  datasets = makeDataSets(json, names, cats);
  // console.log(datasets); //debug

});
