import { useState, useMemo, useEffect } from "react";

const SUPABASE_URL = "https://vsofbpxeohmpcphkqhay.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y3trUjlChUNVSZqE5R7Vsw_KN_qU6gm";

const api = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.method === "POST" ? { Prefer: "return=representation" } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const CATEGORIES = ["세제/청소", "식품/간식", "음료/유제품", "위생/욕실", "주방용품", "기타"];
const formatDate = (d) => (d || "").replace(/-/g, ". ");
const calcUnit = (rec) => {
  const paid = rec.original_price - rec.coupon_discount - rec.point_benefit;
  return rec.quantity > 0 ? Math.round(paid / rec.quantity) : 0;
};
const formatWon = (n) => (n || 0).toLocaleString("ko-KR") + "원";

function Badge({ children, color }) {
  const colors = { green: "bg-emerald-100 text-emerald-700", amber: "bg-amber-100 text-amber-700", gray: "bg-stone-100 text-stone-500" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color] || colors.gray}`}>{children}</span>;
}

function RecordRow({ rec, isLatest, isBest, onDelete }) {
  const unitPrice = calcUnit(rec);
  const paid = rec.original_price - rec.coupon_discount - rec.point_benefit;
  return (
    <div className={`relative rounded-2xl border p-4 ${isLatest ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs text-stone-400">{formatDate(rec.date)}</p>
          <p className="font-bold text-stone-800 text-sm mt-0.5">{rec.store}</p>
          {rec.note && <p className="text-xs text-stone-400 mt-0.5">{rec.note}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          {isLatest && <Badge color="amber">최근</Badge>}
          {isBest && <Badge color="green">최저단가</Badge>}
          <button onClick={() => onDelete(rec.id)} className="text-stone-300 hover:text-rose-400 text-xs mt-1">삭제</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-stone-50 rounded-xl p-2"><p className="text-[10px] text-stone-400 mb-0.5">원가</p><p className="text-sm font-semibold text-stone-700">{formatWon(rec.original_price)}</p></div>
        <div className="bg-stone-50 rounded-xl p-2"><p className="text-[10px] text-stone-400 mb-0.5">실결제</p><p className="text-sm font-bold text-rose-600">{formatWon(paid)}</p></div>
        <div className="bg-stone-50 rounded-xl p-2"><p className="text-[10px] text-stone-400 mb-0.5">쿠폰할인</p><p className="text-sm font-semibold text-emerald-600">{rec.coupon_discount > 0 ? "-" + formatWon(rec.coupon_discount) : "없음"}</p></div>
        <div className="bg-stone-50 rounded-xl p-2"><p className="text-[10px] text-stone-400 mb-0.5">포인트</p><p className="text-sm font-semibold text-sky-600">{rec.point_benefit > 0 ? formatWon(rec.point_benefit) + " 적립" : "없음"}</p></div>
      </div>
      <div className="mt-3 bg-stone-800 rounded-xl p-3 flex items-center justify-between">
        <span className="text-xs text-stone-300">{rec.quantity}{rec.unit}당 단가</span>
        <span className="text-lg font-black text-white">{formatWon(unitPrice)}<span className="text-xs text-stone-400 ml-1">/{rec.unit}</span></span>
      </div>
    </div>
  );
}

function ItemCard({ item, onAddRecord, onDeleteRecord, onDeleteItem }) {
  const [expanded, setExpanded] = useState(false);
  const records = item.records || [];
  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  const units = records.map(calcUnit);
  const minUnit = Math.min(...units);
  const latestId = sorted[0]?.id;
  const bestId = records.find((r) => calcUnit(r) === minUnit)?.id;
  const latestUnit = sorted[0] ? calcUnit(sorted[0]) : 0;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-5 flex items-center justify-between text-left">
        <div>
          <Badge color="gray">{item.category}</Badge>
          <p className="font-black text-stone-900 text-base mt-1">{item.name}</p>
          <p className="text-xs text-stone-400 mt-0.5">구매 {records.length}회 기록</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-400">최근 단가</p>
          <p className="text-xl font-black text-stone-900">{records.length > 0 ? formatWon(latestUnit) : "-"}</p>
          {sorted[0] && <p className="text-[10px] text-stone-400">/{sorted[0].unit}</p>}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-stone-100 pt-4">
          {sorted.length === 0 && <p className="text-center text-stone-400 text-sm py-4">아직 기록이 없어요</p>}
          {sorted.map((rec) => (
            <RecordRow key={rec.id} rec={rec} isLatest={rec.id === latestId} isBest={rec.id === bestId} onDelete={onDeleteRecord} />
          ))}
          <button onClick={() => onAddRecord(item.id)} className="w-full mt-2 py-3 rounded-2xl border-2 border-dashed border-stone-300 text-stone-400 text-sm font-semibold hover:border-amber-400 hover:text-amber-500 transition-colors">
            + 새 구매 기록 추가
          </button>
          <button onClick={() => onDeleteItem(item.id)} className="w-full py-2 text-xs text-stone-300 hover:text-rose-400 transition-colors">상품 삭제</button>
        </div>
      )}
    </div>
  );
}

const emptyForm = { date: new Date().toISOString().slice(0, 10), store: "", originalPrice: "", couponDiscount: "", pointBenefit: "", quantity: "", unit: "개", note: "" };

function AddRecordModal({ itemName, onClose, onSave, saving }) {
  const [form, setForm] = useState(emptyForm);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const paid = (Number(form.originalPrice) || 0) - (Number(form.couponDiscount) || 0) - (Number(form.pointBenefit) || 0);
  const unitPrice = form.quantity > 0 ? Math.round(paid / Number(form.quantity)) : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-8 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-stone-900 text-lg">구매 기록 추가</h2>
          <button onClick={onClose} className="text-stone-400 text-2xl leading-none">×</button>
        </div>
        <p className="text-sm text-stone-500 -mt-2">{itemName}</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-stone-400 font-semibold">구매일</label><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="w-full mt-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400" /></div>
            <div><label className="text-xs text-stone-400 font-semibold">구매처</label><input placeholder="코스트코" value={form.store} onChange={(e) => set("store", e.target.value)} className="w-full mt-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400" /></div>
          </div>
          <div><label className="text-xs text-stone-400 font-semibold">원가 (할인 전)</label><input type="number" placeholder="0" value={form.originalPrice} onChange={(e) => set("originalPrice", e.target.value)} className="w-full mt-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-stone-400 font-semibold">쿠폰 할인액</label><input type="number" placeholder="0" value={form.couponDiscount} onChange={(e) => set("couponDiscount", e.target.value)} className="w-full mt-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400" /></div>
            <div><label className="text-xs text-stone-400 font-semibold">포인트 적립</label><input type="number" placeholder="0" value={form.pointBenefit} onChange={(e) => set("pointBenefit", e.target.value)} className="w-full mt-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-stone-400 font-semibold">수량</label><input type="number" placeholder="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className="w-full mt-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400" /></div>
            <div><label className="text-xs text-stone-400 font-semibold">단위</label><select value={form.unit} onChange={(e) => set("unit", e.target.value)} className="w-full mt-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400">{["개", "캔", "봉", "L", "kg", "g", "ml", "장", "롤", "팩"].map((u) => <option key={u}>{u}</option>)}</select></div>
          </div>
          <div><label className="text-xs text-stone-400 font-semibold">메모 (선택)</label><input placeholder="핫딜, 시즌 특가..." value={form.note} onChange={(e) => set("note", e.target.value)} className="w-full mt-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400" /></div>
        </div>
        {form.quantity > 0 && form.originalPrice > 0 && (
          <div className="bg-stone-900 rounded-2xl p-4 flex items-center justify-between">
            <div><p className="text-xs text-stone-400">실결제</p><p className="text-white font-bold">{formatWon(paid)}</p></div>
            <div className="text-right"><p className="text-xs text-stone-400">단위 가격</p><p className="text-xl font-black text-amber-400">{formatWon(unitPrice)}<span className="text-xs text-stone-400">/{form.unit}</span></p></div>
          </div>
        )}
        <button onClick={() => { if (form.store && form.originalPrice && form.quantity) onSave(form); }} disabled={saving} className="w-full py-4 bg-amber-400 text-stone-900 font-black rounded-2xl text-base hover:bg-amber-500 transition-colors disabled:opacity-50">
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}

function AddItemModal({ onClose, onSave, saving }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-stone-900 text-lg">새 생필품 추가</h2>
          <button onClick={onClose} className="text-stone-400 text-2xl leading-none">×</button>
        </div>
        <div><label className="text-xs text-stone-400 font-semibold">상품명</label><input placeholder="세탁세제 (리큐) ..." value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400" /></div>
        <div><label className="text-xs text-stone-400 font-semibold">카테고리</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <button onClick={() => { if (name) onSave({ name, category }); }} disabled={saving} className="w-full py-4 bg-amber-400 text-stone-900 font-black rounded-2xl hover:bg-amber-500 transition-colors disabled:opacity-50">
          {saving ? "저장 중..." : "추가하기"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("전체");
  const [addRecordFor, setAddRecordFor] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      setError(null);
      setLoading(true);
      const [itemsData, recordsData] = await Promise.all([
        api("items?select=*&order=created_at.asc"),
        api("records?select=*&order=date.asc"),
      ]);
      setItems(itemsData.map((item) => ({ ...item, records: recordsData.filter((r) => r.item_id === item.id) })));
    } catch {
      setError("데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAddItem = async ({ name, category }) => {
    setSaving(true);
    try {
      const [newItem] = await api("items?select=*", { method: "POST", body: JSON.stringify({ name, category }) });
      setItems((prev) => [...prev, { ...newItem, records: [] }]);
      setShowAddItem(false);
    } catch { alert("저장 실패. 다시 시도해주세요."); }
    finally { setSaving(false); }
  };

  const handleAddRecord = async (itemId, form) => {
    setSaving(true);
    try {
      const [newRec] = await api("records?select=*", {
        method: "POST",
        body: JSON.stringify({ item_id: itemId, date: form.date, store: form.store, original_price: Number(form.originalPrice), coupon_discount: Number(form.couponDiscount) || 0, point_benefit: Number(form.pointBenefit) || 0, quantity: Number(form.quantity), unit: form.unit, note: form.note }),
      });
      setItems((prev) => prev.map((it) => it.id === itemId ? { ...it, records: [...it.records, newRec] } : it));
      setAddRecordFor(null);
    } catch { alert("저장 실패. 다시 시도해주세요."); }
    finally { setSaving(false); }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!confirm("이 기록을 삭제할까요?")) return;
    try {
      await api(`records?id=eq.${recordId}`, { method: "DELETE" });
      setItems((prev) => prev.map((it) => ({ ...it, records: it.records.filter((r) => r.id !== recordId) })));
    } catch { alert("삭제 실패."); }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("상품과 모든 기록을 삭제할까요?")) return;
    try {
      await api(`items?id=eq.${itemId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((it) => it.id !== itemId));
    } catch { alert("삭제 실패."); }
  };

  const filtered = useMemo(() => items.filter((it) => {
    const matchCat = filterCat === "전체" || it.category === filterCat;
    const matchSearch = it.name.includes(search) || it.category.includes(search);
    return matchCat && matchSearch;
  }), [items, search, filterCat]);

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <div className="sticky top-0 z-10 bg-white border-b border-stone-100 px-5 pt-6 pb-4 shadow-sm">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">장바구니 📋</h1>
            <p className="text-xs text-stone-400 mt-0.5">4인 가족 생필품 가격 비교</p>
          </div>
          <button onClick={() => setShowAddItem(true)} className="bg-amber-400 text-stone-900 font-black text-sm px-4 py-2 rounded-2xl hover:bg-amber-500 transition-colors shadow-sm">+ 추가</button>
        </div>
        <div className="max-w-md mx-auto mt-3">
          <input placeholder="🔍 상품명 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border border-stone-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 bg-stone-50" />
        </div>
        <div className="max-w-md mx-auto mt-3 flex gap-2 overflow-x-auto pb-1">
          {["전체", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setFilterCat(c)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filterCat === c ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}>{c}</button>
          ))}
        </div>
      </div>
      <div className="max-w-md mx-auto px-4 py-5 space-y-3 pb-24">
        {loading && <div className="text-center py-16 text-stone-400"><p className="text-3xl mb-3">⏳</p><p className="font-semibold">불러오는 중...</p></div>}
        {error && <div className="text-center py-8 text-rose-400 bg-rose-50 rounded-2xl"><p className="font-semibold">{error}</p><button onClick={fetchAll} className="mt-2 text-sm underline">다시 시도</button></div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-stone-400"><p className="text-4xl mb-3">🛒</p><p className="font-semibold">아직 기록이 없어요</p><p className="text-sm mt-1">+ 추가 버튼으로 시작해보세요</p></div>
        )}
        {!loading && filtered.map((item) => (
          <ItemCard key={item.id} item={item} onAddRecord={(id) => setAddRecordFor(id)} onDeleteRecord={handleDeleteRecord} onDeleteItem={handleDeleteItem} />
        ))}
      </div>
      {addRecordFor && <AddRecordModal itemName={items.find((it) => it.id === addRecordFor)?.name} onClose={() => setAddRecordFor(null)} onSave={(form) => handleAddRecord(addRecordFor, form)} saving={saving} />}
      {showAddItem && <AddItemModal onClose={() => setShowAddItem(false)} onSave={handleAddItem} saving={saving} />}
    </div>
  );
}
