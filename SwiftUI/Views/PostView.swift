import SwiftUI

struct PostView: View {
    let post: Post
    let currentUser: User?
    @State private var showComments = false
    @StateObject private var postViewModel = PostViewModel()
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Заголовок поста
            HStack {
                AsyncImage(url: URL(string: post.author.avatar ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Image(systemName: "person.circle.fill")
                        .foregroundColor(.gray)
                }
                .frame(width: 40, height: 40)
                .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(post.author.displayNameOrUsername)
                            .font(.headline)
                        
                        if post.author.premium == true {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                                .font(.caption)
                        }
                    }
                    
                    Text("@\(post.author.username)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text(post.formattedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Контент поста
            Text(post.content)
                .font(.body)
                .multilineTextAlignment(.leading)
            
            // Действия с постом
            HStack(spacing: 20) {
                Button(action: {
                    Task {
                        await postViewModel.toggleLike(postId: post.id)
                    }
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: post.isLiked ? "heart.fill" : "heart")
                            .foregroundColor(post.isLiked ? .red : .primary)
                        Text("\(post.likes.count)")
                            .font(.caption)
                    }
                }
                .buttonStyle(.plain)
                
                Button(action: {
                    showComments.toggle()
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "message")
                        Text("\(post.commentsCount)")
                            .font(.caption)
                    }
                }
                .buttonStyle(.plain)
                
                Button(action: {
                    Task {
                        await postViewModel.repost(postId: post.id)
                    }
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.2.squarepath")
                        Text("Репост")
                            .font(.caption)
                    }
                }
                .buttonStyle(.plain)
                
                Spacer()
            }
            .foregroundColor(.secondary)
            
            // Комментарии
            if showComments {
                CommentsView(postId: post.id)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

// CommentsView и CommentView теперь находятся в отдельном файле CommentsView.swift

#Preview {
    PostView(post: Post(
        id: "1",
        content: "Тестовый пост",
        author: User(
            id: "1",
            username: "testuser",
            displayName: "Test User",
            email: "test@example.com",
            avatar: nil,
            premium: false,
            createdAt: "2024-01-01T00:00:00.000Z"
        ),
        likes: [],
        commentsCount: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        isRepost: false,
        originalPostId: nil,
        repostedById: nil
    ), currentUser: nil)
}
