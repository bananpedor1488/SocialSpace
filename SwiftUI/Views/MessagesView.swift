import SwiftUI

struct MessagesView: View {
    @StateObject private var chatsViewModel = ChatsViewModel()
    @State private var selectedChat: Chat?
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        NavigationView {
            VStack {
                if let selectedChat = selectedChat {
                    ChatDetailView(chat: selectedChat) {
                        self.selectedChat = nil
                    }
                } else {
                    ChatsListView(chatsViewModel: chatsViewModel) { chat in
                        self.selectedChat = chat
                    }
                }
            }
            .navigationTitle("Сообщения")
            .navigationBarTitleDisplayMode(.large)
            .task {
                await chatsViewModel.loadChats()
            }
        }
        .navigationViewStyle(StackNavigationViewStyle()) // Принудительно используем StackNavigationViewStyle для iPad
    }
}

struct ChatsListView: View {
    @ObservedObject var chatsViewModel: ChatsViewModel
    let onChatSelected: (Chat) -> Void
    
    var body: some View {
        List(chatsViewModel.chats) { chat in
            ChatRowView(chat: chat) {
                onChatSelected(chat)
            }
        }
        .refreshable {
            await chatsViewModel.loadChats()
        }
    }
}

struct ChatRowView: View {
    let chat: Chat
    let onTap: () -> Void
    @EnvironmentObject var authManager: AuthManager
    
    private var otherUser: User? {
        chat.participants.first { $0.id != authManager.currentUser?.id }
    }
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                AsyncImage(url: URL(string: otherUser?.avatar ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Image(systemName: "person.circle.fill")
                        .foregroundColor(.gray)
                }
                .frame(width: 50, height: 50)
                .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(chat.name)
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        if otherUser?.premium == true {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                                .font(.caption)
                        }
                        
                        Spacer()
                        
                        if chat.unreadCount > 0 {
                            Text("\(chat.unreadCount)")
                                .font(.caption)
                                .foregroundColor(.white)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.red)
                                .clipShape(Circle())
                        }
                    }
                    
                    if let lastMessage = chat.lastMessage {
                        Text("\(lastMessage.sender.username): \(lastMessage.content)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
    }
}

struct ChatDetailView: View {
    let chat: Chat
    let onBack: () -> Void
    @StateObject private var messagesViewModel = MessagesViewModel()
    @State private var newMessage = ""
    @EnvironmentObject var authManager: AuthManager
    
    private var otherUser: User? {
        chat.participants.first { $0.id != authManager.currentUser?.id }
    }
    
    var body: some View {
        VStack {
            // Заголовок чата
            HStack {
                Button(action: onBack) {
                    Image(systemName: "chevron.left")
                        .font(.title2)
                }
                
                AsyncImage(url: URL(string: otherUser?.avatar ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Image(systemName: "person.circle.fill")
                        .foregroundColor(.gray)
                }
                .frame(width: 40, height: 40)
                .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(chat.name)
                        .font(.headline)
                    
                    Text("онлайн")
                        .font(.caption)
                        .foregroundColor(.green)
                }
                
                Spacer()
                
                Button(action: {
                    // Звонок
                }) {
                    Image(systemName: "phone.fill")
                        .foregroundColor(.blue)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .shadow(radius: 1)
            
            // Сообщения
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(messagesViewModel.messages) { message in
                            MessageView(message: message, isOwn: message.sender.id == authManager.currentUser?.id)
                                .id(message.id)
                        }
                    }
                    .padding()
                }
                .onChange(of: messagesViewModel.messages.count) { _ in
                    if let lastMessage = messagesViewModel.messages.last {
                        withAnimation {
                            proxy.scrollTo(lastMessage.id, anchor: .bottom)
                        }
                    }
                }
            }
            
            // Поле ввода
            HStack {
                TextField("Сообщение...", text: $newMessage, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...4)
                
                Button(action: {
                    Task {
                        await messagesViewModel.sendMessage(chatId: chat.id, content: newMessage)
                        newMessage = ""
                    }
                }) {
                    Image(systemName: "paperplane.fill")
                        .foregroundColor(.blue)
                }
                .disabled(newMessage.isEmpty)
            }
            .padding()
            .background(Color(.systemBackground))
        }
        .task {
            await messagesViewModel.loadMessages(chatId: chat.id)
        }
    }
}

struct MessageView: View {
    let message: Message
    let isOwn: Bool
    
    var body: some View {
        HStack {
            if isOwn {
                Spacer()
            }
            
            VStack(alignment: isOwn ? .trailing : .leading, spacing: 4) {
                if !isOwn {
                    Text(message.sender.displayNameOrUsername)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Text(message.content)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(isOwn ? Color.blue : Color(.systemGray5))
                    .foregroundColor(isOwn ? .white : .primary)
                    .cornerRadius(16)
                
                Text(message.formattedTime)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            if !isOwn {
                Spacer()
            }
        }
    }
}

#Preview {
    MessagesView()
        .environmentObject(AuthManager())
}
