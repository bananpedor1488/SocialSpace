import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        Group {
            if authManager.isAuthenticated {
                MainTabView()
            } else {
                AuthView()
            }
        }
        .task {
            // Автоматический тест backend при запуске
            Logger.shared.log("Приложение запущено, тестируем backend...", level: .info, category: "App")
            let result = await BackendTest.shared.runFullTest()
            Logger.shared.log("Автотест backend завершен", level: .info, category: "App")
        }
    }
}

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Главная")
                }
                .tag(0)
            
            MessagesView()
                .tabItem {
                    Image(systemName: "message.fill")
                    Text("Сообщения")
                }
                .tag(1)
            
            ProfileView()
                .tabItem {
                    Image(systemName: "person.fill")
                    Text("Профиль")
                }
                .tag(2)
        }
        .accentColor(.blue)
        .navigationViewStyle(StackNavigationViewStyle()) // Принудительно используем StackNavigationViewStyle для iPad
    }
}

struct AuthView: View {
    @State private var isLogin = true
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Логотип
                VStack {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.orange)
                    
                    Text("SocialSpace")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                }
                .padding(.top, 50)
                
                // Переключатель режимов
                Picker("Режим", selection: $isLogin) {
                    Text("Вход").tag(true)
                    Text("Регистрация").tag(false)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal)
                
                if isLogin {
                    LoginView()
                } else {
                    RegisterView()
                }
                
                Spacer()
            }
            .padding()
            .background(
                LinearGradient(
                    gradient: Gradient(colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
        }
        .navigationViewStyle(StackNavigationViewStyle()) // Принудительно используем StackNavigationViewStyle для iPad
    }
}

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        VStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Email")
                    .font(.headline)
                TextField("Введите email", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Пароль")
                    .font(.headline)
                SecureField("Введите пароль", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            
            if let errorMessage = authManager.errorMessage {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .font(.caption)
            }
            
            Button(action: {
                Task {
                    await authManager.login(email: email, password: password)
                }
            }) {
                HStack {
                    if authManager.isLoading {
                        ProgressView()
                            .scaleEffect(0.8)
                            .foregroundColor(.white)
                    } else {
                        Text("Войти")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .disabled(authManager.isLoading || email.isEmpty || password.isEmpty)
        }
        .padding()
    }
}

struct RegisterView: View {
    @State private var username = ""
    @State private var email = ""
    @State private var password = ""
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        VStack(spacing: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Имя пользователя")
                    .font(.headline)
                TextField("Введите имя пользователя", text: $username)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Email")
                    .font(.headline)
                TextField("Введите email", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Пароль")
                    .font(.headline)
                SecureField("Введите пароль", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            
            if let errorMessage = authManager.errorMessage {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .font(.caption)
            }
            
            Button(action: {
                Task {
                    await authManager.register(username: username, email: email, password: password)
                }
            }) {
                HStack {
                    if authManager.isLoading {
                        ProgressView()
                            .scaleEffect(0.8)
                            .foregroundColor(.white)
                    } else {
                        Text("Создать аккаунт")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.green)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .disabled(authManager.isLoading || username.isEmpty || email.isEmpty || password.isEmpty)
        }
        .padding()
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager())
        .environmentObject(NetworkManager())
}
