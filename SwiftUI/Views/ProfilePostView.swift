import SwiftUI

struct ProfilePostView: View {
    let post: Post
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(post.content)
                .font(.body)
                .lineLimit(3)
            
            HStack {
                Text(post.formattedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                HStack(spacing: 16) {
                    HStack(spacing: 4) {
                        Image(systemName: "heart")
                            .font(.caption)
                        Text("\(post.likes.count)")
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                    
                    HStack(spacing: 4) {
                        Image(systemName: "message")
                            .font(.caption)
                        Text("\(post.commentsCount)")
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

#Preview {
    ProfilePostView(post: Post(
        id: "1",
        content: "Тестовый пост в профиле",
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
    ))
}
