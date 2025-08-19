import Foundation
import SwiftUI

class NetworkManager: ObservableObject {
    @Published var isConnected = false
    @Published var connectionStatus = "Подключение..."
    
    private let baseURL = "https://server-pqqy.onrender.com/api"
    private let authManager: AuthManager
    
    init(authManager: AuthManager = AuthManager()) {
        self.authManager = authManager
        checkConnection()
    }
    
    private func checkConnection() {
        // Простая проверка подключения к серверу
        guard let url = URL(string: "\(baseURL)/health") else { 
            // Если нет endpoint /health, проверяем базовый URL
            guard let baseURL = URL(string: baseURL) else { return }
            
            URLSession.shared.dataTask(with: baseURL) { [weak self] _, response, error in
                DispatchQueue.main.async {
                    if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode < 500 {
                        self?.isConnected = true
                        self?.connectionStatus = "Подключено"
                    } else {
                        self?.isConnected = false
                        self?.connectionStatus = "Отключено"
                    }
                }
            }.resume()
            return
        }
        
        URLSession.shared.dataTask(with: url) { [weak self] _, response, error in
            DispatchQueue.main.async {
                if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                    self?.isConnected = true
                    self?.connectionStatus = "Подключено"
                } else {
                    self?.isConnected = false
                    self?.connectionStatus = "Отключено"
                }
            }
        }.resume()
    }
    
    func makeAuthenticatedRequest<T: Codable>(_ endpoint: String, method: String = "GET", body: Data? = nil) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw NetworkError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        
        if let token = authManager.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = body
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        if httpResponse.statusCode == 401 {
            // Токен истек, нужно обновить
            throw NetworkError.unauthorized
        }
        
        if httpResponse.statusCode >= 400 {
            throw NetworkError.serverError(httpResponse.statusCode)
        }
        
        return try JSONDecoder().decode(T.self, from: data)
    }
}

enum NetworkError: Error {
    case invalidURL
    case invalidResponse
    case unauthorized
    case serverError(Int)
    case decodingError
}
