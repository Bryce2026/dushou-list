import Foundation

/// 需求真伪判定：5 道题，每题 4 个选项
struct Question: Identifiable {
    let id = UUID()
    let title: String          // 题干
    let hint: String           // 提示语（帮助诚实作答）
    let options: [Option]
}

struct Option: Identifiable {
    let id = UUID()
    let text: String
    let value: Int             // 分值（越高越"真"）
}

/// 评分 + 冷却天数算法
enum ShopQuiz {
    /// 满分 100。规则：核心题权重高，附加题权重低
    static let questions: [Question] = [
        Question(
            title: "不买它，我的生活/工作会真的出事吗？",
            hint: "不是"不方便"，而是"有实际损失"",
            options: [
                Option(text: "会，有明确损失或耽误事", value: 20),
                Option(text: "会有点麻烦，但能绕过去", value: 12),
                Option(text: "只是没那么爽", value: 5),
                Option(text: "其实没区别", value: 0),
            ]
        ),
        Question(
            title: "我现在手里的东西，有没有能替代它的？",
            hint: "手机、旧设备、免费 App、借来的……",
            options: [
                Option(text: "完全没替代，真的空白", value: 20),
                Option(text: "有但不太顺手", value: 12),
                Option(text: "功能高度重叠", value: 5),
                Option(text: "就是想换个新的", value: 0),
            ]
        ),
        Question(
            title: "未来 3 个月，我大概会多频繁用它？",
            hint: "按"每周实际使用"估，不是"想用"",
            options: [
                Option(text: "每周 3 次以上", value: 20),
                Option(text: "每周 1-2 次", value: 13),
                Option(text: "偶尔想起来用一次", value: 6),
                Option(text: "买完拍张照就吃灰", value: 0),
            ]
        ),
        Question(
            title: "我现在能立刻说出它具体的使用场景吗？",
            hint: "要说得出"什么时候、在哪、干什么用"",
            options: [
                Option(text: "能，场景清晰具体", value: 15),
                Option(text: "大概能想到", value: 9),
                Option(text: "嗯……就是想买", value: 4),
                Option(text: "说不上来", value: 0),
            ]
        ),
        Question(
            title: "如果它涨价 30%，我还买吗？如果降一半，我会更想买吗？",
            hint: "测的是"需要"还是"占便宜的快感"",
            options: [
                Option(text: "涨价也买，降价也不会更冲动", value: 15),
                Option(text: "涨价会犹豫，降价也没更心动", value: 10),
                Option(text: "降价会明显更想买", value: 5),
                Option(text: "纯粹是凑促销/凑满减", value: 0),
            ]
        ),
    ]

    /// 算总分（0-100）+ 判定 + 冷却天数
    static func evaluate(answers: [Int]) -> (score: Int, verdict: String, coolDays: Int) {
        let q = questions
        var total = 0
        for (i, a) in answers.enumerated() where i < q.count {
            let opts = q[i].options
            if a >= 0, a < opts.count { total += opts[a].value }
        }

        let verdict: String
        let days: Int
        switch total {
        case 86...100:
            verdict = "真需求 · 但你还得等"
            days = 3      // 真需求也先睡一觉
        case 66..<86:
            verdict = "大概率是真的"
            days = 7
        case 46..<66:
            verdict = "存疑 · 先冻着"
            days = 14
        case 26..<46:
            verdict = "大概率伪需求"
            days = 21
        default:
            verdict = "纯冲动 · 建议反剁"
            days = 30
        }
        return (total, verdict, days)
    }
}
