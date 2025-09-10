import Foundation

class BackendTest {
    static let shared = BackendTest()
    private let baseURL = "https://server-1-ewdd.onrender.com/api"
    
    // Тест базового подключения к серверу
    func testBasicConnection() async -> (Bool, String) {
        Logger.shared.log("Тестируем базовое подключение к серверу", level: .info, category: "BackendTest")
        
        do {
            let url = URL(string: baseURL)!
            var request = URLRequest(url: url)
            request.timeoutInterval = 10
            
            Logger.shared.log("Отправляем GET запрос на: \(url.absoluteString)", level: .debug, category: "BackendTest")
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                Logger.shared.log("Получен ответ: \(httpResponse.statusCode)", level: .info, category: "BackendTest")
                
                if let responseString = String(data: data, encoding: .utf8) {
                    Logger.shared.log("Тело ответа: \(responseString)", level: .debug, category: "BackendTest")
                }
                
                if httpResponse.statusCode < 500 {
                    return (true, "Сервер отвечает (код: \(httpResponse.statusCode))")
                } else {
                    return (false, "Ошибка сервера: \(httpResponse.statusCode)")
                }
            } else {
                return (false, "Неверный ответ сервера")
            }
        } catch {
            Logger.shared.log("Ошибка при тестировании подключения: \(error.localizedDescription)", level: .error, category: "BackendTest")
            return (false, "Ошибка подключения: \(error.localizedDescription)")
        }
    }
    
    // Тест endpoint'ов авторизации
    func testAuthEndpoints() async -> (Bool, String) {
        Logger.shared.log("Тестируем endpoint'ы авторизации", level: .info, category: "BackendTest")
        
        // Тест /auth/login
        let loginResult = await testLoginEndpoint()
        if !loginResult.0 {
            return loginResult
        }
        
        // Тест /auth/register
        let registerResult = await testRegisterEndpoint()
        if !registerResult.0 {
            return registerResult
        }
        
        return (true, "Все endpoint'ы авторизации работают")
    }
    
    private func testLoginEndpoint() async -> (Bool, String) {
        do {
            let url = URL(string: "\(baseURL)/auth/login")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.timeoutInterval = 10
            
            // Отправляем тестовые данные
            let testData = ["email": "test@test.com", "password": "test123"]
            request.httpBody = try JSONSerialization.data(withJSONObject: testData)
            
            Logger.shared.log("Тестируем /auth/login", level: .debug, category: "BackendTest")
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                Logger.shared.log("Login endpoint ответ: \(httpResponse.statusCode)", level: .info, category: "BackendTest")
                
                if let responseString = String(data: data, encoding: .utf8) {
                    Logger.shared.log("Login ответ: \(responseString)", level: .debug, category: "BackendTest")
                }
                
                // 401 - нормально, значит endpoint работает, но данные неверные
                if httpResponse.statusCode == 401 {
                    return (true, "Login endpoint работает (ожидаемый 401)")
                } else if httpResponse.statusCode == 500 {
                    return (false, "Login endpoint: Ошибка сервера (возможно, проблема с MongoDB)")
                } else if httpResponse.statusCode == 404 {
                    return (false, "Login endpoint не найден")
                } else {
                    return (true, "Login endpoint отвечает (код: \(httpResponse.statusCode))")
                }
            } else {
                return (false, "Login endpoint: Неверный ответ")
            }
        } catch {
            Logger.shared.log("Ошибка при тестировании login endpoint: \(error.localizedDescription)", level: .error, category: "BackendTest")
            return (false, "Login endpoint: \(error.localizedDescription)")
        }
    }
    
    private func testRegisterEndpoint() async -> (Bool, String) {
        do {
            let url = URL(string: "\(baseURL)/auth/register")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.timeoutInterval = 10
            
            // Отправляем тестовые данные
            let testData = ["username": "testuser", "email": "test@test.com", "password": "test123"]
            request.httpBody = try JSONSerialization.data(withJSONObject: testData)
            
            Logger.shared.log("Тестируем /auth/register", level: .debug, category: "BackendTest")
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                Logger.shared.log("Register endpoint ответ: \(httpResponse.statusCode)", level: .info, category: "BackendTest")
                
                if let responseString = String(data: data, encoding: .utf8) {
                    Logger.shared.log("Register ответ: \(responseString)", level: .debug, category: "BackendTest")
                }
                
                // 409 - нормально, значит endpoint работает, но пользователь уже существует
                if httpResponse.statusCode == 409 {
                    return (true, "Register endpoint работает (ожидаемый 409)")
                } else if httpResponse.statusCode == 500 {
                    return (false, "Register endpoint: Ошибка сервера (возможно, проблема с MongoDB)")
                } else if httpResponse.statusCode == 404 {
                    return (false, "Register endpoint не найден")
                } else {
                    return (true, "Register endpoint отвечает (код: \(httpResponse.statusCode))")
                }
            } else {
                return (false, "Register endpoint: Неверный ответ")
            }
        } catch {
            Logger.shared.log("Ошибка при тестировании register endpoint: \(error.localizedDescription)", level: .error, category: "BackendTest")
            return (false, "Register endpoint: \(error.localizedDescription)")
        }
    }
    
    // Полный тест backend
    func runFullTest() async -> String {
        Logger.shared.log("Запускаем полный тест backend", level: .info, category: "BackendTest")
        
        var results: [String] = []
        
        // Тест базового подключения
        let basicTest = await testBasicConnection()
        results.append("Базовое подключение: \(basicTest.0 ? "✅" : "❌") \(basicTest.1)")
        
        // Тест endpoint'ов
        let authTest = await testAuthEndpoints()
        results.append("Endpoint'ы авторизации: \(authTest.0 ? "✅" : "❌") \(authTest.1)")
        
        let summary = results.joined(separator: "\n")
        Logger.shared.log("Результаты теста:\n\(summary)", level: .info, category: "BackendTest")
        
        return summary
    }
}
