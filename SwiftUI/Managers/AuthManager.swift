import Foundation
import SwiftUI

class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let baseURL = "https://server-pqqy.onrender.com/api"
    private let userDefaults = UserDefaults.standard
    
    init() {
        checkAuthStatus()
    }
    
    private func checkAuthStatus() {
        if let accessToken = userDefaults.string(forKey: "accessToken"),
           let userData = userDefaults.data(forKey: "user"),
           let user = try? JSONDecoder().decode(User.self, from: userData) {
            self.currentUser = user
            self.isAuthenticated = true
        }
    }
    
    func login(email: String, password: String) async {
        Logger.shared.log("Начинаем процесс входа для email: \(email)", level: .info, category: "Auth")
        
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        do {
            let request = AuthRequest(email: email, password: password)
            let url = URL(string: "\(baseURL)/auth/login")!
            
            Logger.shared.log("URL для входа: \(url.absoluteString)", level: .debug, category: "Auth")
            Logger.shared.log("Отправляем payload: \(String(data: try JSONEncoder().encode(request), encoding: .utf8) ?? "")", level: .debug, category: "Auth")
            
            var urlRequest = URLRequest(url: url)
            urlRequest.httpMethod = "POST"
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
            urlRequest.httpBody = try JSONEncoder().encode(request)
            urlRequest.timeoutInterval = 30
            
            Logger.shared.log("Отправляем запрос на вход...", level: .info, category: "Auth")
            
            let (data, response) = try await URLSession.shared.data(for: urlRequest)
            
            if let httpResponse = response as? HTTPURLResponse {
                Logger.shared.log("Получен HTTP ответ: \(httpResponse.statusCode)", level: .info, category: "Auth")
                
                // Логируем тело ответа
                if let responseString = String(data: data, encoding: .utf8) {
                    Logger.shared.log("Сырое тело ответа: \(responseString)", level: .debug, category: "Auth")
                    
                    // Попробуем распарсить как JSON для лучшего отображения
                    if let jsonData = responseString.data(using: .utf8),
                       let jsonObject = try? JSONSerialization.jsonObject(with: jsonData),
                       let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
                       let prettyString = String(data: prettyData, encoding: .utf8) {
                        Logger.shared.log("Форматированный JSON ответ:\n\(prettyString)", level: .debug, category: "Auth")
                    }
                }
                
                switch httpResponse.statusCode {
                case 200:
                    Logger.shared.log("Успешный вход! Пытаемся декодировать ответ...", level: .info, category: "Auth")
                    
                    // Сначала попробуем декодировать как AuthResponse
                    do {
                        let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
                        Logger.shared.log("Успешно декодирован AuthResponse", level: .info, category: "Auth")
                        
                        await MainActor.run {
                            self.currentUser = authResponse.user
                            self.isAuthenticated = true
                            self.isLoading = false
                            
                            // Сохраняем токены
                            self.userDefaults.set(authResponse.accessToken, forKey: "accessToken")
                            self.userDefaults.set(authResponse.refreshToken, forKey: "refreshToken")
                            self.userDefaults.set(try? JSONEncoder().encode(authResponse.user), forKey: "user")
                        }
                        
                        Logger.shared.log("Пользователь авторизован: \(authResponse.user.username)", level: .info, category: "Auth")
                    } catch {
                        Logger.shared.log("Ошибка декодирования AuthResponse: \(error)", level: .error, category: "Auth")
                        
                        // Попробуем декодировать как простой JSON и извлечь данные вручную
                        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                            Logger.shared.log("Пытаемся извлечь данные из JSON вручную", level: .info, category: "Auth")
                            
                            if let accessToken = json["accessToken"] as? String,
                               let refreshToken = json["refreshToken"] as? String,
                               let userDict = json["user"] as? [String: Any] {
                                
                                Logger.shared.log("Найдены токены и данные пользователя", level: .info, category: "Auth")
                                
                                // Создаем User вручную
                                let user = User(
                                    id: userDict["_id"] as? String ?? "",
                                    username: userDict["username"] as? String ?? "",
                                    displayName: userDict["displayName"] as? String,
                                    email: userDict["email"] as? String ?? "",
                                    avatar: userDict["avatar"] as? String,
                                    premium: userDict["premium"] as? Bool,
                                    createdAt: userDict["createdAt"] as? String
                                )
                                
                                await MainActor.run {
                                    self.currentUser = user
                                    self.isAuthenticated = true
                                    self.isLoading = false
                                    
                                    // Сохраняем токены
                                    self.userDefaults.set(accessToken, forKey: "accessToken")
                                    self.userDefaults.set(refreshToken, forKey: "refreshToken")
                                    self.userDefaults.set(try? JSONEncoder().encode(user), forKey: "user")
                                }
                                
                                Logger.shared.log("Пользователь авторизован вручную: \(user.username)", level: .info, category: "Auth")
                            } else {
                                Logger.shared.log("Не удалось извлечь необходимые данные из JSON", level: .error, category: "Auth")
                                await MainActor.run {
                                    self.errorMessage = "Неверный формат ответа сервера"
                                    self.isLoading = false
                                }
                            }
                        } else {
                            Logger.shared.log("Не удалось распарсить JSON ответ", level: .error, category: "Auth")
                            await MainActor.run {
                                self.errorMessage = "Неверный формат ответа сервера"
                                self.isLoading = false
                            }
                        }
                    }
                    
                case 400:
                    Logger.shared.log("Ошибка 400: Неверные данные", level: .error, category: "Auth")
                    await MainActor.run {
                        self.errorMessage = "Неверный email или пароль"
                        self.isLoading = false
                    }
                case 401:
                    Logger.shared.log("Ошибка 401: Неверные учетные данные", level: .error, category: "Auth")
                    await MainActor.run {
                        self.errorMessage = "Неверный email или пароль"
                        self.isLoading = false
                    }
                case 404:
                    Logger.shared.log("Ошибка 404: Endpoint не найден", level: .error, category: "Auth")
                    await MainActor.run {
                        self.errorMessage = "Сервер недоступен"
                        self.isLoading = false
                    }
                case 500:
                    Logger.shared.log("Ошибка 500: Внутренняя ошибка сервера", level: .error, category: "Auth")
                    await MainActor.run {
                        self.errorMessage = "Ошибка сервера. Попробуйте позже"
                        self.isLoading = false
                    }
                default:
                    Logger.shared.log("Неизвестная ошибка сервера: \(httpResponse.statusCode)", level: .error, category: "Auth")
                    await MainActor.run {
                        self.errorMessage = "Ошибка сервера: \(httpResponse.statusCode)"
                        self.isLoading = false
                    }
                }
            } else {
                Logger.shared.log("Неверный тип ответа", level: .error, category: "Auth")
                await MainActor.run {
                    self.errorMessage = "Неверный ответ сервера"
                    self.isLoading = false
                }
            }
        } catch {
            Logger.shared.log("Ошибка при входе: \(error.localizedDescription)", level: .error, category: "Auth")
            
            await MainActor.run {
                if let urlError = error as? URLError {
                    Logger.shared.log("URLError код: \(urlError.code.rawValue)", level: .error, category: "Auth")
                    
                    switch urlError.code {
                    case .notConnectedToInternet:
                        Logger.shared.log("Нет подключения к интернету", level: .error, category: "Auth")
                        self.errorMessage = "Проблема с соединением. Проверьте интернет"
                    case .timedOut:
                        Logger.shared.log("Превышено время ожидания", level: .error, category: "Auth")
                        self.errorMessage = "Превышено время ожидания"
                    case .cannotFindHost:
                        Logger.shared.log("Сервер недоступен", level: .error, category: "Auth")
                        self.errorMessage = "Сервер недоступен"
                    case .cannotConnectToHost:
                        Logger.shared.log("Невозможно подключиться к хосту", level: .error, category: "Auth")
                        self.errorMessage = "Не удается подключиться к серверу"
                    default:
                        Logger.shared.log("Другая ошибка URLError: \(urlError.localizedDescription)", level: .error, category: "Auth")
                        self.errorMessage = "Ошибка подключения: \(urlError.localizedDescription)"
                    }
                } else {
                    Logger.shared.log("Другая ошибка: \(error.localizedDescription)", level: .error, category: "Auth")
                    self.errorMessage = "Произошла ошибка"
                }
                self.isLoading = false
            }
        }
    }
    
    func register(username: String, email: String, password: String) async {
        Logger.shared.log("Начинаем процесс регистрации для пользователя: \(username), email: \(email)", level: .info, category: "Auth")
        
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        do {
            let request = RegisterRequest(username: username, email: email, password: password)
            let url = URL(string: "\(baseURL)/auth/register")!
            
            Logger.shared.log("URL для регистрации: \(url.absoluteString)", level: .debug, category: "Auth")
            
            var urlRequest = URLRequest(url: url)
            urlRequest.httpMethod = "POST"
            urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
            urlRequest.httpBody = try JSONEncoder().encode(request)
            
            Logger.shared.log("Отправляем запрос на регистрацию...", level: .info, category: "Auth")
            
            let (data, response) = try await URLSession.shared.data(for: urlRequest)
            
            if let httpResponse = response as? HTTPURLResponse {
                Logger.shared.log("Получен HTTP ответ при регистрации: \(httpResponse.statusCode)", level: .info, category: "Auth")
                
                // Логируем тело ответа
                if let responseString = String(data: data, encoding: .utf8) {
                    Logger.shared.log("Тело ответа при регистрации: \(responseString)", level: .debug, category: "Auth")
                }
                
                switch httpResponse.statusCode {
                case 201:
                    Logger.shared.log("Успешная регистрация!", level: .info, category: "Auth")
                    let authResponse = try JSONDecoder().decode(AuthResponse.self, from: data)
                    
                    await MainActor.run {
                        self.currentUser = authResponse.user
                        self.isAuthenticated = true
                        self.isLoading = false
                        
                        // Сохраняем токены
                        self.userDefaults.set(authResponse.accessToken, forKey: "accessToken")
                        self.userDefaults.set(authResponse.refreshToken, forKey: "refreshToken")
                        self.userDefaults.set(try? JSONEncoder().encode(authResponse.user), forKey: "user")
                    }
                    
                    Logger.shared.log("Пользователь зарегистрирован: \(authResponse.user.username)", level: .info, category: "Auth")
                    
                case 400:
                    Logger.shared.log("Ошибка 400: Неверные данные регистрации", level: .error, category: "Auth")
                    await MainActor.run {
                        self.errorMessage = "Неверные данные для регистрации"
                        self.isLoading = false
                    }
                case 409:
                    Logger.shared.log("Ошибка 409: Пользователь уже существует", level: .error, category: "Auth")
                    await MainActor.run {
                        self.errorMessage = "Пользователь с таким email уже существует"
                        self.isLoading = false
                    }
                case 500:
                    Logger.shared.log("Ошибка 500: Внутренняя ошибка сервера при регистрации", level: .error, category: "Auth")
                    await MainActor.run {
                        self.errorMessage = "Ошибка сервера. Попробуйте позже"
                        self.isLoading = false
                    }
                default:
                    Logger.shared.log("Неизвестная ошибка сервера при регистрации: \(httpResponse.statusCode)", level: .error, category: "Auth")
                    await MainActor.run {
                        self.errorMessage = "Ошибка сервера: \(httpResponse.statusCode)"
                        self.isLoading = false
                    }
                }
            } else {
                Logger.shared.log("Неверный тип ответа при регистрации", level: .error, category: "Auth")
                await MainActor.run {
                    self.errorMessage = "Неверный ответ сервера"
                    self.isLoading = false
                }
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "Ошибка подключения"
                self.isLoading = false
            }
        }
    }
    
    func logout() {
        userDefaults.removeObject(forKey: "accessToken")
        userDefaults.removeObject(forKey: "refreshToken")
        userDefaults.removeObject(forKey: "user")
        
        isAuthenticated = false
        currentUser = nil
    }
    
    func getAccessToken() -> String? {
        return userDefaults.string(forKey: "accessToken")
    }
}
