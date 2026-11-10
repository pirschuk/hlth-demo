/* =====================================================================
 * Экран «Добавить блюдо» — добавление ОДНОГО блюда в выбранный приём пищи.
 * План: plan.md «добавление блюда» (2026-11-10). Компоненты DS (Figma
 * «ЗОЖ приложение (2026)», KZWzsMm3PXxyLlRxq9Qv8Q):
 *   [Food] Header (22926:116978)               — «×» и заголовок;
 *   Chip ×4 (23309:291289)                     — тип приёма, одно касание;
 *   Search (19318:278360)                      — поиск по каталогу и избранному;
 *   SegmentedControl (23461:360783)            — «Избранное · N / Недавние»;
 *   [-Meal Card] meal image card (22113:138305) — плитки блюд (градиент; избранное —
 *                                                иллюстрация и ♥); касание = добавить;
 *   [Inner page sceleton] - card (9859:105512)  — загрузка;
 *   [-Статистика] Error page (7344:83983)       — ошибка каталога;
 *   [Food] Button_Add (23368:130470), 2 плитки  — «Добавить вручную», «Распознать по фото».
 * Не из DS: строка «ккал · г» на плитке, галочка-подтверждение после касания.
 *
 * Тип приёма от времени не зависит: со страницы приёма — этот приём,
 * иначе последний выбранный (state.lastMealType), при первом запуске «Завтрак».
 * Поиск на «Избранном» — только по избранному, иначе по каталогу,
 * избранному и недавним (избранные первыми).
 * ===================================================================== */

function maType(s) {
  return s.mealDraftType || s.lastMealType || "Завтрак";
}
function maSetType(type) {
  N.update((s) => {
    (s.mealDraftType = type), (s.lastMealType = type);
  });
}
function maRecent(s) {
  const seen = new Set(),
    out = [];
  [...s.entries]
    .filter((e) => e.kind === "meal" && !e.recognizing && !e.recognizeError && e.provider !== "apple")
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .forEach((e) => {
      const key = e.name.toLowerCase();
      if (seen.has(key) || out.length >= 12) return;
      seen.add(key);
      const g = e.grams || 100,
        per = e.per100 || {
          calories: (e.value * 100) / g,
          proteins: ((e.proteins || 0) * 100) / g,
          fats: ((e.fats || 0) * 100) / g,
          carbs: ((e.carbs || 0) * 100) / g,
        },
        known = s.products.find((p) => p.id === e.productId || p.name.toLowerCase() === key);
      out.push(known ? { ...known, portion: g } : { id: e.productId || `recent-${key}`, name: e.name, ...per, portion: g });
    });
  return out;
}
function maFavorites(s) {
  return s.products.filter((p) => p.own || s.favorites.includes(p.id));
}
function maUnique(list) {
  return list.filter((p, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === p.name.toLowerCase()) === i);
}
function maKcal(p) {
  return Math.round((p.calories * (p.portion || 100)) / 100);
}

/* добавить одно блюдо с порцией по умолчанию и вернуться к приёму */
function maAddOne(p, type) {
  const g = p.portion || 100,
    k = g / 100,
    r1 = (v) => Math.round(v * 10) / 10;
  mfHideKeyboard();
  N.update((s) => {
    s.entries.push({
      id: N.id(),
      kind: "meal",
      name: p.name,
      date: s.mealDraftDate || s.date,
      time: s.mealDraftTime || s.controls.clock,
      meal: type,
      provider: "manual",
      productId: p.id,
      grams: g,
      unit: "г",
      value: Math.round(p.calories * k),
      proteins: r1((p.proteins || 0) * k),
      fats: r1((p.fats || 0) * k),
      carbs: r1((p.carbs || 0) * k),
      per100: { calories: p.calories, proteins: p.proteins || 0, fats: p.fats || 0, carbs: p.carbs || 0 },
    });
    s.lastMealType = type;
    const page = s.stacks.stats.indexOf(MP_PREFIX + type);
    s.tab = "stats";
    s.stacks.stats =
      page >= 0
        ? s.stacks.stats.slice(0, page + 1)
        : mpVariant(s) === "blocks"
          ? ["stats", "detail-meal", MP_PREFIX + type]
          : ["stats", "detail-meal"];
    s.mealDraftType = s.mealDraftDate = s.mealDraftTime = null;
    s.toast = s.toastPill = `Добавлено в ${type.toLowerCase()}: ${p.name}`;
    s.toastIcon = "toast.check-circle";
  });
}

var MA_EMPTY = {
  search: { image: "image.food.not_found", title: "Ничего не найдено", text: "Распознайте блюдо по фото или добавьте вручную." },
  searchFav: { image: "image.food.not_found", title: "Ничего не найдено", text: "Среди ваших сохранённых блюд нет подходящих результатов." },
  favorites: {
    image: "food.favorites.empty",
    title: "Здесь появятся ваши блюда",
    text: "Сохраняйте блюда из карточки просмотра — они будут храниться здесь.",
  },
  recent: { image: "food.favorites.empty", title: "Здесь появятся последние блюда", text: "Добавленные блюда можно будет выбрать здесь повторно." },
};

function MaSkeleton() {
  return n.jsx("div", {
    className: "ma-grid",
    "aria-label": "Загрузка",
    children: [1, 2, 3, 4].map((i) => n.jsxs("div", { className: "ma-card-skeleton", children: [n.jsx("i", {}), n.jsx("b", {}), n.jsx("b", {})] }, i)),
  });
}
function MaError() {
  return n.jsxs("div", {
    className: "ma-error",
    role: "alert",
    children: [
      n.jsx("span", { className: "ma-error-icon", children: n.jsx(Q, { name: "ic.warning.selected", size: 24 }) }),
      n.jsx($, { as: "h3", token: "answer1L", children: "Не загрузилось" }),
      n.jsx($, { as: "p", token: "assastiveTextM", className: "ms-muted", children: "Попробуйте обновить страницу, иногда это помогает" }),
      n.jsx(re, {
        secondary: !0,
        className: "ma-error-btn",
        onClick: () =>
          N.run("refresh", (s) => {
            s.controls.view = "content";
          }),
        children: "Обновить",
      }),
    ],
  });
}

function MealAddScreen() {
  const st = we(),
    type = maType(st),
    saved = (p) => p.own || st.favorites.includes(p.id),
    favs = maFavorites(st),
    [q, setQ] = V.useState(""),
    [tab, setTab] = V.useState(() => (favs.length ? "favorites" : "recent")),
    [done, setDone] = V.useState(null),
    qq = q.trim().toLowerCase(),
    list = qq
      ? (tab === "favorites" ? favs : maUnique([...favs, ...maRecent(st), ...st.products]))
          .filter((p) => p.name.toLowerCase().includes(qq))
          .sort((a, b) => (saved(a) ? 0 : 1) - (saved(b) ? 0 : 1))
      : tab === "favorites"
        ? favs
        : maRecent(st),
    empty = MA_EMPTY[qq ? (tab === "favorites" ? "searchFav" : "search") : tab],
    keyboard = st.controls.keyboard,
    view = st.controls.view,
    tap = (p) => {
      mfHideKeyboard(), setDone(p.name), setTimeout(() => maAddOne(p, type), 420);
    };
  return n.jsxs("div", {
    className: "ma-page",
    children: [
      /* [Food] Header */
      n.jsxs("header", {
        className: "ma-header",
        children: [
          n.jsx(MfIconButton, { label: "Закрыть", icon: "close", size: 16, onClick: () => (mfHideKeyboard(), N.back()) }),
          n.jsx($, { as: "h1", token: "answer1L", children: "Добавить блюдо" }),
          n.jsx("span", {}),
        ],
      }),
      /* Chip ×4 — тип приёма */
      n.jsx("div", {
        className: "mf-type-chips ma-chips",
        role: "radiogroup",
        "aria-label": "Приём пищи",
        children: MF_TYPES.map((t) => n.jsx("button", { type: "button", role: "radio", "aria-checked": t === type, onClick: () => maSetType(t), children: t }, t)),
      }),
      /* Search */
      n.jsxs("label", {
        className: "ma-search",
        children: [
          n.jsx(Q, { name: "search", size: 24 }),
          n.jsx("input", {
            "aria-label": tab === "favorites" ? "Найти в избранном" : "Найти блюдо или продукт",
            placeholder: tab === "favorites" ? "Найти в избранном" : "Найти блюдо или продукт",
            value: q,
            onChange: (e) => setQ(e.target.value),
          }),
          q &&
            n.jsx("button", {
              type: "button",
              "aria-label": "Очистить поиск",
              onPointerDown: (e) => e.preventDefault(),
              onClick: () => setQ(""),
              children: n.jsx(Q, { name: "clear-circle", size: 20 }),
            }),
        ],
      }),
      /* SegmentedControl */
      n.jsx("div", {
        className: "mf-seg ma-seg",
        role: "radiogroup",
        "aria-label": "Подборка блюд",
        children: [
          ["favorites", `Избранное${favs.length ? " · " + favs.length : ""}`],
          ["recent", "Недавние"],
        ].map(([v, l]) => n.jsx("button", { type: "button", role: "radio", "aria-checked": tab === v, onClick: () => setTab(v), children: l }, v)),
      }),
      /* [-Meal Card] плитки */
      n.jsx("div", {
        className: "scroll ma-list",
        children:
          view === "loading"
            ? n.jsx(MaSkeleton, {})
            : view === "error"
              ? n.jsx(MaError, {})
              : list.length
                ? n.jsx("div", {
                    className: "ma-grid",
                    children: list.map((p) => {
                      const fav = saved(p),
                        isDone = done === p.name;
                      return n.jsxs(
                        "button",
                        {
                          type: "button",
                          className: `ma-meal-card ${fav ? "fav" : ""} ${isDone ? "done" : ""}`,
                          "aria-label": `Добавить «${p.name}» в ${type.toLowerCase()}, ${maKcal(p)} ккал`,
                          disabled: !!done,
                          onClick: () => tap(p),
                          children: [
                            n.jsx("span", {
                              className: "ma-meal-card-icon",
                              children: isDone
                                ? n.jsx("span", { className: "ma-check", "aria-hidden": "true", children: "✓" })
                                : n.jsx(Q, { name: fav ? "food-heart" : "icon.food.fork_knife", size: 20 }),
                            }),
                            n.jsx($, { token: "answer1L", className: "ma-meal-card-name", children: p.name }),
                            n.jsxs($, { token: "number3M", className: "ma-meal-card-meta", children: [rt(maKcal(p)), " ккал · ", rt(p.portion || 100), " г"] }),
                          ],
                        },
                        p.id + p.name,
                      );
                    }),
                  })
                : n.jsxs("div", {
                    className: "native-catalog-empty ma-empty",
                    children: [
                      n.jsx(Q, { name: empty.image, size: 120 }),
                      n.jsx("h3", { children: empty.title }),
                      n.jsx("p", { children: empty.text }),
                      qq &&
                        n.jsx(re, {
                          secondary: !0,
                          className: "ma-empty-btn",
                          onClick: () => N.sheet("entry", { kind: "meal", name: q.trim() }),
                          children: "Добавить вручную",
                        }),
                    ],
                  }),
      }),
      /* [Food] Button_Add, 2 плитки */
      !keyboard &&
        n.jsx("div", {
          className: "ma-methods",
          children: [
            ["icon.food.add_manual", "Добавить вручную", () => N.sheet("entry", { kind: "meal" })],
            ["icon.food.camera", "Распознать по фото", () => N.sheet("camera", { target: "meal" })],
          ].map(([icon, label, f]) =>
            n.jsxs(
              "button",
              {
                type: "button",
                onClick: () => (mfHideKeyboard(), N.update((s) => void (s.mealDraftType = type)), f()),
                children: [n.jsx(Q, { name: icon, size: 20 }), n.jsx("span", { children: label })],
              },
              label,
            ),
          ),
        }),
    ],
  });
}
