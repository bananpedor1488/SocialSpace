import Foundation

struct Post: Codable, Identifiable {
    let id: String
    let content: String
    let author: User
    let likes: [String]
    let commentsCount: Int
    let createdAt: String
    let isRepost: Bool
    let originalPostId: String?
    let repostedById: String?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case content
        case author
        case likes
        case commentsCount
        case createdAt
        case isRepost
        case originalPostId
        case repostedById
    }
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        
        if let date = formatter.date(from: createdAt) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .short
            displayFormatter.locale = Locale(identifier: "ru_RU")
            return displayFormatter.string(from: date)
        }
        
        return createdAt
    }
    
    var isLiked: Bool {
        // Здесь нужно будет передавать текущего пользователя
        return false
    }
}

struct Comment: Codable, Identifiable {
    let id: String
    let content: String
    let author: User
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case content
        case author
        case createdAt
    }
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        
        if let date = formatter.date(from: createdAt) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .short
            displayFormatter.locale = Locale(identifier: "ru_RU")
            return displayFormatter.string(from: date)
        }
        
        return createdAt
    }
}
