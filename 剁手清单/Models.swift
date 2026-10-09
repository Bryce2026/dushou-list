import Foundation

/// 单条想买的东西
struct WishItem: Identifiable, Codable, Hashable {
    var id: UUID
    var name: String                  // 名称
    var price: Double                 // 价格（元）
    var note: String                  // 备注
    var addedAt: Date                 // 加入时间
    var coolDays: Int                 // 冷却天数（算法算出来的）
    var score: Int                    // 需求真实度得分（0-100）
    var status: Status                // 状态

    enum Status: String, Codable {
        case cooling  // 冷却中
        case ready    // 冷却结束，可剁
        case bought   // 已剁
        case dropped  // 反剁
    }

    /// 冷却到期日
    var coolUntil: Date { addedAt.addingDays(coolDays) }

    /// 是否已过冷却期
    var isCooled: Bool { Date() >= coolUntil }

    /// 剩余冷却天数（向下取整）
    var daysLeft: Int {
        let d = Calendar.current.dateComponents([.day], from: Date(), to: coolUntil).day ?? 0
        return max(0, d)
    }

    /// 冷却进度 0.0 - 1.0
    var progress: Double {
        guard coolDays > 0 else { return 1 }
        let total = TimeInterval(coolDays * 86400)
        let passed = Date().timeIntervalSince(addedAt)
        return min(1, max(0, passed / total))
    }

    /// 冷却结束或已标可剁，可以真下单
    var canChop: Bool {
        status == .ready || (status == .cooling && isCooled)
    }
}

extension Date {
    func addingDays(_ n: Int) -> Date {
        Calendar.current.date(byAdding: .day, value: n, to: self) ?? self
    }
}
