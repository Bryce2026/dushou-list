import SwiftUI

struct QuizSheet: View {
    @EnvironmentObject var store: ItemStore
    @Environment(\.dismiss) var dismiss

    @State private var step: Step = .info
    @State private var name = ""
    @State private var price = ""
    @State private var note = ""
    @State private var answers: [Int] = Array(repeating: -1, count: ShopQuiz.questions.count)
    @State private var result: (score: Int, verdict: String, coolDays: Int)? = nil

    enum Step { case info, quiz, done }

    var body: some View {
        VStack(spacing: 0) {
            // 顶部步骤条
            HStack {
                Text(title).font(.title3.bold())
                Spacer()
                Button { dismiss() } label: { Image(systemName: "xmark.circle.fill").font(.title3).foregroundColor(.secondary) }
            }
            .padding()

            Divider()

            ScrollView {
                switch step {
                case .info: infoView
                case .quiz: quizView
                case .done: doneView
                }
            }

            Divider()

            // 底部按钮
            HStack {
                if step == .quiz {
                    Button("上一步") { step = .info }
                }
                Spacer()
                if step == .info {
                    Button("下一步：答 5 题") { if validInfo { step = .quiz } }
                        .buttonStyle(.borderedProminent)
                        .disabled(!validInfo)
                } else if step == .quiz {
                    Button("算一算") { calc() }
                        .buttonStyle(.borderedProminent)
                        .disabled(!allAnswered)
                } else if step == .done {
                    Button("关进去，开始冷却") { commit() }
                        .buttonStyle(.borderedProminent)
                }
            }
            .padding()
        }
        .frame(width: 520, height: 540)
    }

    // MARK: - 步骤 1：基本信息

    private var infoView: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("先记下它是什么").font(.headline)
            Text("别分析，先把念头存下来。").foregroundColor(.secondary)

            TextField("名称，比如：Sony A7C II", text: $name)
                .textFieldStyle(.roundedBorder)

            TextField("价格（元，可留空）", text: $price)
                .textFieldStyle(.roundedBorder)

            TextField("为什么想买（一句话，可留空）", text: $note)
                .textFieldStyle(.roundedBorder)

            Spacer()
        }
        .padding()
    }

    // MARK: - 步骤 2：答题

    @ViewBuilder
    private var quizView: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("5 道题，测它是真需求还是冲动").font(.headline)
            Text("诚实作答，骗得了算法骗不了自己。").foregroundColor(.secondary)

            ForEach(Array(ShopQuiz.questions.enumerated()), id: \.element.id) { idx, q in
                VStack(alignment: .leading, spacing: 8) {
                    Text("\(idx + 1). \(q.title)").font(.subheadline.bold())
                    Text(q.hint).font(.caption).foregroundColor(.secondary)
                    ForEach(q.options) { opt in
                        Button {
                            answers[idx] = q.options.firstIndex(where: { $0.id == opt.id }) ?? 0
                        } label: {
                            HStack {
                                Image(systemName: answers[idx] == (q.options.firstIndex(where: { $0.id == opt.id }) ?? -1) ? "largecircle.fill.circle" : "circle")
                                Text(opt.text)
                                Spacer()
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .padding(.vertical, 2)
                    }
                }
            }
            Spacer()
        }
        .padding()
    }

    // MARK: - 步骤 3：结果

    @ViewBuilder
    private var doneView: some View {
        if let r = result {
            VStack(spacing: 20) {
                Image(systemName: iconName(for: r.score))
                    .font(.system(size: 56))
                    .foregroundColor(color(for: r.score))
                Text("需求真实度 \(r.score) / 100").font(.title2.bold())
                Text(r.verdict).font(.headline).foregroundColor(color(for: r.score))

                VStack(spacing: 6) {
                    Text("冷却期 \(r.coolDays) 天")
                        .font(.title3.bold())
                    Text(r.coolDays == 3 ? "真需求也先睡一觉，明天再看" :
                         r.coolDays == 7 ? "一周后再来，大部分念头会自己消失" :
                         r.coolDays == 14 ? "存疑的先冻两周" :
                         r.coolDays == 21 ? "大概率用不上，冻它三周" :
                         "纯冲动，冷静一个月再说")
                        .foregroundColor(.secondary).multilineTextAlignment(.center)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.gray.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))

                Text("熬过冷却期还想要，那就剁。").foregroundColor(.secondary)
                Spacer()
            }
            .padding()
        }
    }

    // MARK: - 逻辑

    private var validInfo: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty }
    private var allAnswered: Bool { answers.allSatisfy { $0 >= 0 } }

    private func calc() {
        result = ShopQuiz.evaluate(answers: answers)
        step = .done
    }

    private func commit() {
        guard let r = result else { return }
        let item = WishItem(
            id: UUID(),
            name: name.trimmingCharacters(in: .whitespaces),
            price: Double(price).map { max(0, $0) } ?? 0,
            note: note,
            addedAt: Date(),
            coolDays: r.coolDays,
            score: r.score,
            status: .cooling
        )
        store.add(item)
        dismiss()
    }

    private var title: String {
        switch step {
        case .info: return "加一条"
        case .quiz: return "需求真伪判定"
        case .done: return "判定结果"
        }
    }

    private func color(for s: Int) -> Color {
        s >= 66 ? .green : s >= 46 ? .orange : .red
    }
    private func iconName(for s: Int) -> String {
        s >= 66 ? "checkmark.seal.fill" : s >= 46 ? "questionmark.circle.fill" : "xmark.octagon.fill"
    }
}
