import Foundation
import SwiftUI

class Logger: ObservableObject {
    static let shared = Logger()
    
    @Published var logs: [LogEntry] = []
    
    func log(_ message: String, level: LogLevel = .info, category: String = "General") {
        let entry = LogEntry(
            timestamp: Date(),
            message: message,
            level: level,
            category: category
        )
        
        DispatchQueue.main.async {
            self.logs.append(entry)
            print("[\(entry.formattedTimestamp)] [\(level.rawValue.uppercased())] [\(category)] \(message)")
        }
    }
    
    func clearLogs() {
        logs.removeAll()
    }
    
    func exportLogs() -> String {
        return logs.map { $0.formattedString }.joined(separator: "\n")
    }
}

struct LogEntry: Identifiable {
    let id = UUID()
    let timestamp: Date
    let message: String
    let level: LogLevel
    let category: String
    
    var formattedTimestamp: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss.SSS"
        return formatter.string(from: timestamp)
    }
    
    var formattedString: String {
        return "[\(formattedTimestamp)] [\(level.rawValue.uppercased())] [\(category)] \(message)"
    }
}

enum LogLevel: String, CaseIterable {
    case debug = "DEBUG"
    case info = "INFO"
    case warning = "WARNING"
    case error = "ERROR"
    
    var color: Color {
        switch self {
        case .debug: return .gray
        case .info: return .blue
        case .warning: return .orange
        case .error: return .red
        }
    }
}
