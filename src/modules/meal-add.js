/* =====================================================================
 * Экран «Добавить приём пищи» (точка входа в добавление еды).
 * Референсы Mobbin: MyFitnessPal, Yazio, Bevel, Cal AI — выбор приёма
 * в шапке, поиск, быстрые способы, «Недавние / Избранное».
 * Компоненты DS (Figma «ЗОЖ приложение (2026)»):
 *   [Food] Header (22926:116978)      — «×» слева;
 *   центр шапки — элемент типа и времени приёма из HAR-710
 *                (шторка MfTypeSheet: тип + барабан даты и времени);
 *   Search (19318:278360)             — поле поиска;
 *   [Food] Button_Add (23368:130470)  — плитки «Добавить вручную»,
 *                «Распознать по фото», «По фото из галереи»;
 *   SegmentedControl (23461:360783)   — «Недавние / Избранное»;
 *   [-My food] -list (21433:257994)   — строки блюд (сердце / вилка).
 *
 * Выбранные тип, дата и время сохраняются в state.mealDraft* и
 * подставляются в карточку блюда, ручной ввод и распознавание по фото.
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
      out.push(
        known
          ? { ...known, portion: g }
          : { id: e.productId || `recent-${key}`, name: e.name, ...per, portion: g },
      );
    });
  return out;
}
function maFavorites(s) {
  return s.products.filter((p) => p.own || s.favorites.includes(p.id));
}

function MaRow({ product: g, saved }) {
  const grams = g.portion || 100,
    k = grams / 100;
  return n.jsxs("button", {
    className: "native-product-row",
    onClick: () => N.sheet("product", { product: g, from: saved && g.own ? "own" : "search" }),
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
    favs = maFavorites(st),
    isSaved = (p) => p.own || st.favorites.includes(p.id),
    recent = maRecent(st),
    q = query.trim().toLowerCase(),
    results = q
      ? [...favs, ...recent, ...st.products]
          .filter((p, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === p.name.toLowerCase()) === i)
          .filter((p) => p.name.toLowerCase().includes(q))
          .sort((a, b) => (isSaved(a) ? 0 : 1) - (isSaved(b) ? 0 : 1))
      : null,
    list = results ?? (tab === "recent" ? recent : favs),
    loading = st.controls.view === "loading",
    saveWhen = (v) =>
      N.update((s) => {
        (s.mealDraftType = v.type), (s.mealDraftDate = v.date), (s.mealDraftTime = v.time);
      });

  return n.jsxs("div", {
    className: "ma-page",
    children: [
      n.jsxs("header", {
        className: "mf-header ma-header",
        children: [
          n.jsx(MfIconButton, { label: "Закрыть", icon: "close", size: 16, onClick: () => (mfHideKeyboard(), N.back()) }),
          n.jsxs("button", {
            type: "button",
            className: "mf-type",
            "aria-label": `Тип и время приёма: ${when.type}, ${dayLabel}, ${when.time}`,
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

      n.jsxs("label", {
        className: "ma-search",
        children: [
          n.jsx(Q, { name: "search", size: 24 }),
          n.jsx("input", {
            "aria-label": "Поиск блюда или продукта",
            placeholder: "Найти блюдо или продукт",
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

      !results &&
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
                onClick: () => (mfHideKeyboard(), go()),
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

      n.jsxs("div", {
        className: "scroll ma-list",
        children: [
          !results &&
            n.jsx("div", {
              className: "mf-seg ma-seg",
              role: "radiogroup",
              "aria-label": "Подборка блюд",
              children: [
                ["recent", "Недавние"],
                ["favorites", "Избранное"],
              ].map(([v, l]) =>
                n.jsx("button", { type: "button", role: "radio", "aria-checked": tab === v, onClick: () => setTab(v), children: l }, v),
              ),
            }),
          loading
            ? n.jsx("div", {
                className: "native-results-card ma-skeleton",
                "aria-label": "Загрузка",
                children: [1, 2, 3, 4, 5].map((i) => n.jsxs("div", { children: [n.jsx("i", {}), n.jsx("b", {}), n.jsx("b", {})] }, i)),
              })
            : list.length
              ? n.jsx("div", {
                  className: "native-results-card",
                  children: list.map((p) => n.jsx(MaRow, { product: p, saved: isSaved(p) }, p.id + p.name)),
                })
              : n.jsxs("div", {
                  className: "native-catalog-empty ma-empty",
                  children: [
                    n.jsx(Q, { name: results ? "image.food.not_found" : "food.favorites.empty", size: 140 }),
                    n.jsx("h3", {
                      children: results ? "Ничего не найдено" : tab === "recent" ? "Здесь появятся недавние блюда" : "Здесь появятся ваши блюда",
                    }),
                    n.jsx("p", {
                      children: results
                        ? "Среди блюд нет подходящих результатов. Попробуйте добавить вручную."
                        : tab === "recent"
                          ? "После первого добавления блюда можно будет повторить его в одно касание."
                          : "Сохраняйте блюда из карточки просмотра — они будут храниться здесь и помогут быстрее добавлять приёмы пищи.",
                    }),
                  ],
                }),
        ],
      }),

      typeSheet &&
        n.jsx(MfTypeSheet, {
          value: when,
          today: sl,
          onClose: () => setTypeSheet(!1),
          onSave: (v) => {
            saveWhen(v), setTypeSheet(!1);
          },
        }),
    ],
  });
}
