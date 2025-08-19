import Foundation

class NetworkTest {
    static let shared = NetworkTest()
    private let baseURL = "https://server-pqqy.onrender.com/api"
    
    func testConnection() async -> (Bool, String) {
        do {
            let url = URL(string: "\(baseURL)/auth/login")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.timeoutInterval = 10
            
            // Отправляем пустой запрос для проверки доступности сервера
            let testData = ["email": "test", "password": "test"]
            request.httpBody = try JSONSerialization.data(withJSONObject: testData)
            
            let (_, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                // Если получаем 401 - сервер работает, но данные неверные
                // Если получаем 400 - сервер работает, но запрос некорректный
                if httpResponse.statusCode == 401 || httpResponse.statusCode == 400 {
                    return (true, "Сервер доступен")
                } else if httpResponse.statusCode == 200 {
                    return (true, "Сервер работает")
                } else {
                    return (false, "Сервер вернул ошибку: \(httpResponse.statusCode)")
                }
            } else {
                return (false, "Неверный ответ сервера")
            }
        } catch {
            if let urlError = error as? URLError {
                switch urlError.code {
                case .notConnectedToInternet:
                    return (false, "Нет подключения к интернету")
                case .timedOut:
                    return (false, "Превышено время ожидания")
                case .cannotFindHost:
                    return (false, "Сервер недоступен")
                default:
                    return (false, "Ошибка подключения: \(urlError.localizedDescription)")
                }
            } else {
                return (false, "Ошибка: \(error.localizedDescription)")
            }
        }
    }
}
