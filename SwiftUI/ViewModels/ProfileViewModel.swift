import Foundation
import SwiftUI

@MainActor
class ProfileViewModel: ObservableObject {
    @Published var posts: [Post] = []
    @Published var followersCount = 0
    @Published var followingCount = 0
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let networkManager = NetworkManager()
    
    func loadUserProfile(userId: String) async {
        guard !isLoading else { return }
        
        isLoading = true
        errorMessage = nil
        
        do {
            // Загружаем информацию о пользователе
            let userResponse: User = try await networkManager.makeAuthenticatedRequest("/users/\(userId)")
            
            // Загружаем посты пользователя
            let postsResponse: [Post] = try await networkManager.makeAuthenticatedRequest("/users/\(userId)/posts")
            
            posts = postsResponse.sorted { post1, post2 in
                return post1.createdAt > post2.createdAt
            }
            
            // Обновляем счетчики (это нужно будет получать из API)
            // followersCount = userResponse.followersCount ?? 0
            // followingCount = userResponse.followingCount ?? 0
            
        } catch {
            errorMessage = "Ошибка загрузки профиля"
            print("Error loading profile: \(error)")
        }
        
        isLoading = false
    }
    
    func followUser(userId: String) async {
        do {
            let _: [String: String] = try await networkManager.makeAuthenticatedRequest("/follow/\(userId)", method: "POST")
            // Обновляем счетчики
            followersCount += 1
        } catch {
            errorMessage = "Ошибка подписки"
            print("Error following user: \(error)")
        }
    }
    
    func unfollowUser(userId: String) async {
        do {
            let _: [String: String] = try await networkManager.makeAuthenticatedRequest("/follow/\(userId)", method: "DELETE")
            // Обновляем счетчики
            followersCount = max(0, followersCount - 1)
        } catch {
            errorMessage = "Ошибка отписки"
            print("Error unfollowing user: \(error)")
        }
    }
}
