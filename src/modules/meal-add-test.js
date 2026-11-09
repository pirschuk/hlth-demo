/* =====================================================================
 * ТЕСТ (не для прода): три варианта экрана добавления блюда.
 * Панель «Поведение → Экран добавления (тест)», state.controls.addTest:
 *   "ds"     — основной экран на компонентах DS (MealAddScreen);
 *   "quick"  — 1 «Быстрый список»: «+» у блюда = добавить это блюдо
 *              с прошлой порцией и вернуться к приёму;
 *   "camera" — 2 «Камера первой»: экран открывается видоискателем,
 *              под затвором лента недавних в одно касание;
 *   "tray"   — 3 «Выбрал → подтвердил»: касание блюда открывает короткую
 *              шторку с порцией и одной кнопкой «Добавить в <приём>».
 * Всегда добавляется ОДНО блюдо: выбрал → добавил → вернулся к приёму.
 * Во всех: тип приёма — четыре кнопки на экране (предвыбран со страницы
 * приёма или по времени суток), он же в тексте главной кнопки.
 * ===================================================================== */

function mtVariant(s) {
  return s.controls.addTest ?? "ds";
}
function mtWhen(st) {
  return {
    type: st.mealDraftType || mfGuessType(st.controls.clock),
    date: st.mealDraftDate || st.date,
    time: st.mealDraftTime || st.controls.clock,
  };
}
function mtSetType(type) {
  N.update((s) => {
    s.mealDraftType = type;
  });
}
function mtKcal(p) {
  return Math.round((p.calories * (p.portion || 100)) / 100);
}
function mtEntry(p, when) {
  const g = p.portion || 100,
    k = g / 100;
  return {
    id: N.id(),
    kind: "meal",
    name: p.name,
    date: when.date,
    time: when.time,
    meal: when.type,
    provider: "manual",
    productId: p.id,
    grams: g,
    unit: "г",
    value: Math.round(p.calories * k),
    proteins: Math.round((p.proteins || 0) * k * 10) / 10,
    fats: Math.round((p.fats || 0) * k * 10) / 10,
    carbs: Math.round((p.carbs || 0) * k * 10) / 10,
    per100: { calories: p.calories, proteins: p.proteins || 0, fats: p.fats || 0, carbs: p.carbs || 0 },
  };
}
function mtAddMany(products, when) {
  const es = products.map((p) => mtEntry(p, when));
  N.update((s) => {
    s.entries.push(...es);
  });
  N.log(`Добавлено блюд: ${es.length} → ${when.type}`);
  return es.map((e) => e.id);
}
function mtAddOne(p, when) {
  mtAddMany([p], when);
  mtFinish(when);
  N.update((s) => {
    s.toast = s.toastPill = `Добавлено в ${when.type.toLowerCase()}: ${p.name}`;
    s.toastIcon = "toast.check-circle";
  });
}
function mtUndo(ids) {
  N.update((s) => {
    s.entries = s.entries.filter((e) => !ids.includes(e.id));
  });
}
function mtFinish(when) {
  N.update((s) => {
    const page = MP_PREFIX + when.type;
    (s.tab = "stats"),
      (s.date = when.date),
      (s.stacks.stats =
        mpVariant(s) === "blocks" ? ["stats", "detail-meal", page] : ["stats", "detail-meal"]),
      (s.mealDraftType = s.mealDraftDate = s.mealDraftTime = null);
  });
}
function mtPool(st, q, tab) {
  const favs = maFavorites(st),
    saved = (p) => p.own || st.favorites.includes(p.id);
  if (q)
    return maUnique([...favs, ...maRecent(st), ...st.products])
      .filter((p) => p.name.toLowerCase().includes(q))
      .sort((a, b) => (saved(a) ? 0 : 1) - (saved(b) ? 0 : 1));
  return tab === "favorites" ? favs : maRecent(st);
}

/* ---------- общие части ---------- */
function MtTypeBar({ value, dark }) {
  return n.jsx("div", {
    className: `mt-types ${dark ? "dark" : ""}`,
    role: "radiogroup",
    "aria-label": "Приём пищи",
    children: MF_TYPES.map((t) =>
      n.jsx(
        "button",
        { type: "button", role: "radio", "aria-checked": t === value, onClick: () => mtSetType(t), children: t },
        t,
      ),
    ),
  });
}
function MtTop({ title, right }) {
  return n.jsxs("header", {
    className: "mt-top",
    children: [
      n.jsx("button", {
        type: "button",
        className: "mt-close",
        "aria-label": "Закрыть",
        onClick: () => (mfHideKeyboard(), N.back()),
        children: n.jsx(Q, { name: "close", size: 16 }),
      }),
      n.jsx("h1", { children: title }),
      right ?? n.jsx("span", {}),
    ],
  });
}
function MtSearch({ value, onChange, placeholder = "Поиск: гречка, банан, кофе…" }) {
  return n.jsxs("label", {
    className: "mt-search",
    children: [
      n.jsx(Q, { name: "search", size: 22 }),
      n.jsx("input", {
        "aria-label": "Поиск блюда",
        placeholder,
        value,
        onChange: (e) => onChange(e.target.value),
      }),
      value &&
        n.jsx("button", {
          type: "button",
          "aria-label": "Очистить",
          onPointerDown: (e) => e.preventDefault(),
          onClick: () => onChange(""),
          children: n.jsx(Q, { name: "clear-circle", size: 20 }),
        }),
    ],
  });
}
function MtTabs({ tab, setTab, counts }) {
  return n.jsx("div", {
    className: "mt-tabs",
    role: "tablist",
    children: [
      ["recent", "Недавние"],
      ["favorites", "Избранное"],
    ].map(([v, l]) =>
      n.jsxs(
        "button",
        {
          type: "button",
          role: "tab",
          "aria-selected": tab === v,
          onClick: () => setTab(v),
          children: [l, counts?.[v] != null && n.jsx("span", { children: counts[v] })],
        },
        v,
      ),
    ),
  });
}
function MtMeta({ p }) {
  return n.jsxs($, {
    token: "number3M",
    className: "mt-meta",
    children: [rt(mtKcal(p)), " ккал · ", rt(p.portion || 100), " г"],
  });
}
function MtSnack({ snack, onUndo }) {
  return (
    snack &&
    n.jsxs("div", {
      className: "mt-snack",
      role: "status",
      children: [
        n.jsx("span", { children: snack.text }),
        n.jsx("button", { type: "button", onClick: onUndo, children: "Отменить" }),
      ],
    })
  );
}
function useMtSnack() {
  const [snack, setSnack] = V.useState(null),
    timer = V.useRef(0);
  V.useEffect(() => () => clearTimeout(timer.current), []);
  return [
    snack,
    (v) => {
      clearTimeout(timer.current), setSnack(v), v && (timer.current = setTimeout(() => setSnack(null), 4e3));
    },
  ];
}
function MtEmpty({ q, tab }) {
  return n.jsxs("div", {
    className: "mt-empty",
    children: [
      n.jsx($, { token: "answer1L", children: q ? "Ничего не нашли" : tab === "favorites" ? "Избранного пока нет" : "Недавних пока нет" }),
      n.jsx($, {
        token: "assastiveTextM",
        className: "ms-muted",
        children: q ? "Сфотографируйте блюдо или введите его вручную." : "Отметьте ♥ в карточке блюда — и оно будет здесь.",
      }),
    ],
  });
}

/* ---------- 1. Быстрый список ---------- */
function MtQuick() {
  const st = we(),
    when = mtWhen(st),
    [q, setQ] = V.useState(""),
    [tab, setTab] = V.useState("recent"),
    list = mtPool(st, q.trim().toLowerCase(), tab),
    saved = (p) => p.own || st.favorites.includes(p.id),
    keyboard = st.controls.keyboard,
    quickAdd = (p) => (mfHideKeyboard(), mtAddOne(p, when));
  return n.jsxs("div", {
    className: "mt-page",
    children: [
      n.jsx(MtTop, { title: "Добавить блюдо" }),
      n.jsx(MtTypeBar, { value: when.type }),
      n.jsx(MtSearch, { value: q, onChange: setQ }),
      !q && n.jsx(MtTabs, { tab, setTab, counts: { favorites: maFavorites(st).length } }),
      n.jsx("div", {
        className: "scroll mt-scroll",
        children: list.length
          ? n.jsx("ul", {
              className: "mt-list",
              children: list.map((p) =>
                n.jsxs(
                  "li",
                  {
                    children: [
                      n.jsxs("button", {
                        type: "button",
                        className: "mt-item",
                        onClick: () => (mfHideKeyboard(), N.sheet("product", { product: p, from: "search" })),
                        children: [
                          n.jsxs("span", {
                            className: "mt-item-copy",
                            children: [
                              n.jsxs($, {
                                token: "answer1L",
                                children: [p.name, saved(p) && n.jsx("span", { className: "mt-heart", "aria-label": "в избранном", children: " ♥" })],
                              }),
                              n.jsx(MtMeta, { p }),
                            ],
                          }),
                        ],
                      }),
                      n.jsx("button", {
                        type: "button",
                        className: "mt-plus",
                        "aria-label": `Добавить «${p.name}» в ${when.type.toLowerCase()}`,
                        onClick: () => quickAdd(p),
                        children: "+",
                      }),
                    ],
                  },
                  p.id + p.name,
                ),
              ),
            })
          : n.jsx(MtEmpty, { q, tab }),
      }),
      !keyboard &&
        n.jsxs("footer", {
          className: "mt-actions",
          children: [
            n.jsxs("button", {
              type: "button",
              className: "mt-btn primary",
              onClick: () => N.sheet("camera", { target: "meal" }),
              children: [n.jsx(Q, { name: "icon.food.camera", size: 22 }), "Сфотографировать"],
            }),
            n.jsxs("button", {
              type: "button",
              className: "mt-btn",
              onClick: () => N.sheet("entry", { kind: "meal" }),
              children: [n.jsx(Q, { name: "icon.food.add_manual", size: 20 }), "Вручную"],
            }),
          ],
        }),
    ],
  });
}

/* ---------- 2. Камера первой ---------- */
function MtCamera() {
  const st = we(),
    when = mtWhen(st),
    [mode, setMode] = V.useState("camera"),
    [q, setQ] = V.useState(""),
    recent = maRecent(st),
    list = mtPool(st, q.trim().toLowerCase(), "recent"),
    quickAdd = (p) => (mfHideKeyboard(), mtAddOne(p, when));
  if (mode === "shot")
    return n.jsxs("div", {
      className: "mt-page mt-cam",
      children: [
        n.jsx("div", { className: "mt-viewfinder full", children: n.jsx("img", { src: MF_PHOTO, alt: "Снимок еды" }) }),
        n.jsxs("div", {
          className: "mt-shot-bar",
          children: [
            n.jsx("p", { children: `Добавим в ${when.type.toLowerCase()}. Ассистент распознает блюдо и посчитает КБЖУ.` }),
            n.jsx("button", { type: "button", className: "mt-btn primary", onClick: () => mfUsePhoto(), children: `Распознать и добавить в ${when.type.toLowerCase()}` }),
            n.jsx("button", { type: "button", className: "mt-btn ghost-dark", onClick: () => setMode("camera"), children: "Переснять" }),
          ],
        }),
      ],
    });
  if (mode === "search")
    return n.jsxs("div", {
      className: "mt-page",
      children: [
        n.jsx(MtTop, {
          title: "Найти блюдо",
          right: n.jsx("button", { type: "button", className: "mt-done", onClick: () => setMode("camera"), children: "Камера" }),
        }),
        n.jsx(MtTypeBar, { value: when.type }),
        n.jsx(MtSearch, { value: q, onChange: setQ }),
        n.jsx("div", {
          className: "scroll mt-scroll",
          children: list.length
            ? n.jsx("ul", {
                className: "mt-list",
                children: list.map((p) =>
                  n.jsxs(
                    "li",
                    {
                      children: [
                        n.jsx("button", {
                          type: "button",
                          className: "mt-item",
                          onClick: () => (mfHideKeyboard(), N.sheet("product", { product: p, from: "search" })),
                          children: n.jsxs("span", {
                            className: "mt-item-copy",
                            children: [n.jsx($, { token: "answer1L", children: p.name }), n.jsx(MtMeta, { p })],
                          }),
                        }),
                        n.jsx("button", {
                          type: "button",
                          className: "mt-plus",
                          "aria-label": `Добавить «${p.name}»`,
                          onClick: () => quickAdd(p),
                          children: "+",
                        }),
                      ],
                    },
                    p.id + p.name,
                  ),
                ),
              })
            : n.jsx(MtEmpty, { q, tab: "recent" }),
        }),
      ],
    });
  return n.jsxs("div", {
    className: "mt-page mt-cam",
    children: [
      n.jsxs("div", {
        className: "mt-cam-top",
        children: [
          n.jsx("button", {
            type: "button",
            className: "mt-close dark",
            "aria-label": "Закрыть",
            onClick: () => N.back(),
            children: n.jsx(Q, { name: "close", size: 16 }),
          }),
          n.jsx(MtTypeBar, { value: when.type, dark: !0 }),
        ],
      }),
      n.jsxs("div", {
        className: "mt-viewfinder",
        children: [
          n.jsx("img", { src: MF_PHOTO, alt: "" }),
          n.jsx("i", { className: "mf-frame", "aria-hidden": "true" }),
          n.jsx("p", { children: "Наведите камеру на тарелку" }),
        ],
      }),
      n.jsxs("div", {
        className: "mt-cam-controls",
        children: [
          n.jsxs("button", {
            type: "button",
            className: "mt-cam-side",
            onClick: () => setMode("shot"),
            children: [n.jsx("img", { src: "assets/icon.food.gallery.svg", alt: "", width: 22, height: 22 }), n.jsx("span", { children: "Галерея" })],
          }),
          n.jsx("button", { type: "button", className: "mt-shutter", "aria-label": "Сфотографировать", onClick: () => setMode("shot") }),
          n.jsxs("button", {
            type: "button",
            className: "mt-cam-side",
            onClick: () => setMode("search"),
            children: [n.jsx(Q, { name: "search", size: 22 }), n.jsx("span", { children: "Поиск" })],
          }),
        ],
      }),
      n.jsxs("section", {
        className: "mt-cam-sheet",
        children: [
          n.jsxs("div", {
            className: "mt-cam-sheet-head",
            children: [
              n.jsx($, { token: "answer1L", children: "Или одним касанием" }),
              n.jsx("button", { type: "button", onClick: () => N.sheet("entry", { kind: "meal" }), children: "Вручную" }),
            ],
          }),
          n.jsx("div", {
            className: "mt-chips",
            children: recent.slice(0, 8).map((p) =>
              n.jsxs(
                "button",
                {
                  type: "button",
                  "aria-label": `Добавить «${p.name}» в ${when.type.toLowerCase()}`,
                  onClick: () => quickAdd(p),
                  children: [n.jsx("b", { children: "+" }), n.jsx("span", { children: p.name }), n.jsxs("small", { children: [rt(mtKcal(p)), " ккал"] })],
                },
                p.id + p.name,
              ),
            ),
          }),
        ],
      }),
    ],
  });
}

/* ---------- 3. Выбрал → подтвердил ---------- */
function MtConfirm({ p, when, onClose }) {
  const [grams, setGrams] = V.useState(p.portion || 100),
    k = grams / 100,
    item = { ...p, portion: grams },
    step = (d) => setGrams((g) => Math.min(2e3, Math.max(10, Math.round((g + d) / 10) * 10)));
  return n.jsx("div", {
    className: "mt-confirm-backdrop",
    onClick: onClose,
    children: n.jsxs("section", {
      className: "mt-confirm",
      role: "dialog",
      "aria-label": `Добавить «${p.name}»`,
      onClick: (e) => e.stopPropagation(),
      children: [
        n.jsx("i", { className: "mt-grab", "aria-hidden": "true" }),
        n.jsx($, { as: "h2", token: "headline2", children: p.name }),
        n.jsxs("div", {
          className: "mt-confirm-kcal",
          children: [
            n.jsx($, { token: "widget1Headline", children: rt(Math.round(p.calories * k)) }),
            n.jsx($, { token: "answer1M", className: "ms-muted", children: "ккал" }),
            n.jsx(MsDots, { values: { proteins: (p.proteins || 0) * k, fats: (p.fats || 0) * k, carbs: (p.carbs || 0) * k }, token: "answer1M", className: "ms-dots mt-confirm-dots" }),
          ],
        }),
        n.jsxs("div", {
          className: "mt-portion",
          children: [
            n.jsx("button", { type: "button", "aria-label": "Меньше на 10 г", onClick: () => step(-10), children: "−" }),
            n.jsxs("span", { "aria-live": "polite", children: [rt(grams), " г"] }),
            n.jsx("button", { type: "button", "aria-label": "Больше на 10 г", onClick: () => step(10), children: "+" }),
          ],
        }),
        p.portion && p.portion !== grams
          ? n.jsx("button", { type: "button", className: "mt-link", onClick: () => setGrams(p.portion), children: `Как в прошлый раз — ${rt(p.portion)} г` })
          : n.jsx($, { token: "assastiveTextM", className: "ms-muted mt-portion-hint", children: "Порция как в прошлый раз" }),
        n.jsx("button", { type: "button", className: "mt-btn primary", onClick: () => mtAddOne(item, when), children: `Добавить в ${when.type.toLowerCase()}` }),
        n.jsx("button", {
          type: "button",
          className: "mt-link",
          onClick: () => (onClose(), N.sheet("product", { product: item, from: "search" })),
          children: "Подробнее: БЖУ, название, порция",
        }),
      ],
    }),
  });
}
function MtTray() {
  const st = we(),
    when = mtWhen(st),
    [q, setQ] = V.useState(""),
    [tab, setTab] = V.useState("recent"),
    [pick, setPick] = V.useState(null),
    list = mtPool(st, q.trim().toLowerCase(), tab),
    saved = (p) => p.own || st.favorites.includes(p.id),
    keyboard = st.controls.keyboard;
  return n.jsxs("div", {
    className: "mt-page",
    children: [
      n.jsx(MtTop, { title: "Добавить блюдо" }),
      n.jsx(MtTypeBar, { value: when.type }),
      n.jsx(MtSearch, { value: q, onChange: setQ }),
      !q && n.jsx(MtTabs, { tab, setTab, counts: { favorites: maFavorites(st).length } }),
      n.jsx("div", {
        className: "scroll mt-scroll",
        children: list.length
          ? n.jsx("ul", {
              className: "mt-list",
              children: list.map((p) =>
                n.jsx(
                  "li",
                  {
                    children: n.jsxs("button", {
                      type: "button",
                      className: "mt-item",
                      onClick: () => (mfHideKeyboard(), setPick(p)),
                      children: [
                        n.jsxs("span", {
                          className: "mt-item-copy",
                          children: [
                            n.jsxs($, {
                              token: "answer1L",
                              children: [p.name, saved(p) && n.jsx("span", { className: "mt-heart", "aria-label": "в избранном", children: " ♥" })],
                            }),
                            n.jsx(MtMeta, { p }),
                          ],
                        }),
                        n.jsx("span", { className: "mt-chevron", "aria-hidden": "true", children: "›" }),
                      ],
                    }),
                  },
                  p.id + p.name,
                ),
              ),
            })
          : n.jsx(MtEmpty, { q, tab }),
      }),
      !keyboard &&
        n.jsxs("footer", {
          className: "mt-actions",
          children: [
            n.jsxs("button", {
              type: "button",
              className: "mt-btn primary",
              onClick: () => N.sheet("camera", { target: "meal" }),
              children: [n.jsx(Q, { name: "icon.food.camera", size: 22 }), "Сфотографировать"],
            }),
            n.jsxs("button", {
              type: "button",
              className: "mt-btn",
              onClick: () => N.sheet("entry", { kind: "meal" }),
              children: [n.jsx(Q, { name: "icon.food.add_manual", size: 20 }), "Вручную"],
            }),
          ],
        }),
      pick && n.jsx(MtConfirm, { p: pick, when, onClose: () => setPick(null) }),
    ],
  });
}

function MealAddTest() {
  const v = mtVariant(we());
  return v === "quick" ? n.jsx(MtQuick, {}) : v === "camera" ? n.jsx(MtCamera, {}) : n.jsx(MtTray, {});
}
