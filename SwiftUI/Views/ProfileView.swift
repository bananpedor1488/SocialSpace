import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @StateObject private var profileViewModel = ProfileViewModel()
    @State private var showSettings = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Заголовок профиля
                    ProfileHeaderView(user: authManager.currentUser)
                    
                    // Статистика
                    ProfileStatsView(profileViewModel: profileViewModel)
                    
                    // Посты пользователя
                    ProfilePostsView(profileViewModel: profileViewModel)
                }
                .padding()
            }
            .navigationTitle("Профиль")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showSettings = true
                    }) {
                        Image(systemName: "gearshape.fill")
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
            .task {
                if let user = authManager.currentUser {
                    await profileViewModel.loadUserProfile(userId: user.id)
                }
            }
        }
        .navigationViewStyle(StackNavigationViewStyle()) // Принудительно используем StackNavigationViewStyle для iPad
    }
}

struct ProfileHeaderView: View {
    let user: User?
    
    var body: some View {
        VStack(spacing: 16) {
            AsyncImage(url: URL(string: user?.avatar ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Image(systemName: "person.circle.fill")
                    .foregroundColor(.gray)
            }
            .frame(width: 100, height: 100)
            .clipShape(Circle())
            
            VStack(spacing: 8) {
                HStack {
                    Text(user?.displayNameOrUsername ?? "")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    if user?.premium == true {
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                    }
                }
                
                Text("@\(user?.username ?? "")")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                if let email = user?.email {
                    Text(email)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct ProfileStatsView: View {
    @ObservedObject var profileViewModel: ProfileViewModel
    
    var body: some View {
        HStack(spacing: 20) {
            StatItemView(title: "Подписчики", value: "\(profileViewModel.followersCount)")
            StatItemView(title: "Подписки", value: "\(profileViewModel.followingCount)")
            StatItemView(title: "Посты", value: "\(profileViewModel.posts.count)")
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct StatItemView: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct ProfilePostsView: View {
    @ObservedObject var profileViewModel: ProfileViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Мои посты")
                .font(.headline)
            
            if profileViewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if profileViewModel.posts.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "doc.text")
                        .font(.system(size: 48))
                        .foregroundColor(.gray)
                    
                    Text("Постов пока нет")
                        .font(.headline)
                        .foregroundColor(.secondary)
                    
                    Text("Создайте свой первый пост!")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
            } else {
                LazyVStack(spacing: 12) {
                    ForEach(profileViewModel.posts) { post in
                        ProfilePostView(post: post)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.dismiss) var dismiss
    @State private var showLogs = false
    
    var body: some View {
        NavigationView {
            List {
                Section("Аккаунт") {
                    Button("Изменить профиль") {
                        // Редактирование профиля
                    }
                    
                    Button("Изменить пароль") {
                        // Изменение пароля
                    }
                }
                
                Section("Приложение") {
                    Button("О приложении") {
                        // Информация о приложении
                    }
                    
                    Button("Версия 1.7") {
                        // Версия приложения
                    }
                    
                    Button("Просмотр логов") {
                        showLogs = true
                    }
                    .foregroundColor(.blue)
                    
                    Button("Тест Backend") {
                        Task {
                            let result = await BackendTest.shared.runFullTest()
                            Logger.shared.log("Результат теста backend:\n\(result)", level: .info, category: "Settings")
                        }
                    }
                    .foregroundColor(.green)
                }
                
                Section {
                    Button("Выйти") {
                        authManager.logout()
                        dismiss()
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Настройки")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Готово") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showLogs) {
                LogsView()
            }
        }
        .navigationViewStyle(StackNavigationViewStyle()) // Принудительно используем StackNavigationViewStyle для iPad
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthManager())
}
