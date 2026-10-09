import AppKit
import SwiftUI

struct ContentView: View {
    @EnvironmentObject var store: ItemStore
    @State private var showingQuiz = false
    @State private var filter: WishItem.Status? = nil

    var body: some View {
        NavigationView {
            sidebar
            listArea
        }
        .navigationViewStyle(.columns)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { showingQuiz = true } label: {
                    Label("加一条", systemImage: "plus")
                }
                .keyboardShortcut("n", modifiers: .command)
            }
        }
        .sheet(isPresented: $showingQuiz) {
            QuizSheet()
                .environmentObject(store)
        }
        .onAppear { store.refreshStatuses() }
    }

    // MARK: 左侧栏

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("剁手清单").font(.title.bold())
            Text("想买但纠结的，都先关进来。").font(.caption).foregroundColor(.secondary)

            Divider()

            HStack(spacing: 10) {
                stat(status: .cooling, label: "冷却中", color: .orange)
                stat(status: .ready, label: "可剁", color: .green)
                stat(status: .bought, label: "已剁", color: .blue)
                stat(status: .dropped, label: "反剁", color: .gray)
            }

            if filter != nil {
                Button("看全部") { filter = nil }
                    .font(.caption)
            }

            Text("规则：加一条先答 5 题，算法算需求真实度 + 冷却天数。熬过冷却还想买，就剁。")
                .font(.caption2).foregroundColor(.secondary)

            Spacer()

            Button {
                NSApp.terminate(nil)
            } label: {
                Text("退出").frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
        }
        .padding()
        .frame(width: 220)
    }

    private func stat(status: WishItem.Status, label: String, color: Color) -> some View {
        let selected = filter == status
        return Button {
            filter = selected ? nil : status
        } label: {
            VStack {
                Text("\(store.count(of: status))").font(.title2.bold()).foregroundColor(color)
                Text(label).font(.caption2).foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 6)
            .background(selected ? color.opacity(0.15) : Color.clear, in: RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }

    // MARK: 右侧列表

    private var visibleItems: [WishItem] {
        guard let filter else { return store.items }
        return store.items.filter { $0.status == filter }
    }

    @ViewBuilder
    private var listArea: some View {
        if store.items.isEmpty {
            VStack(spacing: 16) {
                Image(systemName: "leaf").font(.system(size: 48)).foregroundColor(.green.opacity(0.6))
                Text("现在是零消费状态 ✨").font(.title3)
                Text("看到想买的，按 ⌘N 加进来。5 题算完，先进冷却期。")
                    .foregroundColor(.secondary)
            }.frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if visibleItems.isEmpty {
            Text("这一栏还是空的").foregroundColor(.secondary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            List {
                ForEach(visibleItems) { item in
                    Row(item: item)
                }
                .onDelete { idx in
                    idx.map { visibleItems[$0] }.forEach { store.remove($0) }
                }
            }
            .listStyle(.inset)
        }
    }
}

struct Row: View {
    @EnvironmentObject var store: ItemStore
    let item: WishItem
    @State private var showingDetail = false

    var body: some View {
        HStack(spacing: 12) {
            // 冷却进度环
            ZStack {
                Circle().stroke(Color.gray.opacity(0.25), lineWidth: 4)
                Circle().trim(from: 0, to: CGFloat(item.progress))
                    .stroke(item.status == .cooling ? Color.orange : Color.green, lineWidth: 4)
                    .rotationEffect(.degrees(-90))
                Text(item.status == .cooling ? "\(item.daysLeft)" : "✓")
                    .font(.caption.bold())
            }
            .frame(width: 42, height: 42)

            VStack(alignment: .leading, spacing: 3) {
                Text(item.name).font(.headline)
                HStack(spacing: 8) {
                    Text(item.priceLabel).font(.caption).foregroundColor(.secondary)
                    Text("·").foregroundColor(.secondary)
                    Text("真实度 \(item.score)").font(.caption)
                        .foregroundColor(item.score >= 66 ? .green : item.score >= 46 ? .orange : .red)
                    Text("·").foregroundColor(.secondary)
                    Text(item.status == .cooling ? "\(item.coolDays)天冷却 · 剩\(item.daysLeft)天" : item.statusText)
                        .font(.caption)
                        .foregroundColor(item.status == .cooling ? .orange : .secondary)
                }
                if !item.note.isEmpty {
                    Text(item.note).font(.caption2).foregroundColor(.secondary).lineLimit(1)
                }
            }

            Spacer()

            Menu {
                Button("查看详情") { showingDetail = true }
                if item.canChop {
                    Button("剁了") { store.markBought(item) }
                }
                if item.status == .cooling || item.status == .ready {
                    Button("反剁（放弃）", role: .destructive) { store.markDropped(item) }
                    Button("再冻一次") { store.resetCool(item) }
                }
                Button("删除", role: .destructive) { store.remove(item) }
            } label: {
                Image(systemName: "ellipsis.circle").foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
        .onTapGesture { showingDetail = true }
        .sheet(isPresented: $showingDetail) {
            DetailView(itemID: item.id).environmentObject(store)
        }
    }
}

extension WishItem {
    var priceLabel: String {
        price <= 0 ? "价格未填" : String(format: "¥%.0f", price)
    }
    var statusText: String {
        switch status {
        case .cooling: return "冷却中"
        case .ready: return "可剁"
        case .bought: return "已剁"
        case .dropped: return "已反剁"
        }
    }
}
