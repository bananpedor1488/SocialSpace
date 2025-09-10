import Foundation
import SwiftUI

// MARK: - API Constants
struct APIConstants {
    static let baseURL = "https://server-1-ewdd.onrender.com/api"
    
    struct Endpoints {
        // Auth
        static let login = "/auth/login"
        static let register = "/auth/register"
        static let refresh = "/auth/refresh"
        static let logout = "/auth/logout"
        static let me = "/me"
        
        // Posts
        static let posts = "/posts"
        static let post = "/posts/{id}"
        static let likePost = "/posts/{id}/like"
        static let repost = "/posts/{id}/repost"
        static let comments = "/posts/{id}/comments"
        static let comment = "/posts/{id}/comment"
        
        // Users
        static let users = "/users"
        static let user = "/users/{id}"
        static let userPosts = "/users/{id}/posts"
        static let searchUsers = "/users/search"
        static let suggestions = "/users/suggestions"
        
        // Follow
        static let follow = "/follow/{id}"
        
        // Messages
        static let chats = "/messages/chats"
        static let chat = "/messages/chats/{id}"
        static let messages = "/messages/chats/{id}/messages"
        static let message = "/messages/chats/{id}/messages"
        static let readMessages = "/messages/chats/{id}/read"
        static let unreadCount = "/messages/unread-count"
        
        // Points
        static let balance = "/points/balance"
        static let transactions = "/points/transactions"
        static let transfer = "/points/transfer"
        static let leaderboard = "/points/leaderboard"
        static let premiumInfo = "/points/premium-info"
        static let buyPremium = "/points/buy-premium"
        static let giftPremium = "/points/gift-premium"
        
        // Calls
        static let initiateCall = "/calls/initiate"
        static let acceptCall = "/calls/accept/{id}"
        static let declineCall = "/calls/decline/{id}"
        static let endCall = "/calls/end/{id}"
        static let activeCall = "/calls/active"
        static let cleanupCalls = "/calls/cleanup"
    }
}

// MARK: - UI Constants
struct UIConstants {
    static let cornerRadius: CGFloat = 12
    static let smallCornerRadius: CGFloat = 8
    static let largeCornerRadius: CGFloat = 16
    
    static let padding: CGFloat = 16
    static let smallPadding: CGFloat = 8
    static let largePadding: CGFloat = 24
    
    static let spacing: CGFloat = 12
    static let smallSpacing: CGFloat = 4
    static let largeSpacing: CGFloat = 20
    
    static let shadowRadius: CGFloat = 2
    static let shadowOpacity: Float = 0.1
    
    struct Sizes {
        static let avatarSmall: CGFloat = 30
        static let avatarMedium: CGFloat = 40
        static let avatarLarge: CGFloat = 50
        static let avatarXLarge: CGFloat = 100
        
        static let buttonHeight: CGFloat = 44
        static let textFieldHeight: CGFloat = 44
    }
    
    struct Animation {
        static let duration: Double = 0.3
        static let springDamping: Double = 0.8
        static let springVelocity: Double = 0.5
    }
}

// MARK: - Validation Constants
struct ValidationConstants {
    static let minUsernameLength = 3
    static let maxUsernameLength = 20
    static let minPasswordLength = 6
    static let maxPostLength = 280
    static let maxCommentLength = 500
    static let maxMessageLength = 1000
    
    static let usernameRegex = "^[a-zA-Z0-9_]{3,20}$"
    static let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
}

// MARK: - Storage Keys
struct StorageKeys {
    static let accessToken = "accessToken"
    static let refreshToken = "refreshToken"
    static let user = "user"
    static let theme = "theme"
    static let notifications = "notifications"
    static let lastSync = "lastSync"
    static let cacheExpiry = "cacheExpiry"
}

// MARK: - Notification Names
struct NotificationNames {
    static let userDidLogin = "userDidLogin"
    static let userDidLogout = "userDidLogout"
    static let newMessage = "newMessage"
    static let newPost = "newPost"
    static let networkStatusChanged = "networkStatusChanged"
    static let themeChanged = "themeChanged"
}

// MARK: - Error Messages
struct ErrorMessages {
    static let networkError = "Ошибка подключения к сети"
    static let serverError = "Ошибка сервера"
    static let authenticationError = "Ошибка авторизации"
    static let validationError = "Ошибка валидации данных"
    static let unknownError = "Неизвестная ошибка"
    
    static let invalidEmail = "Неверный формат email"
    static let invalidUsername = "Имя пользователя должно содержать 3-20 символов"
    static let invalidPassword = "Пароль должен содержать минимум 6 символов"
    static let passwordsDoNotMatch = "Пароли не совпадают"
    static let emptyFields = "Заполните все обязательные поля"
    
    static let postTooLong = "Пост слишком длинный"
    static let commentTooLong = "Комментарий слишком длинный"
    static let messageTooLong = "Сообщение слишком длинное"
}

// MARK: - Success Messages
struct SuccessMessages {
    static let loginSuccess = "Успешный вход"
    static let registerSuccess = "Регистрация завершена"
    static let postCreated = "Пост создан"
    static let commentAdded = "Комментарий добавлен"
    static let messageSent = "Сообщение отправлено"
    static let profileUpdated = "Профиль обновлен"
    static let settingsSaved = "Настройки сохранены"
}

// MARK: - App Info
struct AppInfo {
    static let name = "SocialSpace"
    static let version = "1.7.0"
    static let build = "1"
    static let bundleId = "com.socialspace.app"
    
    static let description = "Современная социальная сеть"
    static let developer = "SocialSpace Team"
    static let website = "https://socialspace.app"
    static let support = "support@socialspace.app"
}

// MARK: - Feature Flags
struct FeatureFlags {
    static let enableRealTime = true
    static let enablePushNotifications = true
    static let enableVoiceCalls = true
    static let enableVideoCalls = false
    static let enablePremium = true
    static let enablePoints = true
    static let enableLeaderboard = true
    static let enableDarkMode = true
    static let enableAnimations = true
}

// MARK: - Cache Settings
struct CacheSettings {
    static let postsCacheTime: TimeInterval = 300 // 5 minutes
    static let userCacheTime: TimeInterval = 3600 // 1 hour
    static let imagesCacheTime: TimeInterval = 86400 // 24 hours
    static let maxCacheSize: Int = 100 * 1024 * 1024 // 100 MB
}

// MARK: - Network Settings
struct NetworkSettings {
    static let timeout: TimeInterval = 30
    static let retryCount = 3
    static let retryDelay: TimeInterval = 2
    static let maxConcurrentRequests = 5
}
