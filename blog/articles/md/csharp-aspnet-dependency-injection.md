---
title: "ASP.NET CoreのDI（Dependency Injection）入門"
emoji: "🐈"
type: "tech"
topics: []
published: false
---

# ASP.NET CoreのDI完全ガイド

## DIって何？
プログラムの部品と部品の結びつきを緩くして、テストや修正がしやすくするための仕組みです。ASP.NET Coreには標準で組み込まれています。

## DIのメリット
- テストが書きやすい
- コードの再利用が簡単
- 部品の差し替えが楽
- コードの見通しが良くなる
- バグが見つけやすい

## DIの使い方

### 1. サービスを登録する
まずは`Program.cs`でサービスを登録します：
```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IUserService, UserService>();
```

### 2. サービスの寿命を決める
サービスには3つの寿命があります：

#### Transient（毎回新しく作る）
```csharp
services.AddTransient<IMyService, MyService>();
```
- 使う場面：
  - 毎回新しいインスタンスが必要な時
  - メモリを気にする時
  - スレッドセーフにしたい時

#### Scoped（リクエストの間だけ使い回す）
```csharp
services.AddScoped<IMyService, MyService>();
```
- 使う場面：
  - データベース接続
  - リクエスト中だけ情報を保持したい時
  - 複数のクラスで同じ処理を共有したい時

#### Singleton（アプリ全体で1つだけ）
```csharp
services.AddSingleton<IMyService, MyService>();
```
- 使う場面：
  - アプリの設定情報
  - キャッシュ
  - 共有リソース

### 3. 実装例
ユーザー情報を扱うサービスの例：

```csharp
// インターフェース
public interface IUserService
{
    Task<User> GetUserAsync(int id);
    Task<IEnumerable<User>> GetAllUsersAsync();
    Task UpdateUserAsync(User user);
}

// 実装
public class UserService : IUserService
{
    private readonly IDbContext _dbContext;
    private readonly ILogger<UserService> _logger;
    
    public UserService(IDbContext dbContext, ILogger<UserService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }
    
    public async Task<User> GetUserAsync(int id)
    {
        _logger.LogInformation($"Getting user with ID: {id}");
        return await _dbContext.Users.FindAsync(id);
    }
    
    public async Task<IEnumerable<User>> GetAllUsersAsync()
    {
        return await _dbContext.Users.ToListAsync();
    }
    
    public async Task UpdateUserAsync(User user)
    {
        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync();
    }
}

// コントローラーで使う
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    
    public UserController(IUserService userService)
    {
        _userService = userService;
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetUser(int id)
    {
        var user = await _userService.GetUserAsync(id);
        if (user == null)
            return NotFound();
            
        return user;
    }
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetAllUsers()
    {
        return Ok(await _userService.GetAllUsersAsync());
    }
    
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, User user)
    {
        if (id != user.Id)
            return BadRequest();
            
        await _userService.UpdateUserAsync(user);
        return NoContent();
    }
}
```

### 4. よく使う組み込みサービス
ASP.NET Coreには便利な組み込みサービスがたくさんあります：

```csharp
// ログ
private readonly ILogger<MyClass> _logger;

// 設定
private readonly IConfiguration _config;

// キャッシュ
private readonly IMemoryCache _cache;

// HTTPクライアント
private readonly IHttpClientFactory _clientFactory;
```

## DIを上手く使うコツ

### 1. インターフェースを使う
- テストが楽になる
- モックが作りやすい
- 実装の切り替えが簡単

### 2. コンストラクタで受け取る
- 必要な部品が一目で分かる
- 初期化漏れを防げる
- テストコードが書きやすい

### 3. 寿命は用途に合わせて選ぶ
- メモリの使用量を考える
- パフォーマンスに注意
- スコープを意識する

### 4. DIのアンチパターン
避けるべき使い方：
- サービスロケーターを使う
- 静的クラスに依存する
- 具象クラスを直接注入する
- 寿命の長いクラスに寿命の短いクラスを注入する

## テストコードの例
DIを使うとテストが書きやすくなります：

```csharp
public class UserControllerTests
{
    [Fact]
    public async Task GetUser_ExistingId_ReturnsUser()
    {
        // Arrange
        var mockUserService = new Mock<IUserService>();
        var expectedUser = new User { Id = 1, Name = "Test User" };
        mockUserService
            .Setup(x => x.GetUserAsync(1))
            .ReturnsAsync(expectedUser);
            
        var controller = new UserController(mockUserService.Object);
        
        // Act
        var result = await controller.GetUser(1);
        
        // Assert
        var actionResult = Assert.IsType<ActionResult<User>>(result);
        var user = Assert.IsType<User>(actionResult.Value);
        Assert.Equal(expectedUser.Id, user.Id);
        Assert.Equal(expectedUser.Name, user.Name);
    }
}
```

## まとめ
- DIはASP.NET Coreの重要な機能
- テストしやすく、メンテナンスしやすいコードが書ける
- 寿命の管理が重要
- インターフェースを活用する
- テストコードが書きやすくなる

これでDIを使って、クリーンでメンテナンスしやすいコードが書けます！