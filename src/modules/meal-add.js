/* =====================================================================
 * Добавление блюда, итерация 3 (plan.md, 2026-11-10).
 * 1) «Что добавляем?» — шторка выбора приёма: Drawer modal (16982:333490)
 *    + строки SelectionCard (31967:295707). Не показывается, если приём уже
 *    задан (со страницы приёма).
 * 2) Экран приёма «Обед ▾»: [Food] Header (22926:116978) с названием приёма
 *    (касание — сменить), поле Search (19318:278360): пусто — свои блюда,
 *    ввод — результаты каталога с подписью «КАТАЛОГ» (реф. BitePal),
 *    SegmentedControl (23461:360783) «Избранное · N / Недавние»,
 *    [-My food] -list (21433:257994) со скелетоном, [-Статистика] Error page
 *    (7344:83983), [Food] Button_Add (23368:130470) ×2.
 * Касание блюда → карточка блюда (порция) → добавление в выбранный приём.
 * Тип приёма от времени не зависит. Не из DS: — (иконок приёмов в DS нет,
 * в шторке только названия).
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

var MA_EMPTY = {
  favorites: {
    image: "food.favorites.empty",
    title: "Здесь появятся ваши блюда",
    text: "Сохраняйте блюда из карточки просмотра — они будут храниться здесь и помогут быстрее добавлять приёмы пищи.",
  },
  recent: { image: "food.favorites.empty", title: "Здесь появятся последние блюда", text: "Добавленные блюда можно будет выбрать здесь повторно." },
};

/* строка [-My food] -list */
function MaRow({ product: g, saved }) {
  const grams = g.portion || 100,
    k = grams / 100;
  return n.jsxs("button", {
    className: "native-product-row",
    onClick: () => (mfHideKeyboard(), N.sheet("product", { product: g, from: saved && g.own ? "own" : "search" })),
    children: [
      n.jsx(Q, { name: saved ? "food-heart" : "food-fork", size: 24 }),
      n.jsxs("span", {
        className: "product-row-copy",
        children: [
          n.jsx($, { as: "strong", token: "assastiveTextL", children: g.name }),
          n.jsxs("span", {
            className: "product-row-macros",
            children: [
              n.jsxs($, { token: "number3M", children: [rt(maKcal(g)), " ккал · ", rt(Math.round(grams)), " г"] }),
              ["proteins", "fats", "carbs"].map((w, G) =>
                n.jsxs(
                  "span",
                  {
                    children: [
                      n.jsx("i", { style: { background: ["#5A4FF5", "#9245F0", "#F17C59"][G] } }),
                      n.jsxs($, { token: "number3M", children: [rt(Math.round((g[w] || 0) * k * 10) / 10), " г"] }),
                    ],
                  },
                  w,
                ),
              ),
            ],
          }),
        ],
      }),
    ],
  });
}
function MaList({ items, saved }) {
  return n.jsx("div", {
    className: "native-results-card",
    children: items.map((p) => n.jsx(MaRow, { product: p, saved: saved(p) }, p.id + p.name)),
  });
}
function MaSkeleton() {
  return n.jsx("div", {
    className: "native-results-card ma-skeleton",
    "aria-label": "Загрузка",
    children: [1, 2, 3, 4, 5].map((i) => n.jsxs("div", { children: [n.jsx("i", {}), n.jsx("b", {}), n.jsx("b", {})] }, i)),
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
function MaEmpty({ image, title, text, action }) {
  return n.jsxs("div", {
    className: "native-catalog-empty ma-empty",
    children: [n.jsx(Q, { name: image, size: 140 }), n.jsx("h3", { children: title }), n.jsx("p", { children: text }), action],
  });
}

/* 1. «Что добавляем?» — Drawer modal + SelectionCard */
function MaChooser({ current, onPick, onClose }) {
  return n.jsx("div", {
    className: "mf-sheet-backdrop",
    onClick: onClose,
    children: n.jsxs("section", {
      className: "mf-sheet ma-chooser",
      role: "dialog",
      "aria-label": "Что добавляем?",
      onClick: (e) => e.stopPropagation(),
      children: [
        n.jsx("button", { className: "mf-sheet-close", "aria-label": "Закрыть", onClick: onClose, children: n.jsx(Q, { name: "close", size: 18 }) }),
        n.jsx($, { as: "h2", token: "headline2", children: "Что добавляем?" }),
        n.jsx("div", {
          className: "ma-choices",
          role: "radiogroup",
          "aria-label": "Приём пищи",
          children: MF_TYPES.map((t) =>
            n.jsxs(
              "button",
              {
                type: "button",
                role: "radio",
                "aria-checked": t === current,
                className: "ma-choice",
                onClick: () => onPick(t),
                children: [n.jsx("i", { "aria-hidden": "true" }), n.jsx($, { token: "answer1L", children: t })],
              },
              t,
            ),
          ),
        }),
      ],
    }),
  });
}

/* 2. экран приёма: одно поле — пусто: свои блюда, ввод: каталог (реф. BitePal) */
function MealAddScreen() {
  const st = we(),
    chosen = st.mealDraftType,
    type = chosen || st.lastMealType || "Завтрак",
    saved = (p) => p.own || st.favorites.includes(p.id),
    favs = maFavorites(st),
    [tab, setTab] = V.useState(() => (favs.length ? "favorites" : "recent")),
    [choose, setChoose] = V.useState(!chosen),
    [q, setQ] = V.useState(""),
    qq = q.trim().toLowerCase(),
    results = qq
      ? maUnique([...st.products, ...favs, ...maRecent(st)])
          .filter((p) => p.name.toLowerCase().includes(qq))
          .sort((a, b) => (saved(a) ? 0 : 1) - (saved(b) ? 0 : 1))
      : null,
    list = tab === "favorites" ? favs : maRecent(st),
    view = st.controls.view,
    keyboard = st.controls.keyboard;
  return n.jsxs("div", {
    className: "ma-page",
    children: [
      n.jsxs("header", {
        className: "ma-header",
        children: [
          n.jsx(MfIconButton, { label: "Закрыть", icon: "close", size: 16, onClick: () => (mfHideKeyboard(), N.back()) }),
          n.jsxs("button", {
            type: "button",
            className: "ma-title",
            "aria-label": `Приём пищи: ${type}. Сменить`,
            onClick: () => (mfHideKeyboard(), setChoose(!0)),
            children: [n.jsx($, { as: "h1", token: "headline2", children: type }), n.jsx(Q, { name: "icon.chevron.down", size: 14 })],
          }),
          n.jsx("span", {}),
        ],
      }),
      n.jsxs("label", {
        className: "ma-search",
        children: [
          n.jsx(Q, { name: "search", size: 24 }),
          n.jsx("input", {
            "aria-label": "Найти блюдо или продукт",
            placeholder: "Найти блюдо или продукт",
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
      results
        ? n.jsx($, { as: "h3", token: "capsSign", className: "ma-caption", children: "КАТАЛОГ" })
        : n.jsx("div", {
            className: "mf-seg ma-seg",
            role: "radiogroup",
            "aria-label": "Мои блюда",
            children: [
              ["favorites", `Избранное${favs.length ? " · " + favs.length : ""}`],
              ["recent", "Недавние"],
            ].map(([v, l]) => n.jsx("button", { type: "button", role: "radio", "aria-checked": tab === v, onClick: () => setTab(v), children: l }, v)),
          }),
      n.jsx("div", {
        className: "scroll ma-list",
        children:
          view === "loading"
            ? n.jsx(MaSkeleton, {})
            : view === "error"
              ? n.jsx(MaError, {})
              : results
                ? results.length
                  ? n.jsx(MaList, { items: results, saved })
                  : n.jsx(MaEmpty, {
                      image: "image.food.not_found",
                      title: "Ничего не найдено",
                      text: "В каталоге нет подходящих блюд.",
                      action: n.jsx(re, {
                        secondary: !0,
                        className: "ma-empty-btn",
                        onClick: () => (mfHideKeyboard(), N.sheet("entry", { kind: "meal", name: q.trim() })),
                        children: "Добавить вручную",
                      }),
                    })
                : list.length
                  ? n.jsx(MaList, { items: list, saved })
                  : n.jsx(MaEmpty, MA_EMPTY[tab]),
      }),
      !keyboard &&
        n.jsx("div", {
          className: "ma-methods",
          children: [
            ["icon.food.add_manual", "Добавить вручную", () => N.sheet("entry", { kind: "meal" })],
            ["icon.food.camera", "Распознать по фото", () => N.sheet("camera", { target: "meal" })],
          ].map(([icon, label, f]) => n.jsxs("button", { type: "button", onClick: f, children: [n.jsx(Q, { name: icon, size: 20 }), n.jsx("span", { children: label })] }, label)),
        }),
      choose &&
        n.jsx(MaChooser, {
          current: chosen || st.lastMealType,
          onPick: (t) => (maSetType(t), setChoose(!1)),
          onClose: () => (chosen ? setChoose(!1) : N.back()),
        }),
    ],
  });
}
