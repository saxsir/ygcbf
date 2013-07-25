# お前ら、友だちになれると思うよ
hhlab2013年春学期 js#A班の作品。  
くだらなくてごめんなさい。

## なんのアプリ？
自分の友だちをクラスタリングして、**「お前ら、友だちになれると思うよ( ･´ｰ･｀)」**っていうためのアプリ。

## 使い方
1. [https://developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)にアクセス
2. AccessTokenとか取得して（friends_likesだけあればOK）
3. /自分のuid?fields=friends.fields(likes,name) にGETリクエストを投げる
4. 取得できたJSON形式のデータをコピーして
5. アプリページにアクセス(http://saxsir.github.io/ygcbf/)
6. アプリ内のテキストエリアに貼る
7. 「実行」ボタンを押す

## todo
- fb認証でアプリからデータもとれるようにする
- なんのクラスタかわからないのでクラスタごとの特徴を取得する
- k-meansを改良してx-meansにする
- オプションで階層的クラスタリングもできるようにする


## ライセンス
MIT
