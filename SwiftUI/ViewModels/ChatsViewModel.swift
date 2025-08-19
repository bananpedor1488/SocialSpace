import Foundation
import SwiftUI

@MainActor
class ChatsViewModel: ObservableObject {
    @Published var chats: [Chat] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let networkManager = NetworkManager()
    
    func loadChats() async {
        guard !isLoading else { return }
        
        isLoading = true
        errorMessage = nil
        
        do {
            let response: [Chat] = try await networkManager.makeAuthenticatedRequest("/messages/chats")
            chats = response.sorted { chat1, chat2 in
                let date1 = chat1.lastMessage?.createdAt ?? chat1.createdAt
                let date2 = chat2.lastMessage?.createdAt ?? chat2.createdAt
                return date1 > date2
            }
        } catch {
            errorMessage = "Ошибка загрузки чатов"
            print("Error loading chats: \(error)")
        }
        
        isLoading = false
    }
    
    func createChat(with userId: String) async -> Chat? {
        do {
            let chatData = ["participantId": userId]
            let jsonData = try JSONSerialization.data(withJSONObject: chatData)
            
            let newChat: Chat = try await networkManager.makeAuthenticatedRequest("/messages/chats", method: "POST", body: jsonData)
            
            chats.insert(newChat, at: 0)
            return newChat
        } catch {
            errorMessage = "Ошибка создания чата"
            print("Error creating chat: \(error)")
            return nil
        }
    }
}

@MainActor
class MessagesViewModel: ObservableObject {
    @Published var messages: [Message] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let networkManager = NetworkManager()
    
    func loadMessages(chatId: String) async {
        guard !isLoading else { return }
        
        isLoading = true
        errorMessage = nil
        
        do {
            let response: [Message] = try await networkManager.makeAuthenticatedRequest("/messages/chats/\(chatId)/messages?page=1&limit=50")
            messages = response
            
            // Отмечаем сообщения как прочитанные
            await markAsRead(chatId: chatId)
        } catch {
            errorMessage = "Ошибка загрузки сообщений"
            print("Error loading messages: \(error)")
        }
        
        isLoading = false
    }
    
    func sendMessage(chatId: String, content: String) async {
        guard !content.isEmpty else { return }
        
        do {
            let messageData = ["content": content]
            let jsonData = try JSONSerialization.data(withJSONObject: messageData)
            
            let newMessage: Message = try await networkManager.makeAuthenticatedRequest("/messages/chats/\(chatId)/messages", method: "POST", body: jsonData)
            
            messages.append(newMessage)
        } catch {
            errorMessage = "Ошибка отправки сообщения"
            print("Error sending message: \(error)")
        }
    }
    
    private func markAsRead(chatId: String) async {
        do {
            let _: [String: String] = try await networkManager.makeAuthenticatedRequest("/messages/chats/\(chatId)/read", method: "PUT")
        } catch {
            print("Error marking messages as read: \(error)")
        }
    }
}
