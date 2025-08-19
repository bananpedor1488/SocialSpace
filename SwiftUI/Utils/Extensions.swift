import SwiftUI
import Foundation

// MARK: - Color Extensions
extension Color {
    static let customBackground = Color(.systemBackground)
    static let customSecondaryBackground = Color(.secondarySystemBackground)
    static let customLabel = Color(.label)
    static let customSecondaryLabel = Color(.secondaryLabel)
    
    static let socialBlue = Color(red: 0.4, green: 0.6, blue: 0.9)
    static let socialPurple = Color(red: 0.5, green: 0.3, blue: 0.7)
    static let socialOrange = Color(red: 1.0, green: 0.6, blue: 0.0)
}

// MARK: - View Extensions
extension View {
    func cardStyle() -> some View {
        self
            .background(Color.customBackground)
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
    }
    
    func primaryButtonStyle() -> some View {
        self
            .foregroundColor(.white)
            .padding()
            .background(Color.socialBlue)
            .cornerRadius(10)
    }
    
    func secondaryButtonStyle() -> some View {
        self
            .foregroundColor(.socialBlue)
            .padding()
            .background(Color.socialBlue.opacity(0.1))
            .cornerRadius(10)
    }
    
    func errorStyle() -> some View {
        self
            .foregroundColor(.red)
            .font(.caption)
    }
    
    func successStyle() -> some View {
        self
            .foregroundColor(.green)
            .font(.caption)
    }
}

// MARK: - String Extensions
extension String {
    var isValidEmail: Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format:"SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: self)
    }
    
    var isValidUsername: Bool {
        let usernameRegex = "^[a-zA-Z0-9_]{3,20}$"
        let usernamePredicate = NSPredicate(format:"SELF MATCHES %@", usernameRegex)
        return usernamePredicate.evaluate(with: self)
    }
    
    func truncate(to length: Int) -> String {
        if self.count <= length {
            return self
        }
        return String(self.prefix(length)) + "..."
    }
}

// MARK: - Date Extensions
extension Date {
    func timeAgoDisplay() -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        formatter.locale = Locale(identifier: "ru_RU")
        return formatter.localizedString(for: self, relativeTo: Date())
    }
    
    func formattedString() -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        formatter.locale = Locale(identifier: "ru_RU")
        return formatter.string(from: self)
    }
}

// MARK: - Bundle Extensions
extension Bundle {
    var appName: String {
        return infoDictionary?["CFBundleName"] as? String ?? "SocialSpace"
    }
    
    var appVersion: String {
        return infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    }
    
    var buildNumber: String {
        return infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }
}

// MARK: - UserDefaults Extensions
extension UserDefaults {
    static let shared = UserDefaults.standard
    
    enum Keys {
        static let accessToken = "accessToken"
        static let refreshToken = "refreshToken"
        static let user = "user"
        static let theme = "theme"
        static let notifications = "notifications"
    }
    
    var accessToken: String? {
        get { string(forKey: Keys.accessToken) }
        set { setValue(newValue, forKey: Keys.accessToken) }
    }
    
    var refreshToken: String? {
        get { string(forKey: Keys.refreshToken) }
        set { setValue(newValue, forKey: Keys.refreshToken) }
    }
    
    var user: Data? {
        get { data(forKey: Keys.user) }
        set { setValue(newValue, forKey: Keys.user) }
    }
    
    var theme: String {
        get { string(forKey: Keys.theme) ?? "system" }
        set { setValue(newValue, forKey: Keys.theme) }
    }
    
    var notificationsEnabled: Bool {
        get { bool(forKey: Keys.notifications) }
        set { setValue(newValue, forKey: Keys.notifications) }
    }
}

// MARK: - Network Extensions
extension URLRequest {
    mutating func setAuthHeader(_ token: String) {
        setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }
    
    mutating func setJSONContentType() {
        setValue("application/json", forHTTPHeaderField: "Content-Type")
    }
}

// MARK: - Error Extensions
extension Error {
    var localizedDescription: String {
        if let networkError = self as? NetworkError {
            switch networkError {
            case .invalidURL:
                return "Неверный URL"
            case .invalidResponse:
                return "Неверный ответ сервера"
            case .unauthorized:
                return "Необходима авторизация"
            case .serverError(let code):
                return "Ошибка сервера: \(code)"
            case .decodingError:
                return "Ошибка обработки данных"
            }
        }
        return (self as NSError).localizedDescription
    }
}

// MARK: - Custom Errors
enum AppError: Error, LocalizedError {
    case networkError(String)
    case validationError(String)
    case authenticationError(String)
    case unknownError
    
    var errorDescription: String? {
        switch self {
        case .networkError(let message):
            return "Ошибка сети: \(message)"
        case .validationError(let message):
            return "Ошибка валидации: \(message)"
        case .authenticationError(let message):
            return "Ошибка авторизации: \(message)"
        case .unknownError:
            return "Неизвестная ошибка"
        }
    }
}
