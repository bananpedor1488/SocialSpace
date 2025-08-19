import SwiftUI

struct LogsView: View {
    @StateObject private var logger = Logger.shared
    @State private var selectedLevel: LogLevel? = nil
    @State private var showShareSheet = false
    
    var filteredLogs: [LogEntry] {
        if let selectedLevel = selectedLevel {
            return logger.logs.filter { $0.level == selectedLevel }
        }
        return logger.logs
    }
    
    var body: some View {
        NavigationView {
            VStack {
                // Фильтр по уровню логов
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        FilterButton(title: "Все", isSelected: selectedLevel == nil) {
                            selectedLevel = nil
                        }
                        
                        ForEach(LogLevel.allCases, id: \.self) { level in
                            FilterButton(
                                title: level.rawValue,
                                isSelected: selectedLevel == level,
                                color: level.color
                            ) {
                                selectedLevel = level
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)
                
                // Список логов
                List {
                    ForEach(filteredLogs.reversed()) { log in
                        LogRowView(log: log)
                    }
                }
                .listStyle(PlainListStyle())
            }
            .navigationTitle("Логи")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Очистить") {
                        logger.clearLogs()
                    }
                    .foregroundColor(.red)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Экспорт") {
                        showShareSheet = true
                    }
                }
            }
            .sheet(isPresented: $showShareSheet) {
                ShareSheet(activityItems: [logger.exportLogs()])
            }
        }
        .navigationViewStyle(StackNavigationViewStyle())
    }
}

struct FilterButton: View {
    let title: String
    let isSelected: Bool
    var color: Color = .blue
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? color : Color(.systemGray5))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(8)
        }
    }
}

struct LogRowView: View {
    let log: LogEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(log.formattedTimestamp)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(log.level.rawValue)
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundColor(log.level.color)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(log.level.color.opacity(0.1))
                    .cornerRadius(4)
            }
            
            Text("[\(log.category)]")
                .font(.caption2)
                .foregroundColor(.secondary)
            
            Text(log.message)
                .font(.caption)
                .foregroundColor(.primary)
                .multilineTextAlignment(.leading)
        }
        .padding(.vertical, 4)
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    LogsView()
}
