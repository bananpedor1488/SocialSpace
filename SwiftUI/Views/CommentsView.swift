import SwiftUI

struct CommentsView: View {
    let postId: String
    @StateObject private var commentsViewModel = CommentsViewModel()
    @State private var newComment = ""
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Комментарии")
                .font(.headline)
            
            ForEach(commentsViewModel.comments) { comment in
                CommentView(comment: comment)
            }
            
            HStack {
                TextField("Написать комментарий...", text: $newComment)
                    .textFieldStyle(.roundedBorder)
                
                Button("Отправить") {
                    Task {
                        await commentsViewModel.addComment(postId: postId, content: newComment)
                        newComment = ""
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(newComment.isEmpty)
            }
        }
        .task {
            await commentsViewModel.loadComments(postId: postId)
        }
    }
}

struct CommentView: View {
    let comment: Comment
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            AsyncImage(url: URL(string: comment.author.avatar ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Image(systemName: "person.circle.fill")
                    .foregroundColor(.gray)
            }
            .frame(width: 30, height: 30)
            .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(comment.author.displayNameOrUsername)
                        .font(.caption)
                        .fontWeight(.semibold)
                    
                    if comment.author.premium == true {
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                            .font(.caption2)
                    }
                    
                    Spacer()
                    
                    Text(comment.formattedDate)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                
                Text(comment.content)
                    .font(.caption)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    CommentsView(postId: "1")
}
