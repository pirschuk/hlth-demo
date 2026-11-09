/* =====================================================================
 * Экран «Добавить приём пищи» — добавление одного блюда в выбранный приём.
 * Только компоненты DS (Figma «ЗОЖ приложение (2026)»):
 *   [Food] Header (22926:116978)     — «×» слева; в центре — элемент типа
 *                                      и времени приёма из HAR-710 (шторка
 *                                      MfTypeSheet: тип + барабан);
 *   Search (19318:278360)            — поиск;
 *   SegmentedControl (23461:360783)  — «Недавние / Избранное»;
 *   [-My food] -list (21433:257994)  — строки блюд, скелетон загрузки;
 *   [Food] Button_Add (23368:130470) — три плитки внизу: «Добавить
 *                                      вручную», «Распознать по фото»,
 *                                      «Фото из галереи».
 *
 * Поиск: на «Недавних» — по всем блюдам (избранные первыми), на
 * «Избранном» — только по избранному.
 * Тип, дата и время хранятся в state.mealDraft* и подставляются в карточку
 * блюда, ручной ввод и распознавание по фото. Предустановка — со страницы
 * приёма (mpAddTo), иначе по времени суток.
 * ===================================================================== */

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
              n.jsxs($, { token: "number3M", children: [rt(Math.round(g.calories * k)), " ккал · ", rt(Math.round(grams)), " г"] }),
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

var MA_EMPTY = {
  search: { image: "image.food.not_found", title: "Ничего не найдено", text: "Среди блюд нет подходящих результатов. Добавьте блюдо вручную." },
  searchFav: { image: "image.food.not_found", title: "Ничего не найдено", text: "Среди ваших сохранённых блюд нет подходящих результатов." },
  recent: { image: "food.favorites.empty", title: "Здесь появятся последние блюда", text: "Добавленные блюда можно будет выбрать здесь повторно." },
  favorites: {
    image: "food.favorites.empty",
    title: "Здесь появятся ваши блюда",
    text: "Сохраняйте блюда из карточки просмотра — они будут храниться здесь и помогут быстрее добавлять приёмы пищи.",
  },
};

function MealAddScreen() {
  const st = we(),
    [query, setQuery] = V.useState(""),
    [tab, setTab] = V.useState("recent"),
    [typeSheet, setTypeSheet] = V.useState(!1),
    when = {
      type: st.mealDraftType || mfGuessType(st.controls.clock),
      date: st.mealDraftDate || st.date,
      time: st.mealDraftTime || st.controls.clock,
    },
    dayLabel = mfDayLabel(when.date, sl),
    saved = (p) => p.own || st.favorites.includes(p.id),
    favs = maFavorites(st),
    q = query.trim().toLowerCase(),
    list = q
      ? (tab === "favorites" ? favs : maUnique([...favs, ...maRecent(st), ...st.products]))
          .filter((p) => p.name.toLowerCase().includes(q))
          .sort((a, b) => (saved(a) ? 0 : 1) - (saved(b) ? 0 : 1))
      : tab === "recent"
        ? maRecent(st)
        : favs,
    empty = MA_EMPTY[q ? (tab === "favorites" ? "searchFav" : "search") : tab],
    keyboard = st.controls.keyboard;

  return n.jsxs("div", {
    className: `ma-page ${keyboard ? "with-keyboard" : ""}`,
    children: [
      /* [Food] Header + тип и время приёма (HAR-710) */
      n.jsxs("header", {
        className: "mf-header ma-header",
        children: [
          n.jsx(MfIconButton, { label: "Закрыть", icon: "close", size: 16, onClick: () => (mfHideKeyboard(), N.back()) }),
          n.jsxs("button", {
            type: "button",
            className: "mf-type",
            "aria-label": `Приём пищи: ${when.type}, ${dayLabel}, ${when.time}. Изменить`,
            onClick: () => (mfHideKeyboard(), setTypeSheet(!0)),
            children: [
              n.jsxs("span", {
                className: "mf-type-main",
                children: [
                  n.jsx(Q, { name: "icon.food.fork_knife", size: 20 }),
                  n.jsx($, { token: "assastiveTextL", children: when.type }),
                  n.jsx(Q, { name: "icon.chevron.down", size: 12 }),
                ],
              }),
              n.jsx($, { token: "number3M", className: "mf-type-sub", children: `${dayLabel}, ${when.time}` }),
            ],
          }),
          n.jsx("span", {}),
        ],
      }),

      /* Search */
      n.jsxs("label", {
        className: "ma-search",
        children: [
          n.jsx(Q, { name: "search", size: 24 }),
          n.jsx("input", {
            "aria-label": tab === "favorites" ? "Поиск в избранном" : "Поиск блюда или продукта",
            placeholder: tab === "favorites" ? "Найти в избранном" : "Найти блюдо или продукт",
            value: query,
            onChange: (e) => setQuery(e.target.value),
          }),
          query &&
            n.jsx("button", {
              type: "button",
              "aria-label": "Очистить поиск",
              onPointerDown: (e) => e.preventDefault(),
              onClick: () => setQuery(""),
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
          ["recent", "Недавние"],
          ["favorites", "Избранное"],
        ].map(([v, l]) => n.jsx("button", { type: "button", role: "radio", "aria-checked": tab === v, onClick: () => setTab(v), children: l }, v)),
      }),

      /* [-My food] -list */
      n.jsx("div", {
        className: "scroll ma-list",
        children:
          st.controls.view === "loading"
            ? n.jsx("div", {
                className: "native-results-card ma-skeleton",
                "aria-label": "Загрузка",
                children: [1, 2, 3, 4, 5].map((i) => n.jsxs("div", { children: [n.jsx("i", {}), n.jsx("b", {}), n.jsx("b", {})] }, i)),
              })
            : list.length
              ? n.jsx("div", {
                  className: "native-results-card",
                  children: list.map((p) => n.jsx(MaRow, { product: p, saved: saved(p) }, p.id + p.name)),
                })
              : n.jsxs("div", {
                  className: "native-catalog-empty ma-empty",
                  children: [n.jsx(Q, { name: empty.image, size: 140 }), n.jsx("h3", { children: empty.title }), n.jsx("p", { children: empty.text })],
                }),
      }),

      /* [Food] Button_Add — три плитки, внизу */
      !keyboard &&
        n.jsx("div", {
          className: "ma-methods",
          children: [
            ["icon.food.add_manual", "Добавить вручную", () => N.sheet("entry", { kind: "meal" })],
            ["icon.food.camera", "Распознать по фото", () => N.sheet("camera", { target: "meal" })],
            ["gallery", "Фото из галереи", () => N.sheet("camera", { target: "meal", gallery: !0 })],
          ].map(([icon, label, go]) =>
            n.jsxs(
              "button",
              {
                type: "button",
                onClick: go,
                children: [
                  icon === "gallery"
                    ? n.jsx("img", { className: "icon", src: "assets/icon.food.gallery.svg", width: 20, height: 20, alt: "" })
                    : n.jsx(Q, { name: icon, size: 20 }),
                  n.jsx("span", { children: label }),
                ],
              },
              label,
            ),
          ),
        }),

      typeSheet &&
        n.jsx(MfTypeSheet, {
          value: when,
          today: sl,
          onClose: () => setTypeSheet(!1),
          onSave: (v) => {
            N.update((s) => {
              (s.mealDraftType = v.type), (s.mealDraftDate = v.date), (s.mealDraftTime = v.time);
            }),
              setTypeSheet(!1);
          },
        }),
    ],
  });
}
