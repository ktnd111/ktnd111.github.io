---
title: "C# switch式の実践例"
emoji: "🌊"
type: "tech"
topics:
  - "csharp"
published: true
published_at: "2025-01-14 18:50"
---

この記事では`if`や`switch`による複雑になりがちな条件文をスッキリさせ、処理を書きやすく・読みやすいコードにするための要素**switch式**を紹介します。

switch式は、冗長になりがちなif文や従来のswitch文を置き換え、コードを簡潔かつ明快に記述するための手段です。また、パターンマッチングと組み合わせることで、条件分岐を柔軟に表現でき、読みやすさやメンテナンス性が向上します。

C# 8.0で導入されたswitch式（switch expression）は、従来のswitch文をより簡潔かつ表現力豊かにした新しい構文です。本記事では、Switch式の基本的な使い方から実践的な応用までを解説します。

## 従来のswitch文の課題

従来のswitch文では、以下のようなコードを書く必要がありました。
```csharp
string GetDayType(DayOfWeek day)
{
    switch (day)
    {
        case DayOfWeek.Saturday:
        case DayOfWeek.Sunday:
            return "Weekend";
        default:
            return "Weekday";
    }
}
```
このぐらいの量なら読みやすいですが、caseが多いパターン場合は繰り返しが多く、冗長になりがちです。

## switch式の基本構文

switch式を使うと、同じ処理をもっと簡潔に記述できます。
```csharp
string GetDayType(DayOfWeek day) =>
    day switch
    {
        DayOfWeek.Saturday or DayOfWeek.Sunday => "Weekend",
        _ => "Weekday"
    };
```
```csharp
Console.WriteLine(GetDayType(DayOfWeek.Saturday)); // 出力: Weekend
Console.WriteLine(GetDayType(DayOfWeek.Monday));   // 出力: Weekday
```
### ポイント

switchキーワードの後に式を書きます。

**=>（ラムダ演算子）の右側に戻り値を指定します。
デフォルトケースは_で記述します。**

## 実践例
### パターンマッチングとの組み合わせ
Switch式は、パターンマッチングと組み合わせて使用可能です。たとえば、以下のコードはオブジェクトの型に応じた処理を行います。
```csharp
string DescribeObject(object obj) =>
    obj switch
    {
        int i => $"整数: {i}",
        string s => $"文字列: {s}",
        null => "値はnull",
        _ => "その他"
    };
```

```csharp
Console.WriteLine(DescribeObject(42));         // 出力: 整数: 42
Console.WriteLine(DescribeObject("hello"));  // 出力: 文字列: hello
Console.WriteLine(DescribeObject(null));      // 出力: 値はnull
Console.WriteLine(DescribeObject(3.14));      // 出力: その他
```
### パターンマッチングのサンプル
1. 数値範囲によるパターンマッチング
   - 点数から成績への変換
   - 90点以上はA、80点以上はB、というように直感的な範囲判定
   - 基本的なタプルパターン

2. 気温と季節の組み合わせによる状態判定
    - シンプルな2要素の組み合わせ
    - 型によるパターンマッチング

3. 図形の種類による面積計算
    - 継承関係を活用した基本的な型パターン

上記は以下のように実装できます。
```csharp
using System;

class Program
{
    static void Main()
    {
        // 基本的な数値範囲の例
        Console.WriteLine("=== Score Grade Example ===");
        int[] scores = { 95, 85, 75, 65, 55 };
        foreach (var score in scores)
        {
            var grade = GetGrade(score);
            Console.WriteLine($"Score {score} => Grade {grade}");
        }

        // シンプルなタプルパターンの例
        Console.WriteLine("\n=== Temperature Check Example ===");
        CheckTemperature(35, "Summer");
        CheckTemperature(35, "Winter");
        CheckTemperature(15, "Winter");
        CheckTemperature(15, "Summer");

        // 基本的な型パターンの例
        Console.WriteLine("\n=== Shape Area Example ===");
        Shape[] shapes = { new Circle(5), new Rectangle(4, 6), new Square(4) };
        foreach (var shape in shapes)
        {
            var area = CalculateArea(shape);
            Console.WriteLine($"{shape.GetType().Name} Area: {area}");
        }
    }

    // シンプルな数値範囲パターン（成績判定）
    static string GetGrade(int score) => score switch
    {
        >= 90 => "A",
        >= 80 => "B",
        >= 70 => "C",
        >= 60 => "D",
        _ => "F"
    };

    // シンプルなタプルパターン（気温判定）
    static void CheckTemperature(int temp, string season)
    {
        var status = (temp, season) switch
        {
            ( >= 30, "Summer") => "通常の暑い日",
            ( >= 30, "Winter") => "異常な暖かさ",
            ( <= 20, "Winter") => "通常の寒い日",
            ( <= 20, "Summer") => "異常な寒さ",
            _ => "普通の気温"
        };
        Console.WriteLine($"Temperature: {temp}°C, Season: {season} => {status}");
    }

    // 基本的な型パターン（面積計算）
    static double CalculateArea(Shape shape) => shape switch
    {
        Circle c => Math.PI * c.Radius * c.Radius,
        Rectangle r => r.Width * r.Height,
        Square s => s.Side * s.Side,
        _ => 0
    };
}

// 図形の基底クラス
abstract class Shape { }

// 円クラス
class Circle : Shape
{
    public double Radius { get; }
    public Circle(double radius) => Radius = radius;
}

// 長方形クラス
class Rectangle : Shape
{
    public double Width { get; }
    public double Height { get; }
    public Rectangle(double width, double height)
    {
        Width = width;
        Height = height;
    }
}

// 正方形クラス
class Square : Shape
{
    public double Side { get; }
    public Square(double side) => Side = side;
}

```
`CheckGrade`,`CheckTemperature`,`CalculateArea`それぞれのメソッド内でswitch式を使用しています。
従来のswitchやif分でもボリュームはそれほど大きくなりませんが、追加や仕様変更などでマシマシになっていくとメンテナンスが難しくなっていきます。読みやすさ、書きやすさ、修正しやすさが整うのがswitch式の良い点だと思っています。（もちろんケースバイケースです）


## switch式を使うメリット

switch式を使うことで得られる主なメリットは次の通りです。

- コードの簡潔化: 冗長な記述を削減できます。
- 表現力の向上: パターンマッチングや型チェックと組み合わせることで柔軟な処理が可能です。
- 読みやすさ: 条件ごとの処理がひと目でわかりやすくなります。
- 修正しすさ： コード量を抑えられるため修正しやすくなります。

## switch式＋カスタムEnumの活用

以下はカスタムenumとswitch式を組み合わせた例です。
```csharp
enum TrafficLight
{
    Red,
    Yellow,
    Green
}

string GetAction(TrafficLight light) =>
    light switch
    {
        TrafficLight.Red => "Stop",
        TrafficLight.Yellow => "Caution",
        TrafficLight.Green => "Go",
        _ => throw new ArgumentOutOfRangeException(nameof(light), light, null)
    };
```

```csharp
Console.WriteLine(GetAction(TrafficLight.Red));    // 出力: Stop
Console.WriteLine(GetAction(TrafficLight.Yellow)); // 出力: Caution
Console.WriteLine(GetAction(TrafficLight.Green));  // 出力: Go
```

### 注意点
```message
網羅性の確認: switch式では、全てのケースを網羅するか、_でデフォルトケースを記述する必要があります。
```
```message alert
例外処理: 想定外の値を扱う場合は、明示的に例外をスローするコードを書きましょう。
```
## まとめ
C# 8.0のswitch式は、従来のswitch文をより簡潔に記述できる非常に便利な機能です。特に、パターンマッチングと組み合わせることで、複雑な条件分岐をシンプルに表現できます。今後のプロジェクトでぜひ活用してみてください！

## リファレンス
https://learn.microsoft.com/ja-jp/dotnet/csharp/language-reference/proposals/csharp-8.0/patterns#switch-expression

---
**IT業界に、ITエンジニアに貢献する企業**
ONE WEDGEはServerlessシステム開発を中核技術としてWeb系システム開発、AWS/GCPを利用した業務システム・サービス開発、PWAを用いたモバイル開発、Alexaスキル開発など、元気と技術力を武器にお客様に真摯に向き合う価値創造企業です。


https://onewedge.co.jp/