import SwiftUI

struct DetailView: View {
    @EnvironmentObject var store: ItemStore
    @Environment(\.dismiss) var dismiss
    let itemID: UUID

    private var item: WishItem? {
        store.items.first { $0.id == itemID }
    }

    var body: some View {
        if let item {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text(item.name).font(.title2.bold())
                    Spacer()
                    Button { dismiss() } label: { Image(systemName: "xmark.circle.fill").font(.title3).foregroundColor(.secondary) }
                }
                .padding()

                Divider()

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        HStack(spacing: 16) {
                            info(label: "价格", value: item.priceLabel)
                            info(label: "需求真实度", value: "\(item.score) / 100")
                            info(label: "冷却期", value: "\(item.coolDays) 天")
                            info(label: "状态", value: item.statusText)
                        }

                        if item.status == .cooling {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("冷却进度").font(.subheadline.bold())
                                ProgressView(value: item.progress)
                                    .tint(item.isCooled ? .green : .orange)
                                Text(item.isCooled ? "冷却已结束，要不要剁你说了算" : "还剩 \(item.daysLeft) 天")
                                    .font(.caption).foregroundColor(.secondary)
                            }
                            .padding()
                            .background(Color.gray.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
                        }

                        if !item.note.isEmpty {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("当时的想法").font(.subheadline.bold())
                                Text(item.note).foregroundColor(.secondary)
                            }
                        }

                        Text("加入时间 \(item.addedAt.formatted(date: .abbreviated, time: .shortened))")
                            .font(.caption).foregroundColor(.secondary)
                    }
                    .padding()
                }

                Divider()

                HStack {
                    if item.status == .cooling || item.status == .ready {
                        Button("反剁（算了不买）") {
                            store.markDropped(item); dismiss()
                        }
                        .buttonStyle(.bordered)
                        .tint(.gray)
                    }

                    Spacer()

                    if item.canChop {
                        Button("剁了！") {
                            store.markBought(item); dismiss()
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    if item.status == .cooling || item.status == .ready || item.status == .dropped {
                        Button("再冻一次") {
                            store.resetCool(item); dismiss()
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .padding()
            }
            .frame(width: 460, height: 420)
        } else {
            Text("这条已经不在了").foregroundColor(.secondary)
                .frame(width: 460, height: 200)
        }
    }

    private func info(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption2).foregroundColor(.secondary)
            Text(value).font(.subheadline.bold())
        }
    }
}
