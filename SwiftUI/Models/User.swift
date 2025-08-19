import Foundation

struct User: Codable, Identifiable {
    let id: String
    let username: String
    let displayName: String?
    let email: String
    let avatar: String?
    let premium: Bool?
    let createdAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case username
        case displayName
        case email
        case avatar
        case premium
        case createdAt
    }
    
    var displayNameOrUsername: String {
        return displayName ?? username
    }
}

struct AuthResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let user: User
}

struct AuthRequest: Codable {
    let email: String
    let password: String
}

struct RegisterRequest: Codable {
    let username: String
    let email: String
    let password: String
}
