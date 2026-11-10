/* =====================================================================
 * Добавление блюда, итерация 3 (plan.md, 2026-11-10).
 * 1) «Что добавляем?» — шторка выбора приёма: Drawer modal (16982:333490)
 *    + строки SelectionCard (31967:295707). Не показывается, если приём уже
 *    задан (со страницы приёма).
 * Итерация 5 (визуал): мягкий градиентный фон, белые карточки, камера — круглая
 * кнопка Blue/100 на уровне поля поиска (реф. MacroFactor, Lovi), «Избранное» и
 * «Ввести вручную» — строки-переходы в одной карточке (реф. Jomo); нижняя панель
 * [Food] Button_Add убрана. Не из DS: круглая кнопка камеры, иконки в плашках.
 * Итерация 4: общий поиск по каталогу и избранному, строка «Избранное · N ›»
 * (Cell 1966:47361) → экран «Избранное» с поиском по нему, алфавитными группами
 * и указателем букв (не из DS); «Недавние» ≤ 5.
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

/* 2. экран приёма: общий поиск (каталог + избранное), «Избранное · N ›», «Недавние» ≤ 5 */
var MA_RECENT_LIMIT = 5;
function maSearchAll(st, qq) {
  const saved = (p) => p.own || st.favorites.includes(p.id);
  return maUnique([...maFavorites(st), ...st.products, ...maRecent(st)])
    .filter((p) => p.name.toLowerCase().includes(qq))
    .sort((a, b) => (saved(a) ? 0 : 1) - (saved(b) ? 0 : 1) || a.name.localeCompare(b.name, "ru"));
}
function MaSearchField({ value, onChange, placeholder, camera }) {
  const field = n.jsxs("label", {
    className: "ma-search",
    children: [
      n.jsx(Q, { name: "search", size: 24 }),
      n.jsx("input", { "aria-label": placeholder, placeholder, value, onChange: (e) => onChange(e.target.value) }),
      value &&
        n.jsx("button", {
          type: "button",
          "aria-label": "Очистить поиск",
          onPointerDown: (e) => e.preventDefault(),
          onClick: () => onChange(""),
          children: n.jsx(Q, { name: "clear-circle", size: 20 }),
        }),
    ],
  });
  return camera
    ? n.jsxs("div", {
        className: "ma-search-row",
        children: [
          field,
          n.jsx("button", {
            type: "button",
            className: "ma-cam",
            "aria-label": "Распознать по фото",
            onClick: () => (mfHideKeyboard(), N.sheet("camera", { target: "meal" })),
            children: n.jsx(Q, { name: "icon.food.camera", size: 24 }),
          }),
        ],
      })
    : field;
}
function MealAddScreen() {
  const st = we(),
    chosen = st.mealDraftType,
    type = chosen || st.lastMealType || "Завтрак",
    saved = (p) => p.own || st.favorites.includes(p.id),
    favs = maFavorites(st),
    recent = maRecent(st).slice(0, MA_RECENT_LIMIT),
    [choose, setChoose] = V.useState(!chosen),
    [q, setQ] = V.useState(""),
    qq = q.trim().toLowerCase(),
    results = qq ? maSearchAll(st, qq) : null,
    view = st.controls.view,
    variant = st.controls.addVariant ?? "sheet";
  /* скрыть рамку фокуса, когда клавиатуру закрыли кнопкой «Готово» */
  V.useEffect(() => {
    !st.controls.keyboard && document.activeElement?.closest?.(".ma-page") && document.activeElement.blur();
  }, [st.controls.keyboard]);
  const ctx = {
    st, type, saved, favs, recent, q, setQ, results, view,
    openChooser: () => (mfHideKeyboard(), setChoose(!0)),
    chooser:
      choose &&
      n.jsx(MaChooser, {
        current: chosen || st.lastMealType,
        onPick: (t) => (maSetType(t), setChoose(!1)),
        onClose: () => (chosen ? setChoose(!1) : N.back()),
      }),
  };
  if (variant !== "main") return n.jsx(MaVariant, { variant, ctx });
  /* «Поле + камера»: рамка как «Мои блюда» (MvFrameHead + неподвижная шторка),
     камера — кнопка справа от поиска; ниже ссылки «Избранное», «Ввести вручную» и «Недавние». */
  const link = (icon, title, sub, onClick) =>
    n.jsxs("button", {
      type: "button",
      className: "ma-link",
      onClick: () => (mfHideKeyboard(), onClick()),
      children: [
        n.jsx("span", { className: "ma-link-icon", children: n.jsx(Q, { name: icon, size: 20 }) }),
        n.jsxs("span", {
          className: "ma-link-copy",
          children: [n.jsx($, { token: "answer1L", children: title }), n.jsx($, { token: "number3M", className: "ms-muted", children: sub })],
        }),
        n.jsx(Q, { name: "chevron", size: 16 }),
      ],
    });
  return n.jsxs("div", {
    className: "native-diary-page mv-sheet-page ma-main-page",
    children: [
      n.jsx(MvFrameHead, { title: "Добавить блюдо", sub: MV_ON[type] || type, subLabel: `Приём пищи: ${type}. Сменить`, onSub: ctx.openChooser }),
      n.jsxs("div", {
        className: "native-catalog-surface mv-sheet",
        children: [
          n.jsx("div", { className: "mv-sheet-search", children: n.jsx(MaSearchField, { value: q, onChange: setQ, placeholder: "Найти блюдо или продукт", camera: !0 }) }),
          n.jsx("div", {
            className: "scroll ma-list mv-sheet-list",
            children: n.jsx(MvBody, {
              ctx,
              children: n.jsxs(n.Fragment, {
                children: [
                  n.jsxs("div", {
                    className: "ma-links",
                    children: [
                      link("heart-fill", "Избранное", favs.length ? mvCount(favs.length) : "пока пусто", () => N.go("nutrition-favorites")),
                      link("icon.food.add_manual", "Ввести вручную", "название, калории и БЖУ", () => N.sheet("entry", { kind: "meal" })),
                    ],
                  }),
                  n.jsx(MvRecent, { ctx }),
                ],
              }),
            }),
          }),
        ],
      }),
      ctx.chooser,
    ],
  });
}

/* 3. экран «Избранное»: свой поиск, алфавитные группы, указатель букв (не из DS) при > 15 блюдах */
function MealFavoritesScreen() {
  const st = we(),
    [q, setQ] = V.useState(""),
    scroller = V.useRef(null),
    qq = q.trim().toLowerCase(),
    all = [...maFavorites(st)].sort((a, b) => a.name.localeCompare(b.name, "ru")),
    list = qq ? all.filter((p) => p.name.toLowerCase().includes(qq)) : all,
    groups = [],
    letterOf = (p) => p.name[0].toUpperCase();
  list.forEach((p) => {
    const l = letterOf(p);
    (groups.at(-1)?.l === l ? groups.at(-1).items : (groups.push({ l, items: [] }), groups.at(-1).items)).push(p);
  });
  const index = !qq && all.length > 15,
    jump = (l) => {
      const el = scroller.current?.querySelector(`[data-letter="${l}"]`);
      el && (scroller.current.scrollTop = el.offsetTop - scroller.current.offsetTop);
    };
  /* рамка как «Мои блюда» (скриншот владельца): градиент, «‹» в белом квадрате, белая шторка */
  return n.jsxs("div", {
    className: "native-diary-page mv-sheet-page ma-fav-page",
    children: [
      n.jsx(MvFrameHead, { title: "Избранное", sub: all.length ? mvCount(all.length) : "", back: !0 }),
      n.jsxs("div", {
        className: "native-catalog-surface mv-sheet",
        children: [
      all.length > 0 && n.jsx("div", { className: "mv-sheet-search", children: n.jsx(MaSearchField, { value: q, onChange: setQ, placeholder: "Найти блюдо по названию" }) }),
      n.jsxs("div", {
        className: "ma-fav-body",
        children: [
          n.jsx("div", {
            ref: scroller,
            className: `scroll ma-list ${index ? "with-index" : ""}`,
            children: !all.length
              ? n.jsx(MaEmpty, MA_EMPTY.favorites)
              : !list.length
                ? n.jsx(MaEmpty, { image: "image.food.not_found", title: "Ничего не найдено", text: "В избранном нет подходящих блюд. Попробуйте найти в каталоге." })
                : !index
                  ? n.jsx(MaList, { items: list, saved: () => !0 })
                  : groups.map((g) =>
                    n.jsxs(
                      "section",
                      {
                        "data-letter": g.l,
                        className: "ma-group",
                        children: [
                          n.jsx($, { as: "h3", token: "capsSign", className: "ma-caption", children: g.l }),
                          n.jsx(MaList, { items: g.items, saved: () => !0 }),
                        ],
                      },
                      g.l,
                    ),
                  ),
          }),
          index &&
            n.jsx("nav", {
              className: "ma-index",
              "aria-label": "Буквы",
              children: groups.map((g) => n.jsx("button", { type: "button", onClick: () => jump(g.l), children: g.l }, g.l)),
            }),
        ],
      }),
        ],
      }),
    ],
  });
}
