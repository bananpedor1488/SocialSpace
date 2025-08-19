import Foundation

struct Chat: Codable, Identifiable {
    let id: String
    let name: String
    let participants: [User]
    let lastMessage: Message?
    let unreadCount: Int
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name
        case participants
        case lastMessage
        case unreadCount
        case createdAt
    }
}

struct Message: Codable, Identifiable {
    let id: String
    let content: String
    let sender: User
    let createdAt: String
    let isRead: Bool
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case content
        case sender
        case createdAt
        case isRead
    }
    
    var formattedTime: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        
        if let date = formatter.date(from: createdAt) {
            let displayFormatter = DateFormatter()
            displayFormatter.timeStyle = .short
            displayFormatter.locale = Locale(identifier: "ru_RU")
            return displayFormatter.string(from: date)
        }
        
        return createdAt
    }
}
