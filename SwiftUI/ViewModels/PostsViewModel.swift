import Foundation
import SwiftUI

@MainActor
class PostsViewModel: ObservableObject {
    @Published var posts: [Post] = []
    @Published var isLoading = false
    @Published var hasMorePosts = true
    @Published var errorMessage: String?
    
    private let networkManager = NetworkManager()
    private var currentPage = 1
    private let postsPerPage = 10
    
    func loadPosts() async {
        guard !isLoading else { return }
        
        isLoading = true
        errorMessage = nil
        
        do {
            let response: [Post] = try await networkManager.makeAuthenticatedRequest("/posts?page=1&limit=\(postsPerPage)")
            posts = response
            currentPage = 1
            hasMorePosts = response.count == postsPerPage
        } catch {
            errorMessage = "Ошибка загрузки постов"
            print("Error loading posts: \(error)")
        }
        
        isLoading = false
    }
    
    func loadMorePosts() async {
        guard !isLoading && hasMorePosts else { return }
        
        isLoading = true
        
        do {
            let nextPage = currentPage + 1
            let response: [Post] = try await networkManager.makeAuthenticatedRequest("/posts?page=\(nextPage)&limit=\(postsPerPage)")
            
            posts.append(contentsOf: response)
            currentPage = nextPage
            hasMorePosts = response.count == postsPerPage
        } catch {
            errorMessage = "Ошибка загрузки постов"
            print("Error loading more posts: \(error)")
        }
        
        isLoading = false
    }
    
    func refreshPosts() async {
        await loadPosts()
    }
    
    func createPost(content: String) async {
        guard !content.isEmpty else { return }
        
        do {
            let postData = ["content": content]
            let jsonData = try JSONSerialization.data(withJSONObject: postData)
            
            let newPost: Post = try await networkManager.makeAuthenticatedRequest("/posts", method: "POST", body: jsonData)
            
            posts.insert(newPost, at: 0)
        } catch {
            errorMessage = "Ошибка создания поста"
            print("Error creating post: \(error)")
        }
    }
}

@MainActor
class PostViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let networkManager = NetworkManager()
    
    func toggleLike(postId: String) async {
        isLoading = true
        
        do {
            let _: [String: String] = try await networkManager.makeAuthenticatedRequest("/posts/\(postId)/like", method: "POST")
            // Обновление UI будет происходить через обновление постов
        } catch {
            errorMessage = "Ошибка лайка"
            print("Error toggling like: \(error)")
        }
        
        isLoading = false
    }
    
    func repost(postId: String) async {
        isLoading = true
        
        do {
            let _: [String: String] = try await networkManager.makeAuthenticatedRequest("/posts/\(postId)/repost", method: "POST")
            // Обновление UI будет происходить через обновление постов
        } catch {
            errorMessage = "Ошибка репоста"
            print("Error reposting: \(error)")
        }
        
        isLoading = false
    }
}

@MainActor
class CommentsViewModel: ObservableObject {
    @Published var comments: [Comment] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let networkManager = NetworkManager()
    
    func loadComments(postId: String) async {
        isLoading = true
        
        do {
            let response: [Comment] = try await networkManager.makeAuthenticatedRequest("/posts/\(postId)/comments")
            comments = response
        } catch {
            errorMessage = "Ошибка загрузки комментариев"
            print("Error loading comments: \(error)")
        }
        
        isLoading = false
    }
    
    func addComment(postId: String, content: String) async {
        guard !content.isEmpty else { return }
        
        do {
            let commentData = ["content": content]
            let jsonData = try JSONSerialization.data(withJSONObject: commentData)
            
            let newComment: Comment = try await networkManager.makeAuthenticatedRequest("/posts/\(postId)/comment", method: "POST", body: jsonData)
            
            comments.append(newComment)
        } catch {
            errorMessage = "Ошибка добавления комментария"
            print("Error adding comment: \(error)")
        }
    }
}
