/* =====================================================================
 * «Питание» — журнал съеденного за день + создание записи. Написано с нуля
 * (решение владельца 2026-11-12): из прототипа берём только цвета, ни одного
 * старого компонента, паттерна и экрана. Переключатель «Поведение → Экран
 * «Питание»» (state.controls.mealList): a / b / c — варианты журнала,
 * groups — исходный экран приложения.
 *
 * Журнал (просмотр):
 *   a «Плитки» — 4 плитки приёмов, под ними раскрыт один приём;
 *   b «Лента» — день сверху вниз на линии времени, все приёмы и блюда;
 *   c «Карусель» — приём = карточка во всю ширину, листаются вбок.
 * Создание (общее для всех, начинается только из приёма — «куда» уже известно):
 *   «Что было на обед?» → поиск (библиотека + мои блюда) | камера |
 *   мои блюда / недавние | «Нет в списке — ввести вручную» → порция → в журнал.
 * Камера: Еда (тарелка → список распознанного), Этикетка (→ форма с цифрами),
 *   Штрихкод и Честный знак (→ продукт сразу). Сканирование — имитация, демо-данные.
 * Копирование приёма: куда (вчера / сегодня / завтра / другой день) + в какой
 *   приём + какие блюда. Удаление блюда: свайп влево или в карточке блюда.
 * ===================================================================== */

var NX_MEALS = ["Завтрак", "Обед", "Ужин", "Перекус"];
var NX_ON = { Завтрак: "на завтрак", Обед: "на обед", Ужин: "на ужин", Перекус: "на перекус" };
var NX_IN = { Завтрак: "в завтрак", Обед: "в обед", Ужин: "в ужин", Перекус: "в перекус" };
var NX_C = { p: "#5A4FF5", f: "#9245F0", c: "#F17C59" };
var NX_WD = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

/* демо-данные сканера и распознавания (не из ТЗ) */
var NX_DEMO = {
  plate: [
    { name: "Куриная грудка запечённая", per: { k: 165, p: 31, f: 3.6, c: 0 }, g: 150 },
    { name: "Рис отварной", per: { k: 130, p: 2.7, f: 0.3, c: 28 }, g: 180 },
    { name: "Салат из огурцов и томатов", per: { k: 24, p: 1, f: 0.2, c: 4.6 }, g: 120 },
  ],
  barcode: { id: "nx-bar", name: "Батончик мюсли с орехами", per: { k: 412, p: 8.5, f: 14, c: 61 }, portion: 35, brand: "Штрихкод 4600000000123" },
  honest: { id: "nx-kefir", name: "Кефир 1%", per: { k: 40, p: 3, f: 1, c: 4 }, portion: 250, brand: "Честный знак · молочная продукция" },
  label: { per: { k: 66, p: 7, f: 2, c: 4.3 } },
};

/* демо-библиотека приложения (типовые значения на 100 г; не из ТЗ — для прототипа) */
var NX_LIB = [
  ["Гречка отварная", 110, 4.2, 1.1, 21.3, 180],
  ["Греческий йогурт 2%", 66, 7, 2, 4.3, 140],
  ["Грейпфрут", 35, 0.7, 0.2, 6.5, 200],
  ["Рис отварной", 130, 2.7, 0.3, 28, 180],
  ["Макароны отварные", 140, 5, 1.1, 27, 200],
  ["Картофельное пюре", 88, 2, 3.3, 13, 200],
  ["Куриная грудка запечённая", 165, 31, 3.6, 0, 150],
  ["Котлета куриная", 190, 18, 11, 6, 100],
  ["Говядина тушёная", 220, 23, 14, 0, 150],
  ["Лосось запечённый", 208, 22, 13, 0, 150],
  ["Омлет из 2 яиц", 154, 11, 12, 1.5, 130],
  ["Сырники", 220, 15, 9, 20, 150],
  ["Творог 5%", 121, 17, 5, 1.8, 180],
  ["Борщ", 49, 2.4, 2.1, 5.2, 300],
  ["Суп куриный с лапшой", 45, 3.2, 1.4, 5, 300],
  ["Салат овощной с маслом", 70, 1, 5.5, 4.5, 150],
  ["Хлеб цельнозерновой", 245, 9, 3.3, 43, 30],
  ["Банан", 89, 1.1, 0.3, 22.9, 120],
  ["Яблоко", 52, 0.3, 0.2, 13.8, 180],
  ["Кофе с молоком", 40, 2, 1.6, 4.2, 250],
  ["Шоколад молочный", 535, 7.6, 30, 59, 25],
  ["Пицца Маргарита", 250, 11, 9, 31, 250],
].map(([name, k, p, f, c, portion], i) => ({ id: "lib" + i, name, per: { k, p, f, c }, portion }));
function nxOn(s) {
  return ["a", "b", "c"].includes(s.controls.mealList ?? "a");
}
function nxVar(s) {
  return s.controls.mealList ?? "a";
}
/* совместимость со старыми сценариями (режим «Исходный экран») */
function mlReveal(s, meal) {
  s.nxMeal = meal;
}
function mpAddTo(meal) {
  N.update((s) => {
    (s.mealDraftType = meal), (s.lastMealType = meal);
  });
  N.go("nutrition-add", "stats");
}

/* ---------- данные ---------- */
function nxDay(s, date = s.date) {
  return s.controls.view === "empty" ? [] : s.entries.filter((e) => e.kind === "meal" && e.date === date);
}
function nxMealItems(s, meal, date) {
  return nxDay(s, date)
    .filter((e) => (e.meal || "Перекус") === meal)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
}
function nxSum(items) {
  const ok = items.filter((e) => !e.recognizing && !e.recognizeError);
  return ["value", "proteins", "fats", "carbs"].reduce((o, k) => ((o[k] = ok.reduce((a, e) => a + (e[k] || 0), 0)), o), {});
}
function nxN(v, d = 0) {
  const m = 10 ** d;
  return rt(Math.round((v || 0) * m) / m);
}
function nxDishes(n_) {
  return `${n_} ${n_ % 10 === 1 && n_ % 100 !== 11 ? "блюдо" : [2, 3, 4].includes(n_ % 10) && ![12, 13, 14].includes(n_ % 100) ? "блюда" : "блюд"}`;
}
function nxPer(p) {
  /* продукт прототипа → на 100 г */
  return p.per || { k: p.calories || 0, p: p.proteins || 0, f: p.fats || 0, c: p.carbs || 0 };
}
function nxLibrary(s) {
  const fav = new Set(s.favorites || []);
  const own = (s.products || []).map((p) => ({ ...p, per: nxPer(p), mine: fav.has(p.id) || !!p.own })),
    names = new Set(own.map((p) => p.name));
  return [...own, ...NX_LIB.filter((p) => !names.has(p.name)).map((p) => ({ ...p, mine: fav.has(p.id) }))];
}
function nxRecent(s) {
  const seen = new Set(),
    out = [];
  [...s.entries]
    .filter((e) => e.kind === "meal" && !e.recognizing && !e.recognizeError)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .forEach((e) => {
      if (seen.has(e.name) || out.length >= 8) return;
      seen.add(e.name);
      const g = e.grams || 100;
      out.push({ id: e.productId || e.name, name: e.name, portion: g, per: e.per100 ? { k: e.per100.calories, p: e.per100.proteins, f: e.per100.fats, c: e.per100.carbs } : { k: (e.value / g) * 100, p: (e.proteins / g) * 100, f: (e.fats / g) * 100, c: (e.carbs / g) * 100 } });
    });
  return out;
}
function nxDate(d, delta) {
  const x = new Date(d + "T12:00:00");
  x.setDate(x.getDate() + delta);
  return x.toISOString().slice(0, 10);
}
function nxDayName(d) {
  return d === sl ? "сегодня" : d === nxDate(sl, -1) ? "вчера" : d === nxDate(sl, 1) ? "завтра" : _p(d);
}
function nxEntry(prod, grams, meal, date, time) {
  const k = grams / 100,
    per = prod.per;
  return {
    id: N.id(),
    kind: "meal",
    name: prod.name,
    date,
    time,
    meal,
    provider: "manual",
    productId: prod.id,
    grams,
    unit: "г",
    value: Math.round(per.k * k),
    proteins: Math.round(per.p * k * 10) / 10,
    fats: Math.round(per.f * k * 10) / 10,
    carbs: Math.round(per.c * k * 10) / 10,
    per100: { calories: per.k, proteins: per.p, fats: per.f, carbs: per.c },
  };
}
function nxAddEntries(list, meal, msg) {
  mfHideKeyboard();
  N.update((s) => {
    list.forEach((e) => s.entries.push(e));
    s.lastMealType = meal;
    s.nxMeal = meal;
    s.nxLayers = [];
    s.nxSnack = { text: msg, undo: list.map((e) => e.id), at: Date.now() };
  });
  nxSnackTimer();
}
function nxSnackTimer() {
  setTimeout(() => N.update((s) => void (s.nxSnack && Date.now() - s.nxSnack.at > 3800 && (s.nxSnack = null))), 4000);
}
function nxDelete(e) {
  N.update((s) => {
    s.entries = s.entries.filter((x) => x.id !== e.id);
    s.nxLayers = (s.nxLayers || []).filter((l) => l.k !== "dish");
    s.nxSnack = { text: `Удалено: ${e.name}`, restore: [e], at: Date.now() };
  });
  nxSnackTimer();
}
function nxUndo() {
  N.update((s) => {
    const sn = s.nxSnack;
    if (!sn) return;
    sn.undo && (s.entries = s.entries.filter((e) => !sn.undo.includes(e.id)));
    sn.restore && sn.restore.forEach((e) => s.entries.push(e));
    s.nxSnack = null;
  });
}
/* слои поверх журнала */
function nxOpen(layer) {
  mfHideKeyboard();
  N.update((s) => void (s.nxLayers = [...(s.nxLayers || []), layer]));
}
function nxBack() {
  mfHideKeyboard();
  N.update((s) => void (s.nxLayers = (s.nxLayers || []).slice(0, -1)));
}
function nxCloseAll() {
  N.update((s) => void (s.nxLayers = []));
}

/* ---------- иконки (свои, линейные) ---------- */
var NX_IC = {
  back: "M15 5l-7 7 7 7",
  close: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  copy: "M9 9h10v10H9zM5 15V5h10",
  search: "M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-4-4",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  pen: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  chev: "M9 6l6 6-6 6",
  down: "M6 9l6 6 6-6",
  check: "M5 12l5 5 9-10",
  trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5a1.5 1.5 0 1 0 0-.01",
  flash: "M13 3L5 14h6l-1 7 8-11h-6z",
  minus: "M5 12h14",
};
function NxI({ n: name, s = 22, w = 1.8 }) {
  return n.jsx("svg", {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: w,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    children: n.jsx("path", { d: NX_IC[name] }),
  });
}

/* ---------- шапка, неделя, итог дня ---------- */
function NxTop() {
  const st = we(),
    d = st.date,
    wd = (new Date(d + "T12:00:00").getDay() + 6) % 7,
    week = [...Array(7)].map((_, i) => nxDate(d, i - wd)),
    has = new Set(st.entries.filter((e) => e.kind === "meal").map((e) => e.date));
  return n.jsxs("header", {
    className: "nx-top",
    children: [
      n.jsxs("div", {
        className: "nx-bar",
        children: [
          n.jsx("button", { type: "button", className: "nx-ic-btn", "aria-label": "Назад", onClick: () => N.back(), children: n.jsx(NxI, { n: "back" }) }),
          n.jsxs("div", {
            className: "nx-title",
            children: [n.jsx("h1", { children: "Питание" }), n.jsx("span", { children: d === sl ? "Сегодня" : _p(d) })],
          }),
          n.jsx("span", { className: "nx-ic-btn ghost" }),
        ],
      }),
      n.jsx("div", {
        className: "nx-week",
        role: "tablist",
        "aria-label": "Дни недели",
        children: week.map((x, i) =>
          n.jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": x === d,
              "aria-label": _p(x),
              className: `nx-wd ${x === sl ? "today" : ""} ${x > sl ? "future" : ""}`,
              onClick: () => N.update((s) => void (s.date = x)),
              children: [n.jsx("small", { children: NX_WD[i] }), n.jsx("b", { children: +x.slice(8) }), n.jsx("i", { className: has.has(x) ? "on" : "" })],
            },
            x,
          ),
        ),
      }),
    ],
  });
}
function NxSummary() {
  const st = we(),
    t = nxSum(nxDay(st)),
    goal = st.goals.meal || 0,
    left = goal - t.value,
    pct = Math.min(1, t.value / (goal || 1)),
    R = 46,
    L = 2 * Math.PI * R;
  return n.jsxs("section", {
    className: "nx-sum",
    "aria-label": `Съедено ${Math.round(t.value)} из ${goal} ккал`,
    children: [
      n.jsxs("div", {
        className: "nx-ring",
        children: [
          n.jsxs("svg", {
            viewBox: "0 0 108 108",
            "aria-hidden": "true",
            children: [
              n.jsx("circle", { cx: 54, cy: 54, r: R, className: "track" }),
              n.jsx("circle", { cx: 54, cy: 54, r: R, className: "val", strokeDasharray: `${L * pct} ${L}` }),
            ],
          }),
          n.jsxs("div", {
            className: "nx-ring-txt",
            children: [n.jsx("b", { children: nxN(Math.abs(left)) }), n.jsx("small", { children: left >= 0 ? "ккал осталось" : "ккал сверх" })],
          }),
        ],
      }),
      n.jsxs("div", {
        className: "nx-sum-side",
        children: [
          n.jsxs("p", { className: "nx-eaten", children: [n.jsx("b", { children: nxN(t.value) }), ` из ${rt(goal)} ккал`] }),
          [
            ["Белки", "proteins", NX_C.p],
            ["Жиры", "fats", NX_C.f],
            ["Углеводы", "carbs", NX_C.c],
          ].map(([l, k, c]) =>
            n.jsxs(
              "div",
              {
                className: "nx-mac",
                children: [
                  n.jsxs("span", { children: [l, n.jsxs("em", { children: [nxN(t[k]), " / ", st.goals[k], " г"] })] }),
                  n.jsx("i", { children: n.jsx("u", { style: { width: `${Math.min(100, (t[k] / (st.goals[k] || 1)) * 100)}%`, background: c } }) }),
                ],
              },
              k,
            ),
          ),
        ],
      }),
    ],
  });
}

/* ---------- блюдо в журнале: касание → карточка, свайп влево → удалить ---------- */
function NxDish({ e }) {
  const [dx, setDx] = V.useState(0),
    dr = V.useRef(null);
  if (e.recognizing)
    return n.jsxs("div", { className: "nx-dish busy", role: "status", children: [n.jsx("i", { className: "nx-spin" }), n.jsx("span", { children: "Считаем калории по фото…" })] });
  if (e.recognizeError) return n.jsx("div", { className: "nx-dish busy", children: n.jsx("span", { children: "Не получилось распознать фото" }) });
  const open = () => nxOpen({ k: "dish", id: e.id }),
    down = (v) => (dr.current = { x: v.clientX, s: dx, m: !1 }),
    move = (v) => {
      const d = dr.current;
      if (!d) return;
      Math.abs(v.clientX - d.x) > 6 && (d.m = !0);
      d.m && setDx(Math.max(-88, Math.min(0, d.s + v.clientX - d.x)));
    },
    up = () => {
      const d = dr.current;
      dr.current = null;
      d && (d.m ? setDx(dx < -40 ? -88 : 0) : dx ? setDx(0) : open());
    };
  return n.jsxs("div", {
    className: `nx-swipe ${dx ? "on" : ""}`,
    children: [
      n.jsxs("button", {
        type: "button",
        className: "nx-del",
        tabIndex: dx ? 0 : -1,
        "aria-label": `Удалить ${e.name}`,
        onClick: () => nxDelete(e),
        children: [n.jsx(NxI, { n: "trash", s: 20 }), "Удалить"],
      }),
      n.jsxs("div", {
        className: "nx-dish",
        role: "button",
        tabIndex: 0,
        "aria-label": `${e.name}, ${Math.round(e.value)} ккал, ${Math.round(e.grams || 0)} г`,
        style: { transform: `translateX(${dx}px)` },
        onPointerDown: down,
        onPointerMove: move,
        onPointerUp: up,
        onPointerLeave: () => dr.current && up(),
        onKeyDown: (v) => v.key === "Enter" && open(),
        children: [
          n.jsxs("div", {
            className: "nx-dish-l",
            children: [
              n.jsx("b", { children: e.name }),
              n.jsxs("span", { className: "nx-meta", children: [nxN(e.grams || 100), " г · ", e.time] }),
              n.jsx(NxPFC, { p: e.proteins, f: e.fats, c: e.carbs }),
            ],
          }),
          n.jsxs("div", { className: "nx-kcal", children: [n.jsx("b", { children: nxN(e.value) }), n.jsx("small", { children: "ккал" })] }),
        ],
      }),
    ],
  });
}
function NxPFC({ p, f, c }) {
  return n.jsx("span", {
    className: "nx-pfc",
    children: [
      ["Б", p, NX_C.p],
      ["Ж", f, NX_C.f],
      ["У", c, NX_C.c],
    ].map(([l, v, col]) => n.jsxs("span", { children: [n.jsx("i", { style: { color: col }, children: l }), nxN(v, 1)] }, l)),
  });
}
function NxMealActions({ meal, items, big }) {
  return n.jsxs("div", {
    className: `nx-acts ${big ? "big" : ""}`,
    children: [
      items.length > 0 &&
        n.jsxs("button", {
          type: "button",
          className: "nx-act soft",
          onClick: () => nxOpen({ k: "copy", meal }),
          children: [n.jsx(NxI, { n: "copy", s: 18 }), "Скопировать"],
        }),
      n.jsxs("button", {
        type: "button",
        className: "nx-act main",
        onClick: () => nxOpen({ k: "add", meal }),
        children: [n.jsx(NxI, { n: "plus", s: 18, w: 2.2 }), items.length ? "Добавить" : `Добавить ${NX_IN[meal]}`],
      }),
    ],
  });
}

/* ---------- A · Плитки ---------- */
function NxTiles() {
  const st = we(),
    day = nxDay(st),
    sel = NX_MEALS.includes(st.nxMeal) ? st.nxMeal : NX_MEALS.find((m) => day.some((e) => (e.meal || "Перекус") === m)) || "Завтрак",
    items = nxMealItems(st, sel);
  return n.jsxs("div", {
    className: "nx-a",
    children: [
      n.jsx("div", {
        className: "nx-tiles",
        role: "tablist",
        "aria-label": "Приёмы пищи",
        children: NX_MEALS.map((m) => {
          const its = nxMealItems(st, m),
            t = nxSum(its);
          return n.jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": m === sel,
              className: "nx-tile",
              onClick: () => N.update((s) => void (s.nxMeal = m)),
              children: [
                n.jsx("span", { className: "nx-tile-n", children: m }),
                n.jsx("b", { children: its.length ? nxN(t.value) : "+" }),
                n.jsx("small", { children: its.length ? nxDishes(its.length) : "пусто" }),
              ],
            },
            m,
          );
        }),
      }),
      n.jsxs("section", {
        className: "nx-panel",
        role: "tabpanel",
        "aria-label": sel,
        children: [
          items.length
            ? n.jsx("div", { className: "nx-list", children: items.map((e) => n.jsx(NxDish, { e }, e.id)) })
            : n.jsxs("div", {
                className: "nx-empty",
                children: [n.jsx("b", { children: `Что было ${NX_ON[sel]}?` }), n.jsx("span", { children: "Сфотографируйте тарелку или найдите блюдо — калории посчитаем сами" })],
              }),
          n.jsx(NxMealActions, { meal: sel, items, big: !0 }),
        ],
      }),
    ],
  });
}

/* ---------- B · Лента дня ---------- */
function NxFeed() {
  const st = we();
  return n.jsx("div", {
    className: "nx-b",
    children: NX_MEALS.map((m) => {
      const items = nxMealItems(st, m),
        t = nxSum(items);
      return n.jsxs(
        "section",
        {
          className: `nx-node ${items.length ? "" : "is-void"}`,
          "aria-label": m,
          children: [
            n.jsx("i", { className: "nx-dot", "aria-hidden": "true" }),
            n.jsxs("div", {
              className: "nx-node-h",
              children: [
                n.jsxs("div", {
                  children: [n.jsx("h3", { children: m }), n.jsx("span", { children: items.length ? `${items[0].time} · ${nxDishes(items.length)}` : "ещё ничего" })],
                }),
                items.length > 0 && n.jsxs("b", { className: "nx-node-k", children: [nxN(t.value), n.jsx("small", { children: " ккал" })] }),
              ],
            }),
            items.length > 0 && n.jsx("div", { className: "nx-list", children: items.map((e) => n.jsx(NxDish, { e }, e.id)) }),
            n.jsx(NxMealActions, { meal: m, items }),
          ],
        },
        m,
      );
    }),
  });
}

/* ---------- C · Карусель ---------- */
function NxCarousel() {
  const st = we(),
    ref = V.useRef(null),
    [idx, setIdx] = V.useState(() => Math.max(0, NX_MEALS.indexOf(st.nxMeal || st.lastMealType || "Завтрак"))),
    go = (i) => {
      const el = ref.current;
      el && el.scrollTo({ left: i * (el.firstChild.offsetWidth + 10), behavior: "smooth" });
    };
  V.useEffect(() => {
    const el = ref.current;
    el && (el.scrollLeft = idx * (el.firstChild.offsetWidth + 10));
  }, []);
  return n.jsxs("div", {
    className: "nx-c",
    children: [
      n.jsx("div", {
        className: "nx-pager",
        role: "tablist",
        children: NX_MEALS.map((m, i) => {
          const its = nxMealItems(st, m);
          return n.jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": i === idx,
              onClick: () => go(i),
              children: [m, n.jsx("small", { children: its.length ? nxN(nxSum(its).value) : "—" })],
            },
            m,
          );
        }),
      }),
      n.jsx("div", {
        className: "nx-track",
        ref,
        onScroll: (v) => {
          const el = v.currentTarget,
            i = Math.round(el.scrollLeft / (el.firstChild.offsetWidth + 10));
          i !== idx && (setIdx(i), N.update((s) => void (s.nxMeal = NX_MEALS[i])));
        },
        children: NX_MEALS.map((m) => {
          const items = nxMealItems(st, m),
            t = nxSum(items);
          return n.jsxs(
            "section",
            {
              className: "nx-card",
              "aria-label": m,
              children: [
                n.jsxs("div", {
                  className: "nx-card-h",
                  children: [
                    n.jsx("h3", { children: m }),
                    n.jsxs("span", { children: [n.jsx("b", { children: items.length ? nxN(t.value) : "0" }), " ккал · ", items.length ? nxDishes(items.length) : "пусто"] }),
                  ],
                }),
                items.length
                  ? n.jsx("div", { className: "nx-list", children: items.map((e) => n.jsx(NxDish, { e }, e.id)) })
                  : n.jsxs("div", {
                      className: "nx-empty",
                      children: [n.jsx("b", { children: `Что было ${NX_ON[m]}?` }), n.jsx("span", { children: "Фото, поиск или своё блюдо — выберете на следующем шаге" })],
                    }),
                n.jsx(NxMealActions, { meal: m, items, big: !0 }),
              ],
            },
            m,
          );
        }),
      }),
    ],
  });
}

/* ============== СОЗДАНИЕ ============== */
/* «Что было на обед?» — один экран выбора источника */
function NxAdd({ meal }) {
  const st = we(),
    [q, setQ] = V.useState(""),
    [tab, setTab] = V.useState("mine"),
    lib = nxLibrary(st),
    mine = lib.filter((p) => p.mine),
    recent = nxRecent(st),
    qq = q.trim().toLowerCase(),
    found = qq ? lib.filter((p) => p.name.toLowerCase().includes(qq)).sort((a, b) => b.mine - a.mine) : null,
    list = found || (tab === "mine" ? mine : recent),
    pick = (p) => nxOpen({ k: "portion", meal, prod: p });
  return n.jsxs("div", {
    className: "nx-screen nx-add",
    role: "dialog",
    "aria-label": `Добавить ${NX_IN[meal]}`,
    children: [
      n.jsxs("div", {
        className: "nx-bar",
        children: [
          n.jsx("button", { type: "button", className: "nx-ic-btn", "aria-label": "Закрыть", onClick: nxBack, children: n.jsx(NxI, { n: "close" }) }),
          n.jsx("div", { className: "nx-title", children: n.jsx("h1", { children: `Что было ${NX_ON[meal]}?` }) }),
          n.jsx("span", { className: "nx-ic-btn ghost" }),
        ],
      }),
      n.jsxs("div", {
        className: "nx-find",
        children: [
          n.jsxs("label", {
            className: "nx-search",
            children: [
              n.jsx(NxI, { n: "search", s: 20 }),
              n.jsx("input", { value: q, placeholder: "Гречка, яблоко, сырники…", "aria-label": "Найти блюдо или продукт", onChange: (v) => setQ(v.target.value) }),
              q && n.jsx("button", { type: "button", "aria-label": "Очистить", onClick: () => setQ(""), children: n.jsx(NxI, { n: "close", s: 16 }) }),
            ],
          }),
          n.jsx("button", {
            type: "button",
            className: "nx-cam-btn",
            "aria-label": "Камера: фото еды, этикетка, штрихкод, Честный знак",
            onClick: () => nxOpen({ k: "camera", meal }),
            children: n.jsx(NxI, { n: "camera", s: 24 }),
          }),
        ],
      }),
      !found &&
        n.jsx("div", {
          className: "nx-seg",
          role: "tablist",
          children: [
            ["mine", `Мои блюда · ${mine.length}`],
            ["recent", "Недавние"],
          ].map(([k, l]) => n.jsx("button", { type: "button", role: "tab", "aria-selected": tab === k, onClick: () => setTab(k), children: l }, k)),
        }),
      n.jsxs("div", {
        className: "nx-scroll",
        children: [
          found && n.jsx("p", { className: "nx-cap", children: found.length ? `Нашли ${found.length}` : "Ничего не нашли" }),
          list.length > 0 &&
            n.jsx("div", {
              className: "nx-list",
              children: list.map((p) =>
                n.jsxs(
                  "button",
                  {
                    type: "button",
                    className: "nx-pick",
                    onClick: () => pick(p),
                    children: [
                      n.jsxs("span", {
                        className: "nx-dish-l",
                        children: [
                          n.jsxs("b", { children: [p.mine && n.jsx("i", { className: "nx-heart", children: n.jsx(NxI, { n: "heart", s: 14, w: 2.4 }) }), p.name] }),
                          n.jsxs("span", { className: "nx-meta", children: [nxN(p.per.k), " ккал в 100 г"] }),
                        ],
                      }),
                      n.jsx("span", { className: "nx-chev", children: n.jsx(NxI, { n: "chev", s: 18 }) }),
                    ],
                  },
                  p.id + p.name,
                ),
              ),
            }),
          !found && !list.length && n.jsx("p", { className: "nx-cap", children: tab === "mine" ? "Сердечко в карточке продукта добавит его сюда" : "Здесь появится то, что вы ели недавно" }),
          n.jsxs("button", {
            type: "button",
            className: "nx-manual",
            onClick: () => nxOpen({ k: "manual", meal, name: q.trim() }),
            children: [
              n.jsx(NxI, { n: "pen", s: 20 }),
              n.jsxs("span", { children: [n.jsx("b", { children: q.trim() ? `Ввести «${q.trim()}» вручную` : "Нет в списке? Ввести вручную" }), n.jsx("small", { children: "Название, вес и калории — остальное по желанию" })] }),
            ],
          }),
        ],
      }),
    ],
  });
}

/* порция: сколько съели → в журнал */
function NxPortion({ meal, prod }) {
  const st = we(),
    base = prod.portion || 100,
    [g, setG] = V.useState(base),
    [m, setM] = V.useState(meal),
    k = g / 100,
    per = prod.per,
    mine = (st.favorites || []).includes(prod.id),
    steps = [...new Set([Math.round(base / 2), base, base * 2, 100])].filter((x) => x > 0).sort((a, b) => a - b);
  return n.jsxs("div", {
    className: "nx-sheet-wrap",
    onClick: (v) => v.target === v.currentTarget && nxBack(),
    children: n.jsxs("div", {
      className: "nx-sheet",
      role: "dialog",
      "aria-label": prod.name,
      children: [
        n.jsxs("div", {
          className: "nx-sheet-h",
          children: [
            n.jsxs("div", { children: [n.jsx("h2", { children: prod.name }), prod.brand && n.jsx("span", { children: prod.brand })] }),
            prod.id &&
              n.jsx("button", {
                type: "button",
                className: `nx-ic-btn ${mine ? "fav" : ""}`,
                "aria-pressed": mine,
                "aria-label": mine ? "Убрать из моих блюд" : "Добавить в мои блюда",
                onClick: () =>
                  N.update((s) => {
                    const f = s.favorites || [];
                    s.favorites = f.includes(prod.id) ? f.filter((x) => x !== prod.id) : [...f, prod.id];
                    s.products.some((p) => p.id === prod.id) ||
                      s.products.push({ id: prod.id, name: prod.name, calories: per.k, proteins: per.p, fats: per.f, carbs: per.c, portion: base, own: !0 });
                  }),
                children: n.jsx(NxI, { n: "heart", s: 20, w: 2 }),
              }),
          ],
        }),
        n.jsxs("div", {
          className: "nx-big",
          children: [n.jsx("b", { children: nxN(per.k * k) }), n.jsx("span", { children: "ккал" })],
        }),
        n.jsx(NxPFC, { p: per.p * k, f: per.f * k, c: per.c * k }),
        n.jsxs("div", {
          className: "nx-weight",
          children: [
            n.jsx("button", { type: "button", "aria-label": "Меньше на 10 г", onClick: () => setG(Math.max(5, g - 10)), children: n.jsx(NxI, { n: "minus" }) }),
            n.jsxs("label", {
              children: [
                n.jsx("input", { inputMode: "numeric", "aria-label": "Вес, г", value: g, onChange: (v) => setG(Math.max(0, +v.target.value.replace(/\D/g, "") || 0)) }),
                n.jsx("span", { children: "г" }),
              ],
            }),
            n.jsx("button", { type: "button", "aria-label": "Больше на 10 г", onClick: () => setG(g + 10), children: n.jsx(NxI, { n: "plus" }) }),
          ],
        }),
        n.jsx("div", {
          className: "nx-chips",
          children: steps.map((x) => n.jsx("button", { type: "button", "aria-pressed": x === g, onClick: () => setG(x), children: x === base && prod.portion ? `порция ${x} г` : `${x} г` }, x)),
        }),
        n.jsx("div", {
          className: "nx-meals",
          role: "radiogroup",
          "aria-label": "Приём пищи",
          children: NX_MEALS.map((x) => n.jsx("button", { type: "button", role: "radio", "aria-checked": x === m, onClick: () => setM(x), children: x }, x)),
        }),
        n.jsx("button", {
          type: "button",
          className: "nx-cta",
          disabled: !g,
          onClick: () => nxAddEntries([nxEntry(prod, g, m, st.date, st.controls.clock)], m, `${prod.name} — ${NX_IN[m]}`),
          children: `Добавить ${NX_IN[m]}`,
        }),
      ],
    }),
  });
}

/* ручной ввод: минимум — название, вес и калории */
function NxManual({ meal, name = "", per: pre }) {
  const st = we(),
    [f, setF] = V.useState(() => ({ name, g: pre ? "100" : "", k: pre ? String(pre.k) : "", p: pre ? String(pre.p) : "", fa: pre ? String(pre.f) : "", c: pre ? String(pre.c) : "" })),
    [save, setSave] = V.useState(!0),
    set = (k) => (v) => setF((o) => ({ ...o, [k]: v.target.value.replace(",", ".") })),
    num = (x) => +x || 0,
    ok = f.name.trim() && num(f.g) > 0 && f.k !== "",
    submit = () => {
      const g = num(f.g),
        id = "own-" + N.id(),
        prod = { id, name: f.name.trim(), per: pre ? pre : { k: (num(f.k) / g) * 100, p: (num(f.p) / g) * 100, f: (num(f.fa) / g) * 100, c: (num(f.c) / g) * 100 } };
      save &&
        N.update((s) => {
          s.products.push({ id, name: prod.name, calories: prod.per.k, proteins: prod.per.p, fats: prod.per.f, carbs: prod.per.c, portion: g, own: !0 });
          s.favorites = [...(s.favorites || []), id];
        });
      nxAddEntries([nxEntry(prod, g, meal, st.date, st.controls.clock)], meal, `${prod.name} — ${NX_IN[meal]}`);
    },
    field = (k, label, unit, ph) =>
      n.jsxs("label", { className: "nx-field", children: [n.jsx("span", { children: label }), n.jsx("input", { inputMode: "decimal", value: f[k], placeholder: ph, onChange: set(k) }), n.jsx("em", { children: unit })] });
  return n.jsxs("div", {
    className: "nx-screen nx-form",
    role: "dialog",
    "aria-label": "Ввести вручную",
    children: [
      n.jsxs("div", {
        className: "nx-bar",
        children: [
          n.jsx("button", { type: "button", className: "nx-ic-btn", "aria-label": "Назад", onClick: nxBack, children: n.jsx(NxI, { n: "back" }) }),
          n.jsx("div", { className: "nx-title", children: n.jsx("h1", { children: pre ? "Этикетка прочитана" : "Своё блюдо" }) }),
          n.jsx("span", { className: "nx-ic-btn ghost" }),
        ],
      }),
      n.jsxs("div", {
        className: "nx-scroll",
        children: [
          pre && n.jsx("p", { className: "nx-note", children: "Цифры взяли с этикетки (на 100 г). Осталось назвать продукт и указать, сколько съели." }),
          n.jsxs("label", {
            className: "nx-field name",
            children: [n.jsx("span", { children: "Что это" }), n.jsx("input", { value: f.name, placeholder: "Например, суп мамин", onChange: set("name"), autoFocus: !f.name })],
          }),
          n.jsxs("div", { className: "nx-grid2", children: [field("g", "Съели", "г", "250"), field("k", pre ? "Калорий в 100 г" : "Калорий всего", "ккал", "300")] }),
          n.jsx("p", { className: "nx-cap", children: pre ? "Белки, жиры, углеводы в 100 г" : "Белки, жиры, углеводы — если знаете" }),
          n.jsxs("div", { className: "nx-grid3", children: [field("p", "Белки", "г", "—"), field("fa", "Жиры", "г", "—"), field("c", "Углеводы", "г", "—")] }),
          n.jsxs("label", {
            className: "nx-toggle",
            children: [
              n.jsx("input", { type: "checkbox", checked: save, onChange: () => setSave(!save) }),
              n.jsx("i", {}),
              n.jsxs("span", { children: [n.jsx("b", { children: "Сохранить в мои блюда" }), n.jsx("small", { children: "В следующий раз — в одно касание" })] }),
            ],
          }),
        ],
      }),
      n.jsx("div", {
        className: "nx-foot",
        children: n.jsx("button", { type: "button", className: "nx-cta", disabled: !ok, onClick: submit, children: `Добавить ${NX_IN[meal]}` }),
      }),
    ],
  });
}

/* камера: один видоискатель, режим определяет, что ищем и что будет дальше */
var NX_MODES = [
  ["plate", "Еда", "Снимите тарелку сверху — найдём все продукты"],
  ["label", "Этикетка", "Наведите на таблицу «Пищевая ценность»"],
  ["barcode", "Штрихкод", "Наведите на штрихкод — сработает само"],
  ["honest", "Честный знак", "Наведите на квадратный код на упаковке"],
];
function NxCamera({ meal }) {
  const st = we(),
    [mode, setMode] = V.useState("plate"),
    [phase, setPhase] = V.useState("aim"),
    [found, setFound] = V.useState(null),
    md = NX_MODES.find((x) => x[0] === mode),
    auto = mode === "barcode" || mode === "honest";
  V.useEffect(() => {
    if (!auto || phase !== "aim") return;
    const t = setTimeout(() => setFound(NX_DEMO[mode]), 1400);
    return () => clearTimeout(t);
  }, [mode, phase]);
  const shoot = () => {
    setPhase("busy");
    setTimeout(() => {
      N.update((s) => void (s.nxLayers = (s.nxLayers || []).filter((l) => l.k !== "camera")));
      mode === "plate" ? nxOpen({ k: "plate", meal }) : nxOpen({ k: "manual", meal, per: NX_DEMO.label.per });
      setPhase("aim");
    }, 1100);
  };
  return n.jsxs("div", {
    className: `nx-cam m-${mode}`,
    role: "dialog",
    "aria-label": "Камера",
    children: [
      n.jsx("div", { className: "nx-view", children: n.jsx("img", { src: mode === "plate" ? "assets/demo-meal.svg" : "assets/demo-breakfast.svg", alt: "" }) }),
      n.jsxs("div", {
        className: "nx-cam-top",
        children: [
          n.jsx("button", { type: "button", "aria-label": "Закрыть камеру", onClick: nxBack, children: n.jsx(NxI, { n: "close", s: 20 }) }),
          n.jsx("span", { children: `Добавляем ${NX_IN[meal]}` }),
          n.jsx("button", { type: "button", "aria-label": "Вспышка", children: n.jsx(NxI, { n: "flash", s: 20 }) }),
        ],
      }),
      n.jsxs("div", {
        className: "nx-aim",
        children: [n.jsx("i", { className: "nx-frame" }), n.jsx("p", { children: phase === "busy" ? (mode === "plate" ? "Ищем продукты на фото…" : "Читаем этикетку…") : md[2] })],
      }),
      found &&
        n.jsxs("div", {
          className: "nx-found",
          role: "status",
          children: [
            n.jsxs("div", {
              children: [n.jsx("small", { children: found.brand }), n.jsx("b", { children: found.name }), n.jsxs("span", { children: [nxN(found.per.k), " ккал в 100 г"] })],
            }),
            n.jsx("button", {
              type: "button",
              className: "nx-cta sm",
              onClick: () => {
                const p = found;
                setFound(null);
                N.update((s) => void (s.nxLayers = (s.nxLayers || []).filter((l) => l.k !== "camera")));
                nxOpen({ k: "portion", meal, prod: p });
              },
              children: "Выбрать",
            }),
            n.jsx("button", { type: "button", className: "nx-ic-btn", "aria-label": "Сканировать ещё раз", onClick: () => setFound(null), children: n.jsx(NxI, { n: "close", s: 16 }) }),
          ],
        }),
      n.jsxs("div", {
        className: "nx-cam-bottom",
        children: [
          n.jsx("div", {
            className: "nx-modes",
            role: "radiogroup",
            "aria-label": "Что снимаем",
            children: NX_MODES.map(([k, l]) =>
              n.jsx("button", { type: "button", role: "radio", "aria-checked": k === mode, onClick: () => (setFound(null), setMode(k)), children: l }, k),
            ),
          }),
          n.jsxs("div", {
            className: "nx-shoot",
            children: [
              n.jsx("button", { type: "button", className: "nx-gal", "aria-label": "Выбрать фото из галереи", onClick: () => !auto && shoot(), disabled: auto, children: n.jsx(NxI, { n: "image", s: 22 }) }),
              auto
                ? n.jsx("span", { className: "nx-scanning", children: "Ищем код…" })
                : n.jsx("button", { type: "button", className: `nx-shutter ${phase}`, "aria-label": "Снять", onClick: shoot, disabled: phase === "busy" }),
              n.jsx("span", { className: "nx-gal ghost" }),
            ],
          }),
        ],
      }),
    ],
  });
}
/* результат фото тарелки: каждый продукт можно поправить или убрать */
function NxPlate({ meal }) {
  const st = we(),
    [rows, setRows] = V.useState(() => NX_DEMO.plate.map((x, i) => ({ ...x, id: "pl" + i, on: !0 }))),
    on = rows.filter((r) => r.on),
    tot = on.reduce((a, r) => a + (r.per.k * r.g) / 100, 0),
    upd = (id, fn) => setRows((rs) => rs.map((r) => (r.id === id ? fn(r) : r)));
  return n.jsxs("div", {
    className: "nx-screen nx-plate",
    role: "dialog",
    "aria-label": "Что на фото",
    children: [
      n.jsxs("div", {
        className: "nx-bar",
        children: [
          n.jsx("button", { type: "button", className: "nx-ic-btn", "aria-label": "Переснять", onClick: nxBack, children: n.jsx(NxI, { n: "back" }) }),
          n.jsx("div", { className: "nx-title", children: n.jsx("h1", { children: "Вот что на фото" }) }),
          n.jsx("span", { className: "nx-ic-btn ghost" }),
        ],
      }),
      n.jsxs("div", {
        className: "nx-scroll",
        children: [
          n.jsx("div", { className: "nx-shot", children: n.jsx("img", { src: "assets/demo-meal.svg", alt: "Ваше фото" }) }),
          n.jsx("p", { className: "nx-note", children: "Проверьте вес — от него зависят калории. Лишнее снимите галочкой." }),
          n.jsx("div", {
            className: "nx-list",
            children: rows.map((r) =>
              n.jsxs(
                "div",
                {
                  className: `nx-pl-row ${r.on ? "" : "off"}`,
                  children: [
                    n.jsx("button", {
                      type: "button",
                      role: "checkbox",
                      "aria-checked": r.on,
                      "aria-label": r.name,
                      className: "nx-check",
                      onClick: () => upd(r.id, (x) => ({ ...x, on: !x.on })),
                      children: r.on && n.jsx(NxI, { n: "check", s: 16, w: 3 }),
                    }),
                    n.jsxs("span", { className: "nx-dish-l", children: [n.jsx("b", { children: r.name }), n.jsxs("span", { className: "nx-meta", children: [nxN((r.per.k * r.g) / 100), " ккал"] })] }),
                    n.jsxs("span", {
                      className: "nx-mini-w",
                      children: [
                        n.jsx("button", { type: "button", "aria-label": "Меньше", onClick: () => upd(r.id, (x) => ({ ...x, g: Math.max(10, x.g - 10) })), children: n.jsx(NxI, { n: "minus", s: 16 }) }),
                        n.jsxs("b", { children: [r.g, " г"] }),
                        n.jsx("button", { type: "button", "aria-label": "Больше", onClick: () => upd(r.id, (x) => ({ ...x, g: x.g + 10 })), children: n.jsx(NxI, { n: "plus", s: 16 }) }),
                      ],
                    }),
                  ],
                },
                r.id,
              ),
            ),
          }),
        ],
      }),
      n.jsx("div", {
        className: "nx-foot",
        children: n.jsx("button", {
          type: "button",
          className: "nx-cta",
          disabled: !on.length,
          onClick: () =>
            nxAddEntries(
              on.map((r) => nxEntry({ id: null, name: r.name, per: r.per }, r.g, meal, st.date, st.controls.clock)),
              meal,
              `${nxDishes(on.length)} — ${NX_IN[meal]}`,
            ),
          children: `Добавить ${nxDishes(on.length)} · ${nxN(tot)} ккал`,
        }),
      }),
    ],
  });
}

/* копирование приёма: куда и что */
function NxCopy({ meal }) {
  const st = we(),
    items = nxMealItems(st, meal).filter((e) => !e.recognizing && !e.recognizeError),
    from = st.date,
    [to, setTo] = V.useState(from === sl ? nxDate(sl, 1) : sl),
    [other, setOther] = V.useState(!1),
    [m, setM] = V.useState(meal),
    [off, setOff] = V.useState([]),
    pick = items.filter((e) => !off.includes(e.id)),
    quick = [nxDate(sl, -1), sl, nxDate(sl, 1)].filter((d) => d !== from),
    span = [...Array(21)].map((_, i) => nxDate(sl, i - 14)),
    same = to === from && m === meal;
  return n.jsx("div", {
    className: "nx-sheet-wrap",
    onClick: (v) => v.target === v.currentTarget && nxBack(),
    children: n.jsxs("div", {
      className: "nx-sheet",
      role: "dialog",
      "aria-label": `Скопировать ${meal.toLowerCase()}`,
      children: [
        n.jsxs("div", {
          className: "nx-sheet-h",
          children: [
            n.jsxs("div", { children: [n.jsx("h2", { children: `Скопировать ${meal.toLowerCase()}` }), n.jsxs("span", { children: [nxDayName(from), " · ", nxDishes(items.length)] })] }),
            n.jsx("button", { type: "button", className: "nx-ic-btn", "aria-label": "Закрыть", onClick: nxBack, children: n.jsx(NxI, { n: "close", s: 18 }) }),
          ],
        }),
        n.jsx("p", { className: "nx-label", children: "На какой день" }),
        n.jsxs("div", {
          className: "nx-chips big",
          children: [
            quick.map((d) => n.jsx("button", { type: "button", "aria-pressed": !other && d === to, onClick: () => (setOther(!1), setTo(d)), children: nxDayName(d).replace(/^./, (c) => c.toUpperCase()) }, d)),
            n.jsx("button", { type: "button", "aria-pressed": other, onClick: () => setOther(!0), children: other ? _p(to) : "Другой день" }),
          ],
        }),
        other &&
          n.jsx("div", {
            className: "nx-days",
            children: span.map((d) =>
              n.jsxs("button", { type: "button", "aria-pressed": d === to, onClick: () => setTo(d), children: [n.jsx("small", { children: NX_WD[(new Date(d + "T12:00:00").getDay() + 6) % 7] }), +d.slice(8)] }, d),
            ),
          }),
        n.jsx("p", { className: "nx-label", children: "В какой приём" }),
        n.jsx("div", {
          className: "nx-meals",
          role: "radiogroup",
          children: NX_MEALS.map((x) => n.jsx("button", { type: "button", role: "radio", "aria-checked": x === m, onClick: () => setM(x), children: x }, x)),
        }),
        n.jsx("p", { className: "nx-label", children: "Что копируем" }),
        n.jsx("div", {
          className: "nx-list",
          children: items.map((e) =>
            n.jsxs(
              "button",
              {
                type: "button",
                role: "checkbox",
                "aria-checked": !off.includes(e.id),
                className: "nx-pl-row",
                onClick: () => setOff((o) => (o.includes(e.id) ? o.filter((x) => x !== e.id) : [...o, e.id])),
                children: [
                  n.jsx("span", { className: "nx-check", children: !off.includes(e.id) && n.jsx(NxI, { n: "check", s: 16, w: 3 }) }),
                  n.jsxs("span", { className: "nx-dish-l", children: [n.jsx("b", { children: e.name }), n.jsxs("span", { className: "nx-meta", children: [nxN(e.grams), " г · ", nxN(e.value), " ккал"] })] }),
                ],
              },
              e.id,
            ),
          ),
        }),
        n.jsx("button", {
          type: "button",
          className: "nx-cta",
          disabled: !pick.length || same,
          onClick: () => {
            const list = pick.map((e) => ({ ...e, id: N.id(), date: to, meal: m, repeatedFrom: e.id }));
            nxAddEntries(list, m, `${nxDishes(list.length)} — ${NX_IN[m]}, ${nxDayName(to)}`);
          },
          children: same ? "Выберите другой день или приём" : `Скопировать ${nxDishes(pick.length)}`,
        }),
      ],
    }),
  });
}

/* карточка блюда из журнала: поправить вес, перенести, удалить */
function NxDishCard({ id }) {
  const st = we(),
    e = st.entries.find((x) => x.id === id);
  if (!e) return null;
  const per = e.per100 ? { k: e.per100.calories, p: e.per100.proteins, f: e.per100.fats, c: e.per100.carbs } : { k: (e.value / (e.grams || 100)) * 100, p: (e.proteins / (e.grams || 100)) * 100, f: (e.fats / (e.grams || 100)) * 100, c: (e.carbs / (e.grams || 100)) * 100 },
    save = (g, meal) =>
      N.update((s) => {
        const x = s.entries.find((y) => y.id === id);
        if (!x) return;
        const k = g / 100;
        Object.assign(x, { grams: g, meal, value: Math.round(per.k * k), proteins: Math.round(per.p * k * 10) / 10, fats: Math.round(per.f * k * 10) / 10, carbs: Math.round(per.c * k * 10) / 10 });
      });
  return n.jsx("div", {
    className: "nx-sheet-wrap",
    onClick: (v) => v.target === v.currentTarget && nxBack(),
    children: n.jsxs("div", {
      className: "nx-sheet",
      role: "dialog",
      "aria-label": e.name,
      children: [
        n.jsxs("div", {
          className: "nx-sheet-h",
          children: [
            n.jsxs("div", { children: [n.jsx("h2", { children: e.name }), n.jsxs("span", { children: [e.meal, " · ", e.time] })] }),
            n.jsx("button", { type: "button", className: "nx-ic-btn", "aria-label": "Закрыть", onClick: nxBack, children: n.jsx(NxI, { n: "close", s: 18 }) }),
          ],
        }),
        n.jsxs("div", { className: "nx-big", children: [n.jsx("b", { children: nxN(e.value) }), n.jsx("span", { children: "ккал" })] }),
        n.jsx(NxPFC, { p: e.proteins, f: e.fats, c: e.carbs }),
        n.jsxs("div", {
          className: "nx-weight",
          children: [
            n.jsx("button", { type: "button", "aria-label": "Меньше на 10 г", onClick: () => save(Math.max(5, (e.grams || 100) - 10), e.meal), children: n.jsx(NxI, { n: "minus" }) }),
            n.jsxs("label", { children: [n.jsx("input", { readOnly: !0, "aria-label": "Вес, г", value: e.grams || 100 }), n.jsx("span", { children: "г" })] }),
            n.jsx("button", { type: "button", "aria-label": "Больше на 10 г", onClick: () => save((e.grams || 100) + 10, e.meal), children: n.jsx(NxI, { n: "plus" }) }),
          ],
        }),
        n.jsx("p", { className: "nx-label", children: "Приём" }),
        n.jsx("div", {
          className: "nx-meals",
          role: "radiogroup",
          children: NX_MEALS.map((x) => n.jsx("button", { type: "button", role: "radio", "aria-checked": x === e.meal, onClick: () => save(e.grams || 100, x), children: x }, x)),
        }),
        n.jsxs("button", { type: "button", className: "nx-danger", onClick: () => nxDelete(e), children: [n.jsx(NxI, { n: "trash", s: 20 }), "Удалить из журнала"] }),
      ],
    }),
  });
}

/* ---------- корень ---------- */
function NxLayer({ l }) {
  return l.k === "add"
    ? n.jsx(NxAdd, { meal: l.meal })
    : l.k === "portion"
      ? n.jsx(NxPortion, { meal: l.meal, prod: l.prod })
      : l.k === "manual"
        ? n.jsx(NxManual, { meal: l.meal, name: l.name, per: l.per })
        : l.k === "camera"
          ? n.jsx(NxCamera, { meal: l.meal })
          : l.k === "plate"
            ? n.jsx(NxPlate, { meal: l.meal })
            : l.k === "copy"
              ? n.jsx(NxCopy, { meal: l.meal })
              : l.k === "dish"
                ? n.jsx(NxDishCard, { id: l.id })
                : null;
}
function NxApp() {
  const st = we(),
    v = nxVar(st),
    layers = st.nxLayers || [];
  V.useEffect(() => () => N.update((s) => void (s.nxLayers = [])), []);
  return n.jsxs("div", {
    className: `nx nx-v-${v}`,
    children: [
      n.jsxs("div", {
        className: "nx-page",
        children: [
          n.jsx(NxTop, {}),
          n.jsx(La, {
            children: n.jsxs("div", {
              className: "nx-scroll main",
              children: [n.jsx(NxSummary, {}), v === "a" ? n.jsx(NxTiles, {}) : v === "b" ? n.jsx(NxFeed, {}) : n.jsx(NxCarousel, {})],
            }),
          }),
        ],
      }),
      layers.map((l, i) => n.jsx(NxLayer, { l }, i + l.k)),
      st.nxSnack &&
        n.jsxs("div", {
          className: "nx-snack",
          role: "status",
          children: [n.jsx("span", { children: st.nxSnack.text }), n.jsx("button", { type: "button", onClick: nxUndo, children: "Отменить" })],
        }),
    ],
  });
}
