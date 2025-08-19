import SwiftUI

struct HomeView: View {
    @StateObject private var postsViewModel = PostsViewModel()
    @State private var newPostText = ""
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        NavigationView {
            VStack {
                // Создание поста
                VStack(spacing: 12) {
                    HStack {
                        Text("Что нового?")
                            .font(.headline)
                        Spacer()
                    }
                    
                    TextField("Поделитесь своими мыслями...", text: $newPostText, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(3...6)
                    
                    HStack {
                        Text("\(newPostText.count)/280")
                            .font(.caption)
                            .foregroundColor(newPostText.count > 250 ? .orange : .secondary)
                        
                        Spacer()
                        
                        Button("Опубликовать") {
                            Task {
                                await postsViewModel.createPost(content: newPostText)
                                newPostText = ""
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(newPostText.isEmpty || newPostText.count > 280 || postsViewModel.isLoading)
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(radius: 2)
                .padding(.horizontal)
                
                // Лента постов
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(postsViewModel.posts) { post in
                            PostView(post: post, currentUser: authManager.currentUser)
                        }
                        
                        if postsViewModel.hasMorePosts {
                            Button("Загрузить еще") {
                                Task {
                                    await postsViewModel.loadMorePosts()
                                }
                            }
                            .buttonStyle(.bordered)
                            .disabled(postsViewModel.isLoading)
                        }
                    }
                    .padding(.horizontal)
                }
            }
            .navigationTitle("SocialSpace")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await postsViewModel.refreshPosts()
            }
            .task {
                await postsViewModel.loadPosts()
            }
        }
        .navigationViewStyle(StackNavigationViewStyle()) // Принудительно используем StackNavigationViewStyle для iPad
    }
}

// PostView, CommentsView и CommentView теперь находятся в отдельном файле PostView.swift

#Preview {
    HomeView()
        .environmentObject(AuthManager())
}
