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
 *
 * Варианты раскладки (панель «Поведение → Экран добавления еды»,
 * state.controls.addScreen):
 *   "hero" — A «Поиск-герой»: крупная строка ввода (Headline 2), способы
 *            лёгкими кнопками, «Как вчера?», «Недавние / Избранное»;
 *   "chat" — B «Как в чате»: строка ввода снизу как у ассистента
 *            (камера, галерея, отправка = распознать по описанию),
 *            «Как вчера?», карусель «Часто на <приём>», недавние;
 *   "list" — прежний вариант (поиск, плитки, вкладки).
 * «Как вчера?» (реф. Lifesum) — если вчера был такой же приём, предлагает
 * повторить его через шторку дублирования.
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

function maVariant(s) {
  return s.controls.addScreen ?? "hero";
}
function maWhen(st) {
  return {
    type: st.mealDraftType || mfGuessType(st.controls.clock),
    date: st.mealDraftDate || st.date,
    time: st.mealDraftTime || st.controls.clock,
  };
}
function maSearch(st, q) {
  const favs = maFavorites(st),
    isSaved = (p) => p.own || st.favorites.includes(p.id);
  return [...favs, ...maRecent(st), ...st.products]
    .filter((p, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === p.name.toLowerCase()) === i)
    .filter((p) => p.name.toLowerCase().includes(q))
    .sort((a, b) => (isSaved(a) ? 0 : 1) - (isSaved(b) ? 0 : 1));
}
var MA_METHODS = [
  ["icon.food.camera", "Камера", "Распознать по фото", () => N.sheet("camera", { target: "meal" })],
  ["gallery", "Галерея", "Фото из галереи", () => N.sheet("camera", { target: "meal", gallery: !0 })],
  ["icon.food.add_manual", "Вручную", "Добавить вручную", () => N.sheet("entry", { kind: "meal" })],
];
function MaIcon({ name, size = 20 }) {
  return name === "gallery"
    ? n.jsx("img", { className: "icon", src: "assets/icon.food.gallery.svg", width: size, height: size, alt: "" })
    : n.jsx(Q, { name, size });
}

/* ---------- общие части ---------- */
function MaHeader({ when, onType }) {
  const dayLabel = mfDayLabel(when.date, sl);
  return n.jsxs("header", {
    className: "mf-header ma-header",
    children: [
      n.jsx(MfIconButton, { label: "Закрыть", icon: "close", size: 16, onClick: () => (mfHideKeyboard(), N.back()) }),
      n.jsxs("button", {
        type: "button",
        className: "mf-type",
        "aria-label": `Тип и время приёма: ${when.type}, ${dayLabel}, ${when.time}`,
        onClick: () => (mfHideKeyboard(), onType()),
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
  });
}

function MaYesterday({ when }) {
  const st = we(),
    day = Jn(when.date, -1),
    items = mrSourceItems(st, day, when.type);
  if (!items.length) return null;
  const t = msTotals(items),
    names = items.map((e) => e.name),
    list = names.length > 1 ? `${names[0]} и ещё ${names.length - 1}` : names[0];
  return n.jsxs("section", {
    className: "ma-yesterday",
    children: [
      n.jsxs("div", {
        className: "ma-yesterday-copy",
        children: [
          n.jsx($, { token: "answer1L", children: `Как вчера на ${when.type.toLowerCase()}?` }),
          n.jsx($, { token: "assastiveTextM", className: "ms-muted", children: list }),
          n.jsxs($, { token: "number3M", className: "ms-muted", children: [rt(Math.round(t.calories)), " ккал"] }),
        ],
      }),
      n.jsx("button", {
        type: "button",
        className: "ma-small-btn",
        onClick: () => (mfHideKeyboard(), N.sheet("meal-repeat", { date: day, meal: when.type })),
        children: "Повторить",
      }),
    ],
  });
}

function MaList({ items, saved, empty }) {
  const st = we();
  return st.controls.view === "loading"
    ? n.jsx("div", {
        className: "native-results-card ma-skeleton",
        "aria-label": "Загрузка",
        children: [1, 2, 3, 4, 5].map((i) => n.jsxs("div", { children: [n.jsx("i", {}), n.jsx("b", {}), n.jsx("b", {})] }, i)),
      })
    : items.length
      ? n.jsx("div", {
          className: "native-results-card",
          children: items.map((p) => n.jsx(MaRow, { product: p, saved: saved(p) }, p.id + p.name)),
        })
      : n.jsxs("div", {
          className: "native-catalog-empty ma-empty",
          children: [
            n.jsx(Q, { name: empty.image, size: 140 }),
            n.jsx("h3", { children: empty.title }),
            n.jsx("p", { children: empty.text }),
          ],
        });
}
var MA_EMPTY = {
  search: { image: "image.food.not_found", title: "Ничего не найдено", text: "Среди блюд нет подходящих результатов. Попробуйте добавить вручную." },
  recent: { image: "food.favorites.empty", title: "Здесь появятся недавние блюда", text: "После первого добавления блюда можно будет повторить его в одно касание." },
  favorites: {
    image: "food.favorites.empty",
    title: "Здесь появятся ваши блюда",
    text: "Сохраняйте блюда из карточки просмотра — они будут храниться здесь и помогут быстрее добавлять приёмы пищи.",
  },
};
function MaTabs({ tab, setTab }) {
  return n.jsx("div", {
    className: "mf-seg ma-seg",
    role: "radiogroup",
    "aria-label": "Подборка блюд",
    children: [
      ["recent", "Недавние"],
      ["favorites", "Избранное"],
    ].map(([v, l]) => n.jsx("button", { type: "button", role: "radio", "aria-checked": tab === v, onClick: () => setTab(v), children: l }, v)),
  });
}

/* ---------- экран ---------- */
function MealAddScreen() {
  const st = we(),
    variant = maVariant(st),
    [query, setQuery] = V.useState(""),
    [tab, setTab] = V.useState("recent"),
    [typeSheet, setTypeSheet] = V.useState(!1),
    when = maWhen(st),
    favs = maFavorites(st),
    saved = (p) => p.own || st.favorites.includes(p.id),
    recent = maRecent(st),
    q = query.trim().toLowerCase(),
    results = q ? maSearch(st, q) : null,
    tabList = n.jsxs(n.Fragment, {
      children: [
        n.jsx(MaTabs, { tab, setTab }),
        n.jsx(MaList, { items: tab === "recent" ? recent : favs, saved, empty: MA_EMPTY[tab] }),
      ],
    }),
    resultsList = results && n.jsx(MaList, { items: results, saved, empty: MA_EMPTY.search }),
    sheet =
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
    header = n.jsx(MaHeader, { when, onType: () => setTypeSheet(!0) }),
    clear =
      query &&
      n.jsx("button", {
        type: "button",
        className: "ma-clear",
        "aria-label": "Очистить",
        onPointerDown: (e) => e.preventDefault(),
        onClick: () => setQuery(""),
        children: n.jsx(Q, { name: "clear-circle", size: 20 }),
      });

  /* A — поиск-герой */
  if (variant === "hero")
    return n.jsxs("div", {
      className: "ma-page ma-hero",
      children: [
        header,
        n.jsxs("div", {
          className: "scroll ma-list",
          children: [
            n.jsxs("label", {
              className: "ma-hero-search",
              children: [
                n.jsx(Q, { name: "search", size: 28 }),
                n.jsx("input", {
                  "aria-label": "Что вы съели? Поиск блюда или продукта",
                  placeholder: "Что вы съели?",
                  value: query,
                  onChange: (e) => setQuery(e.target.value),
                }),
                clear,
              ],
            }),
            !results &&
              n.jsx("div", {
                className: "ma-chips",
                children: MA_METHODS.map(([icon, short, label, go]) =>
                  n.jsxs(
                    "button",
                    {
                      type: "button",
                      className: "ma-small-btn",
                      "aria-label": label,
                      onClick: () => (mfHideKeyboard(), go()),
                      children: [n.jsx(MaIcon, { name: icon, size: 18 }), short],
                    },
                    short,
                  ),
                ),
              }),
            results ? resultsList : n.jsxs(n.Fragment, { children: [n.jsx(MaYesterday, { when }), tabList] }),
          ],
        }),
        sheet,
      ],
    });

  /* B — как в чате */
  if (variant === "chat") {
    const often = recent.filter((p) =>
        st.entries.some((e) => e.kind === "meal" && (e.meal || "Перекус") === when.type && e.name.toLowerCase() === p.name.toLowerCase()),
      ),
      describe = () => {
        const text = query.trim();
        if (!text) return;
        mfHideKeyboard(), setQuery(""), mfUsePhoto(text);
      };
    return n.jsxs("div", {
      className: "ma-page ma-chat",
      children: [
        header,
        n.jsx("div", {
          className: "scroll ma-list",
          children: results
            ? n.jsxs(n.Fragment, {
                children: [
                  results.length > 0 &&
                    n.jsxs(n.Fragment, {
                      children: [
                        n.jsx($, { as: "h3", token: "capsSign", className: "ma-caps", children: "НАЙДЕНО В БАЗЕ" }),
                        resultsList,
                      ],
                    }),
                  n.jsxs("div", {
                    className: "ma-ai-hint",
                    children: [
                      n.jsx(Q, { name: "chat.sparkles.ai.cell", size: 24 }),
                      n.jsx($, {
                        token: "assastiveTextM",
                        children: results.length
                          ? "Нет нужного? Нажмите стрелку — ассистент распознает блюдо по описанию."
                          : `В базе нет «${query.trim()}». Нажмите стрелку — ассистент распознает блюдо по описанию и посчитает КБЖУ.`,
                      }),
                    ],
                  }),
                ],
              })
            : n.jsxs(n.Fragment, {
                children: [
                  n.jsx(MaYesterday, { when }),
                  often.length > 0 &&
                    n.jsxs("section", {
                      className: "ma-often",
                      children: [
                        n.jsx($, { as: "h3", token: "capsSign", className: "ma-caps", children: `ЧАСТО НА ${when.type.toUpperCase()}` }),
                        n.jsx("div", {
                          className: "ma-often-row",
                          children: often.map((p) =>
                            n.jsxs(
                              "button",
                              {
                                type: "button",
                                className: "ma-often-card",
                                onClick: () => N.sheet("product", { product: p, from: "search" }),
                                children: [
                                  n.jsx($, { token: "assastiveTextL", className: "ma-often-name", children: p.name }),
                                  n.jsxs($, {
                                    token: "number3M",
                                    className: "ms-muted",
                                    children: [rt(Math.round((p.calories * (p.portion || 100)) / 100)), " ккал · ", rt(p.portion || 100), " г"],
                                  }),
                                ],
                              },
                              p.id + p.name,
                            ),
                          ),
                        }),
                      ],
                    }),
                  tabList,
                ],
              }),
        }),
        n.jsxs("div", {
          className: "chat-composer ma-composer",
          children: [
            n.jsx("button", {
              "aria-label": "Распознать по фото",
              className: "icon-button chat-attach ma-cam",
              onClick: () => (mfHideKeyboard(), N.sheet("camera", { target: "meal" })),
              children: n.jsx(Q, { name: "icon.food.camera", size: 24 }),
            }),
            n.jsxs("div", {
              className: "chat-input-container",
              children: [
                n.jsx("textarea", {
                  rows: 1,
                  "aria-label": "Опишите, что вы съели",
                  placeholder: "Опишите, что вы съели",
                  value: query,
                  onChange: (e) => setQuery(e.target.value),
                  onKeyDown: (e) => {
                    e.key === "Enter" && !e.shiftKey && (e.preventDefault(), describe());
                  },
                }),
                query.trim()
                  ? n.jsx("button", {
                      "aria-label": "Распознать по описанию",
                      className: "icon-button send",
                      onPointerDown: (e) => e.preventDefault(),
                      onClick: describe,
                      children: n.jsx(Q, { name: "nc.chat.send.icon", size: 19 }),
                    })
                  : n.jsx("button", {
                      className: "icon-button",
                      "aria-label": "Фото из галереи",
                      onClick: () => (mfHideKeyboard(), N.sheet("camera", { target: "meal", gallery: !0 })),
                      children: n.jsx(MaIcon, { name: "gallery", size: 22 }),
                    }),
              ],
            }),
          ],
        }),
        sheet,
      ],
    });
  }

  /* прежний вариант */
  return n.jsxs("div", {
    className: "ma-page",
    children: [
      header,
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
          clear,
        ],
      }),
      !results &&
        n.jsx("div", {
          className: "ma-methods",
          children: MA_METHODS.map(([icon, short, label, go]) =>
            n.jsxs(
              "button",
              {
                type: "button",
                onClick: () => (mfHideKeyboard(), go()),
                children: [n.jsx(MaIcon, { name: icon }), n.jsx("span", { children: label })],
              },
              label,
            ),
          ),
        }),
      n.jsx("div", { className: "scroll ma-list", children: results ? resultsList : tabList }),
      sheet,
    ],
  });
}
