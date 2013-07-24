/*!
 * Clusters.js v1.0
 * Rewrite for ygcbf. (Delete some functions)
 *
 * Copyright 2013 saxsir
 * Released under the MIT license
 *
 * Date: 2013-7-25
 */

//@notice clustersjsでカプセル化してる
var clustersjs = (function () {
  var Clusters = function () {};
  /*
   * 階層的クラスタリングを実行してくれる関数
   *
   */
  Clusters.prototype.hcluster = function (rows, distance) {
    // 距離の定義が指定されていなければとりあえずピアソンにしとく
    if (typeof distance === 'undefined') {
      distance = this.pearson;
    }

    var clust = [],
      self = this;
    // クラスタは最初は行たち
    rows.forEach(function (value, index) {
      clust.push(self.bicluster(value, null, null, 0.0, index));
    });

    // クラスタが1つになるまで繰り返す
    var distances = {}, currentClustId = -1;
    while (clust.length > 1) {
      var lowestPair = [0, 1];
      var closestDist = distance(clust[0].vec, clust[1].vec);

      // すべての組み合わせをチェックし、最も近い距離のペアを返す
      var length = clust.length;
      for (var i = 0; i < length; i++) {
        for (var j = i + 1; j < length; j++) {
          // 初登場の組み合わせなら距離を計算する
          if (![clust[i].id, clust[j].id] in distances) {
            // 配列をキーに距離を記憶しておく（こんな使い方でいいのかな...）
            // 二次元の配列にして、そこに距離の値を入れていけばいいのでは？初期値は-1とかにしておく。
            distances[[clust[i].id, clust[j].id]] = distance(clust[i].vec, clust[j].vec);
          }

          var d = distances[[clust[i].id, clust[j].id]];

          if (d < closestDist) {
            closestDist = d;
            lowestPair = [i, j];
          }
        }
      }

      // 2つのクラスタの平均を計算する
      var mergeVec = [];
      var length = clust[0].vec.length;
      for (var i = 0; i < length; i++) {
        mergeVec.push((clust[lowestPair[0]].vec[i] + clust[lowestPair[1]].vec[i]) / 2.0);
      }

      // 新たなクラスタをつくる
      var newCluster = this.bicluster(mergeVec, clust[lowestPair[0]], clust[lowestPair[1]], closestDist, currentClustId);

      // 元のセットではないクラスタのIDは負にする
      // デンドログラム描く時に区別したいので。
      currentClustId -= 1;
      clust.splice(0, 2);
      /* spliceとどっちがいいんだろう
    delete clust[lowestPair[1]];
    delete clust[lowestPair[0]];
    */
      clust.push(newCluster);
    }

    console.log('Finish hclustering.');
    return clust[0];
  };


  /*
   * 配列を2つ受け取り、ピアソン相関係数を返す
   */
  Clusters.prototype.pearson = function (v1, v2) {
    var sum1 = 0,
      sum2 = 0,
      sum1Sq = 0,
      sum2Sq = 0,
      pSum = 0;

    // v1とv2の長さは同じ（だとピアソンは信じてる）
    var len = v1.length;

    // for文を1回にまとめた
    for (var i = 0; i < len; i++) {
      // 単純な合計（parseFloatかIntしないと文字列の結合になる）
      // たぶんテキストから文字列でデータを読み込んでいるからだと思われる
      // JSONで書いてれば大丈夫だったのか...2時間くらいエラー探しましたよ....
      sum1 += parseFloat(v1[i]);
      sum2 += parseFloat(v2[i]);

      // 平方の合計
      sum1Sq += Math.pow(v1[i], 2);
      sum2Sq += Math.pow(v2[i], 2);

      // 積の合計
      pSum += v1[i] * v2[i];
    }

    // ピアソン相関スコアを算出する
    var num = pSum - (sum1 * sum2 / len);
    var den = Math.sqrt((sum1Sq - Math.pow(sum1, 2) / len) * (sum2Sq - Math.pow(sum2, 2) / len));

    if (den === 0) {
      return 0;
    }

    return 1.0 - num / den;
  };

  /*
   * 新しいクラスタオブジェクトを生成して返す関数
   */
  Clusters.prototype.bicluster = function (vec, left, right, distance, id) {
    var Cluster = {
      vec: vec,
      left: left,
      right: right,
      distance: distance,
      id: id
    };
    return Cluster;
  };

  /*
   * とりあえずランダムにアイテムを配置し、
   * 現在のすべてのアイテム間の距離を求め、目標値（データセットから求めた距離）との誤差を最小に近づけ各アイテムの位置の配列を返す関数
   * かなり無駄な繰り返しがあるけどまぁ読みやすさ優先でいっか(・∀・)
   */
  Clusters.prototype.scaleDown = function (data, distance, rate) {
    if (typeof distance === 'undefined') {
      distance = this.pearson;
    }
    if (typeof rate === 'undefined') {
      rate = 0.01;
    }

    var n = data.length;
    // アイテムのすべての組の実際の距離
    var realDist = [];
    for (var i = 0; i < n; i++) {
      realDist[i] = [];
      for (var j = 0; j < n; j++) {
        realDist[i][j] = distance(data[i], data[j]);
      }
    }
    //var outerSum = 0;

    // ２次元上にランダムに配置するように初期化する
    var loc = [],
      fakeDist = [];
    for (var i = 0; i < n; i++) {
      loc[i] = [Math.random(), Math.random()];
      fakeDist[i] = [];
      for (var j = 0; j < n; j++) {
        fakeDist[i][j] = 0;
      }
    }

    var lastError;
    for (var m = 0; m < 1000; m++) {
      // 予測距離を計る
      for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
          var sum = 0;
          for (var x = 0; x < 2; x++) {
            sum += Math.pow((loc[i][x] - loc[j][x]), 2);
          }
          fakeDist[i][j] = Math.sqrt(sum);
        }
      }

      // ポイントの移動
      var grad = [];
      for (var i = 0; i < n; i++) {
        grad[i] = [0, 0];
      }

      var totalError = 0;
      for (var k = 0; k < n; k++) {
        for (var j = 0; j < n; j++) {
          // 同じアイテム同士の比較はスキップ
          if (j === k) {
            continue;
          }
          // 誤差は距離の差の百分率
          var errorTerm = (fakeDist[j][k] - realDist[j][k]) / realDist[j][k];

          // 他のポイントへの誤差に比例してそれぞれのポイントを修正する必要がある
          grad[k][0] += ((loc[k][0] - loc[j][0]) / fakeDist[j][k]) * errorTerm;
          grad[k][1] += ((loc[k][1] - loc[j][1]) / fakeDist[j][k]) * errorTerm;

          // 誤差の合計を記録
          totalError += Math.abs(errorTerm);
        }
      }

      // console.log(totalError);

      // ポイントを移動することで誤差が悪化したら終了
      if (lastError && lastError < totalError) {
        console.log('totalError: ' + totalError);
        break;
      }
      lastError = totalError;

      // 学習率と傾斜を掛けあわせてそれぞれのポイントを移動
      for (var k = 0; k < n; k++) {
        loc[k][0] -= rate * grad[k][0];
        loc[k][1] -= rate * grad[k][1];
      }
    }
    console.log('Finish scale down.');
    return loc;
  };

  /*
   * 2次元のデータセットを引数に描画する関数
   */
  Clusters.prototype.draw2d = function (data, labels, id, w, h) {
    var width = w;
    var height = h;
    var ctx = this.initCanvas(id, width, height);

    var length = data.length;
    for (var i = 0; i < length; i++) {
      var x = (data[i][0] + 0.5) * width / 2;
      var y = (data[i][1] + 0.5) * height / 2;
      //console.log(x);
      //console.log(y);
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.fillText(labels[i], x - 5, y + 30); // テキストの表示位置は適当に調整
    }
    console.log('Finish draw2d.');
  };

  /*
   * Tanimoto係数を返す
   * 2つの配列を受け取り, どちらの配列にも存在するアイテムの割合を返す.
   */
  Clusters.prototype.tanimoto = function (v1, v2) {
    var i, l;
    var c1 = 0,
      c2 = 0,
      shr = 0;

    for (i = 0, l = v1.length; i < l; i++) {
      // v1に存在
      if (v1[i] !== 0) {
        c1 += 1;
      }

      // v2に存在
      if (v2[i] !== 0) {
        c2 += 1;
      }

      // 両者に存在
      if (v1[i] !== 0 && v2[i] !== 0) {
        shr += 1;
      }
    }

    return 1.0 - (parseFloat(shr) / (c1 + c2 - shr));
  };

  /*
   * k平均法
   */
  Clusters.prototype.kcluster = function (rows, distance, k) {
    var ranges, clusters, lastMatches, bestMatches, min, max, col, baryCenter, row, bestMatch, d, avgs, rowId;
    var i, j, l, m, n;
    var ilen, jlen, llen, mlen, nlen;

    if (typeof distance === 'undefined') {
      distance = this.pearson;
    }

    if (typeof k === 'undefined') {
      k = 4;
    }

    // それぞれのポイント（各単語）の最小値と最大値を決める
    ranges = [];
    for (i = 0, ilen = rows[0].length; i < ilen; i++) {
      col = [], min = 0.0, max = 0.0;
      for (j = 0, jlen = rows.length; j < jlen; j++) {
        col.push(rows[j][i]);
      }
      min = Math.min.apply(null, col);
      max = Math.max.apply(null, col);
      ranges.push([min, max]);
    }

    // 重心をランダムにk個配置する
    clusters = [];
    for (i = 0; i < k; i++) {
      baryCenter = [];
      for (j = 0, jlen = rows[0].length; j < jlen; j++) {
        baryCenter.push(Math.random() * (ranges[j][1] - ranges[j][0]) + ranges[j][0]);
      }
      clusters.push(baryCenter);
    }

    lastMatches = [];
    for (i = 0; i < 100; i++) {
      console.log('Iteration ' + i);
      bestMatches = [];
      for (j = 0; j < k; j++) {
        bestMatches[j] = [];
      }

      // それぞれの行に対して、もっとも近い重心を探し出す
      for (j = 0, jlen = rows.length; j < jlen; j++) {
        row = rows[j];
        bestMatch = 0;
        for (l = 0; l < k; l++) {
          d = distance(clusters[l], row);
          if (d < distance(clusters[bestMatch], row)) {
            bestMatch = l;
          }
        }
        bestMatches[bestMatch].push(j);
      }

      // 結果が前回と同じであれば完了
      if (bestMatches.toString() === lastMatches.toString()) {
        break;
      }

      lastMatches = bestMatches;

      // 重心をそのメンバーの平均に移動する
      for (j = 0; j < k; j++) {
        avgs = [];
        for (l = 0, llen = rows[0].length; l < llen; l++) {
          avgs.push(0.0);
        }

        if (bestMatches[j].length > 0) {
          for (m = 0, mlen = bestMatches[j].length; m < mlen; m++) {
            rowId = bestMatches[j][m];
            for (n = 0, nlen = rows[rowId].length; n < nlen; n++) {
              avgs[n] += rows[rowId][n];
            }
            for (n = 0, nlen = avgs.length; n < nlen; n++) {
              avgs[n] /= bestMatches[j].length;
            }
            clusters[j] = avgs;
          }
        }
      }
    }

    return bestMatches;
  };
  var res = {};
  res.Clusters = Clusters;
  return res;
})();



// @todo デンドログラムをcanvasに書けるようにする

/*
 * 与えられたクラスタの高さの合計を求める関数
 * そのクラスタが終端であれば1を返す再帰関数
 */
/*
Clusters.prototype.getHeight = function (clust) {
  // 終端であれば高さは1を返す
  if (clust.left === null && clust.right === null) {
    return 1;
  }

  return this.getHeight(clust.left) + this.getHeight(clust.right)
}
*/
/*
 * ルートノードへの距離の合計を求める関数
 */
/*
Clusters.prototype.getDepth = function (clust) {
  // 終端への距離は0.0
  if (clust.left === null && clust.right === null) {
    return 0;
  }

  // 枝の距離は二つの方向の大きい方にそれ自身の距離を足す
  return Math.max(this.getDepth(clust.left), this.getDepth(clust.right)) + clust.distance
}
*/

/*
 * デンドログラムを描画
 */
/*Clusters.prototype.drawDendrogram = function (clust, labels, id) {
  var canvas = document.getElementById(id);
  if (!canvas || !canvas.getContext) {
    alert('canvasに対応しているブラウザで開いてください');
    return false;
  }

  var height = this.getHeight(clust) * 20;
  var width = 900;

  var ctx = canvas.getContext('2d');
  ctx.height = height;
  ctx.width = width;
  ctx.clearRect(0, 0, ctx.width, ctx.height);

  // 最初のノードを描く
  var scaling = (width - 150) / this.getDepth(clust);
  this.drawNode(ctx, clust, 10, (height/2), scaling, labels);
}
*/

/*
 * 子ノードたちの高さを受け取り、それらがあるべき場所を計算し、それに対して１本の長い垂直な直線と2本の水平な直線を描画する関数
 */
/*
Clusters.prototype.drawNode = function(ctx, clust, x, y, scaling, labels) {
  console.log("x: " + x);
  console.log("y: " + y);
  if (clust.id < 0) {
    var h1 = this.getHeight(clust.left) * 20;
    var h2 = this.getHeight(clust.right) * 20;
    var top = y - (h1 +h2) / 2;
    var bottom = y + (h1 + h2) / 2;

    var lineLength = clust.distance*scaling;

    ctx.lineWidth = 2;
    ctx.strokeStyle="black";

    // クラスタから子への垂直な直線
    ctx.beginPath();
    ctx.moveTo(x, top+h1/h2);
    ctx.lineTo(x, bottom-h2/2);
    ctx.stroke();

    // 左側のアイテムへの水平な直線
    ctx.beginPath();
    ctx.moveTo(x, top+h1/h2);
    ctx.lineTo(x+lineLength, top+h1/h2);
    ctx.stroke();

    // 右側のアイテムへの水平な直線
    ctx.beginPath();
    ctx.moveTo(x, bottom-h2/2);
    ctx.lineTo(x+lineLength, bottom-h2/2);
    ctx.stroke();

    // 左右のノードたちを描く関数を呼び出す
    this.drawNode(ctx, clust.left, x+lineLength, top+h1/2, scaling, labels);
    this.drawNode(ctx, clust.right, x+lineLength, bottom-h2/2, scaling, labels);

  } else {
    // 終点であればアイテムのラベルを描く
    ctx.font = "14px 'ＭＳ Ｐゴシック'";
    ctx.fillStyle = "black";
    console.log(x);
    console.log(y);
    //ctx.fillText(labels[clust.id], x+5, y-7);
  }
 }
*/
