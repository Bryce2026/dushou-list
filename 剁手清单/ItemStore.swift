import Foundation
import SwiftUI

/// 本地 JSON 存储 + 状态流转
final class ItemStore: ObservableObject {
    @Published var items: [WishItem] = []

    private let fileURL: URL = {
        let fm = FileManager.default
        let docs = fm.urls(for: .documentDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        let dir = docs.appendingPathComponent("剁手清单", isDirectory: true)
        try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("data.json")
    }()

    init() { load(); refreshStatuses() }

    /// 冷却到期的条目自动变成「可剁」
    func refreshStatuses() {
        var changed = false
        for i in items.indices where items[i].status == .cooling && items[i].isCooled {
            items[i].status = .ready
            changed = true
        }
        if changed { save() }
    }

    func count(of status: WishItem.Status) -> Int {
        items.filter { $0.status == status }.count
    }

    // MARK: - CRUD

    func add(_ item: WishItem) {
        items.insert(item, at: 0)
        save()
    }

    func update(_ item: WishItem) {
        if let i = items.firstIndex(where: { $0.id == item.id }) {
            items[i] = item; save()
        }
    }

    func remove(_ item: WishItem) {
        items.removeAll { $0.id == item.id }; save()
    }

    /// 状态流转
    func markBought(_ item: WishItem) {
        var m = item; m.status = .bought; update(m)
    }
    func markDropped(_ item: WishItem) {
        var m = item; m.status = .dropped; update(m)
    }
    func resetCool(_ item: WishItem) {
        // 反悔想再冻一次：重置加入时间
        var m = item
        m.addedAt = Date()
        m.status = .cooling
        update(m)
    }

    // MARK: - 持久化

    private func save() {
        let enc = JSONEncoder(); enc.dateEncodingStrategy = .iso8601
        if let d = try? enc.encode(items) {
            try? d.write(to: fileURL)
        }
    }

    private func load() {
        let dec = JSONDecoder(); dec.dateDecodingStrategy = .iso8601
        if let d = try? Data(contentsOf: fileURL),
           let arr = try? dec.decode([WishItem].self, from: d) {
            items = arr
        }
    }
}
