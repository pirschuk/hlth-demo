/* =====================================================================
 * ТЕСТ (не для прода): три РАЗНЫЕ компоновки экрана добавления ОДНОГО блюда.
 * Панель «Поведение → Экран добавления (тест)», state.controls.addTest:
 *   "ds"     — основной экран на компонентах DS (MealAddScreen);
 *   "phrase" — 1 «Фраза» (реф. ChatGPT sticker prompt, Ahead fill-in-the-blank):
 *              вопрос «Что было на [завтрак ▾]?», ответ — крупная строка ввода,
 *              подсказки-слова под ней, порция — вставка в фразе, одна кнопка;
 *   "deck"   — 2 «Карточки» (реф. Airbnb «2 of 4», Medium stack): тип приёма —
 *              заголовок со стрелками, в центре одна карточка в фокусе
 *              (камера → недавние/избранное → вручную), одна кнопка снизу;
 *   "tiles"  — 3 «Плитки» (реф. How We Feel, ChatGPT widget, Apple Music pins):
 *              крупные вкладки приёма, виджет «поиск + камера/галерея/вручную»,
 *              сетка цветных плиток блюд — касание добавляет.
 * Всегда: выбрал одно блюдо → добавил → вернулся к приёму с тостом.
 * ===================================================================== */

var MT_TINTS = [
  ["#EFF4FF", "#2B6CFC"],
  ["#E9F6EC", "#4AB35D"],
  ["#FDEFEB", "#F17C59"],
  ["#F3EEFF", "#9245F0"],
  ["#FFF6E0", "#C98A12"],
  ["#E5F8FA", "#159AA4"],
];
function mtTint(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return MT_TINTS[h % MT_TINTS.length];
}
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
function mtKcal(p, grams) {
  return Math.round((p.calories * (grams ?? p.portion ?? 100)) / 100);
}
function mtAddOne(p, when) {
  const g = p.portion || 100,
    k = g / 100,
    e = {
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
  mfHideKeyboard();
  N.update((s) => {
    s.entries.push(e);
    (s.tab = "stats"),
      (s.date = when.date),
      (s.stacks.stats = mpVariant(s) === "blocks" ? ["stats", "detail-meal", MP_PREFIX + when.type] : ["stats", "detail-meal"]),
      (s.mealDraftType = s.mealDraftDate = s.mealDraftTime = null);
    s.toast = s.toastPill = `Добавлено в ${when.type.toLowerCase()}: ${p.name}`;
    s.toastIcon = "toast.check-circle";
  });
}
function mtPool(st) {
  return maUnique([...maRecent(st), ...maFavorites(st)]);
}
function mtSearch(st, q) {
  const saved = (p) => p.own || st.favorites.includes(p.id);
  return maUnique([...maFavorites(st), ...maRecent(st), ...st.products])
    .filter((p) => p.name.toLowerCase().includes(q))
    .sort((a, b) => (saved(a) ? 0 : 1) - (saved(b) ? 0 : 1));
}
function mtStep(g, d) {
  return Math.min(2e3, Math.max(10, Math.round((g + d) / 10) * 10));
}
function MtClose() {
  return n.jsx("button", {
    type: "button",
    className: "mt-close",
    "aria-label": "Закрыть",
    onClick: () => (mfHideKeyboard(), N.back()),
    children: n.jsx(Q, { name: "close", size: 16 }),
  });
}
function MtGalleryIcon() {
  return n.jsx("img", { src: "assets/icon.food.gallery.svg", width: 24, height: 24, alt: "" });
}

/* ================= 1. ФРАЗА ================= */
function MtPhrase() {
  const st = we(),
    when = mtWhen(st),
    saved = (p) => p.own || st.favorites.includes(p.id),
    [text, setText] = V.useState(""),
    [pick, setPick] = V.useState(null),
    [grams, setGrams] = V.useState(100),
    [menu, setMenu] = V.useState(null),
    q = text.trim().toLowerCase(),
    chips = (q ? mtSearch(st, q) : mtPool(st)).slice(0, 10),
    choose = (p) => {
      mfHideKeyboard(), setPick(p), setText(p.name), setGrams(p.portion || 100), setMenu(null);
    },
    clear = () => (setPick(null), setText(""));
  return n.jsxs("div", {
    className: "mt-page mt-phrase",
    children: [
      n.jsx("header", { className: "mt-bar", children: n.jsx(MtClose, {}) }),
      n.jsxs("div", {
        className: "scroll mt-phrase-body",
        children: [
          n.jsxs("h1", {
            className: "mt-q",
            children: [
              "Что было на ",
              n.jsxs("button", {
                type: "button",
                className: "mt-token",
                "aria-expanded": menu === "type",
                "aria-label": `Приём пищи: ${when.type}. Изменить`,
                onClick: () => setMenu(menu === "type" ? null : "type"),
                children: [when.type.toLowerCase(), n.jsx("i", { "aria-hidden": "true", children: "▾" })],
              }),
              "?",
            ],
          }),
          menu === "type" &&
            n.jsx("div", {
              className: "mt-pop",
              role: "radiogroup",
              "aria-label": "Приём пищи",
              children: MF_TYPES.map((t) =>
                n.jsx(
                  "button",
                  { type: "button", role: "radio", "aria-checked": t === when.type, onClick: () => (mtSetType(t), setMenu(null)), children: t },
                  t,
                ),
              ),
            }),
          n.jsxs("div", {
            className: `mt-answer ${pick ? "picked" : ""}`,
            children: [
              n.jsx("input", {
                "aria-label": "Блюдо",
                placeholder: "банан, гречка, кофе…",
                value: text,
                onChange: (e) => (setText(e.target.value), setPick(null)),
              }),
              text &&
                n.jsx("button", {
                  type: "button",
                  className: "mt-answer-clear",
                  "aria-label": "Очистить",
                  onPointerDown: (e) => e.preventDefault(),
                  onClick: clear,
                  children: n.jsx(Q, { name: "clear-circle", size: 22 }),
                }),
            ],
          }),
          pick
            ? n.jsxs("p", {
                className: "mt-sentence",
                children: [
                  "Порция ",
                  n.jsxs("button", {
                    type: "button",
                    className: "mt-token",
                    "aria-expanded": menu === "grams",
                    "aria-label": `Порция ${grams} г. Изменить`,
                    onClick: () => setMenu(menu === "grams" ? null : "grams"),
                    children: [rt(grams), " г", n.jsx("i", { "aria-hidden": "true", children: "▾" })],
                  }),
                  " — ",
                  n.jsxs("b", { children: [rt(mtKcal(pick, grams)), " ккал"] }),
                ],
              })
            : n.jsx("div", {
                className: "mt-words",
                children: chips.length
                  ? chips.map((p) =>
                      n.jsxs("button", { type: "button", onClick: () => choose(p), children: [saved(p) && n.jsx("i", { children: "♥" }), p.name] }, p.id + p.name),
                    )
                  : n.jsx("p", { className: "mt-none", children: "Такого нет в базе — сфотографируйте или введите КБЖУ вручную." }),
              }),
          pick &&
            menu === "grams" &&
            n.jsxs("div", {
              className: "mt-pop mt-pop-grams",
              children: [
                n.jsx("button", { type: "button", "aria-label": "Меньше на 10 г", onClick: () => setGrams((g) => mtStep(g, -10)), children: "−" }),
                n.jsxs("span", { children: [rt(grams), " г"] }),
                n.jsx("button", { type: "button", "aria-label": "Больше на 10 г", onClick: () => setGrams((g) => mtStep(g, 10)), children: "+" }),
              ],
            }),
        ],
      }),
      n.jsxs("footer", {
        className: "mt-phrase-foot",
        children: [
          n.jsx("button", {
            type: "button",
            className: "mt-round",
            "aria-label": "Сфотографировать",
            onClick: () => N.sheet("camera", { target: "meal" }),
            children: n.jsx(Q, { name: "icon.food.camera", size: 24 }),
          }),
          n.jsx("button", {
            type: "button",
            className: "mt-round",
            "aria-label": "Фото из галереи",
            onClick: () => N.sheet("camera", { target: "meal", gallery: !0 }),
            children: n.jsx(MtGalleryIcon, {}),
          }),
          n.jsx("button", {
            type: "button",
            className: "mt-round",
            "aria-label": "Ввести вручную",
            onClick: () => N.sheet("entry", { kind: "meal", name: text.trim() }),
            children: n.jsx(Q, { name: "icon.food.add_manual", size: 22 }),
          }),
          n.jsx("button", {
            type: "button",
            className: "mt-go",
            disabled: !pick,
            onClick: () => pick && mtAddOne({ ...pick, portion: grams }, when),
            children: "Добавить",
          }),
        ],
      }),
    ],
  });
}

/* ================= 2. КАРТОЧКИ ================= */
function MtDeck() {
  const st = we(),
    when = mtWhen(st),
    saved = (p) => p.own || st.favorites.includes(p.id),
    [extra, setExtra] = V.useState(null),
    items = [
      { kind: "camera" },
      ...(extra ? [{ kind: "dish", p: extra }] : []),
      ...mtPool(st)
        .filter((p) => !extra || p.name !== extra.name)
        .map((p) => ({ kind: "dish", p })),
      { kind: "manual" },
    ],
    [idx, setIdx] = V.useState(1),
    [grams, setGrams] = V.useState({}),
    [search, setSearch] = V.useState(!1),
    [q, setQ] = V.useState(""),
    track = V.useRef(null),
    cur = items[Math.min(idx, items.length - 1)],
    ti = MF_TYPES.indexOf(when.type),
    gOf = (p) => grams[p.name] ?? p.portion ?? 100,
    center = (i, smooth) => {
      const el = track.current?.children[i];
      el && track.current.scrollTo({ left: el.offsetLeft - (track.current.clientWidth - el.clientWidth) / 2, behavior: smooth ? "smooth" : "auto" });
    };
  V.useLayoutEffect(() => center(idx, !1), [extra]);
  const action =
    cur.kind === "camera"
      ? ["Открыть камеру", () => N.sheet("camera", { target: "meal" })]
      : cur.kind === "manual"
        ? ["Ввести вручную", () => N.sheet("entry", { kind: "meal" })]
        : [`Добавить в ${when.type.toLowerCase()}`, () => mtAddOne({ ...cur.p, portion: gOf(cur.p) }, when)];
  return n.jsxs("div", {
    className: "mt-page mt-deck",
    children: [
      n.jsxs("header", {
        className: "mt-bar",
        children: [
          n.jsx(MtClose, {}),
          n.jsx("button", { type: "button", className: "mt-icon", "aria-label": "Поиск блюда", onClick: () => setSearch(!0), children: n.jsx(Q, { name: "search", size: 22 }) }),
        ],
      }),
      n.jsxs("div", {
        className: "mt-meal-switch",
        children: [
          n.jsx("button", { type: "button", "aria-label": "Предыдущий приём", disabled: ti <= 0, onClick: () => mtSetType(MF_TYPES[ti - 1]), children: "‹" }),
          n.jsxs("div", {
            "aria-live": "polite",
            children: [n.jsx("h1", { children: when.type }), n.jsx("p", { children: `${mfDayLabel(when.date, sl)}, ${when.time}` })],
          }),
          n.jsx("button", { type: "button", "aria-label": "Следующий приём", disabled: ti >= 3, onClick: () => mtSetType(MF_TYPES[ti + 1]), children: "›" }),
        ],
      }),
      n.jsx("div", {
        ref: track,
        className: "mt-track",
        onScroll: (e) => {
          const el = e.currentTarget,
            mid = el.scrollLeft + el.clientWidth / 2;
          let best = 0,
            d = 1e9;
          [...el.children].forEach((c, i) => {
            const dd = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid);
            dd < d && ((d = dd), (best = i));
          });
          best !== idx && setIdx(best);
        },
        children: items.map((it, i) => {
          const on = i === idx;
          if (it.kind !== "dish")
            return n.jsxs(
              "button",
              {
                type: "button",
                className: `mt-card ${it.kind === "camera" ? "cam" : "manual"} ${on ? "on" : ""}`,
                onClick: () => (on ? action[1]() : center(i, !0)),
                children:
                  it.kind === "camera"
                    ? [
                        n.jsx("img", { src: MF_PHOTO, alt: "" }, "i"),
                        n.jsx(Q, { name: "icon.food.camera", size: 36 }, "c"),
                        n.jsx("b", { children: "Сфотографировать" }, "b"),
                        n.jsx("small", { children: "ассистент распознает блюдо" }, "s"),
                      ]
                    : [
                        n.jsx(Q, { name: "icon.food.add_manual", size: 32 }, "c"),
                        n.jsx("b", { children: "Нет в списке?" }, "b"),
                        n.jsx("small", { children: "введите название и КБЖУ" }, "s"),
                      ],
              },
              it.kind,
            );
          const p = it.p,
            [bg, fg] = mtTint(p.name),
            g = gOf(p);
          return n.jsxs(
            "div",
            {
              className: `mt-card dish ${on ? "on" : ""}`,
              style: { "--bg": bg, "--fg": fg },
              onClick: () => !on && center(i, !0),
              children: [
                n.jsx("span", { className: "mt-card-tag", children: saved(p) ? "♥ избранное" : "недавнее" }),
                n.jsx("h2", { children: p.name }),
                n.jsxs("div", { className: "mt-card-kcal", children: [n.jsx("b", { children: rt(mtKcal(p, g)) }), n.jsx("span", { children: "ккал" })] }),
                n.jsxs("div", {
                  className: "mt-card-grams",
                  children: [
                    n.jsx("button", { type: "button", "aria-label": "Меньше на 10 г", onClick: (e) => (e.stopPropagation(), setGrams((s) => ({ ...s, [p.name]: mtStep(g, -10) }))), children: "−" }),
                    n.jsxs("span", { children: [rt(g), " г"] }),
                    n.jsx("button", { type: "button", "aria-label": "Больше на 10 г", onClick: (e) => (e.stopPropagation(), setGrams((s) => ({ ...s, [p.name]: mtStep(g, 10) }))), children: "+" }),
                  ],
                }),
              ],
            },
            p.id + p.name,
          );
        }),
      }),
      n.jsx("div", { className: "mt-dots", "aria-hidden": "true", children: items.map((_, i) => n.jsx("i", { className: i === idx ? "on" : "" }, i)) }),
      n.jsx("footer", { className: "mt-deck-foot", children: n.jsx("button", { type: "button", className: "mt-go wide", onClick: action[1], children: action[0] }) }),
      search &&
        n.jsx("div", {
          className: "mt-search-sheet",
          children: n.jsxs("section", {
            children: [
              n.jsxs("div", {
                className: "mt-search-row",
                children: [
                  n.jsx("input", { "aria-label": "Поиск блюда", placeholder: "Найти блюдо", value: q, onChange: (e) => setQ(e.target.value) }),
                  n.jsx("button", { type: "button", onPointerDown: (e) => e.preventDefault(), onClick: () => (mfHideKeyboard(), setSearch(!1), setQ("")), children: "Отмена" }),
                ],
              }),
              n.jsx("div", {
                className: "scroll mt-search-list",
                children: (q.trim() ? mtSearch(st, q.trim().toLowerCase()) : mtPool(st)).map((p) =>
                  n.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        mfHideKeyboard(), setExtra(p), setIdx(1), setSearch(!1), setQ("");
                      },
                      children: [n.jsx("b", { children: p.name }), n.jsxs("small", { children: [rt(mtKcal(p)), " ккал · ", rt(p.portion || 100), " г"] })],
                    },
                    p.id + p.name,
                  ),
                ),
              }),
            ],
          }),
        }),
    ],
  });
}

/* ================= 3. ПЛИТКИ ================= */
function MtTiles() {
  const st = we(),
    when = mtWhen(st),
    saved = (p) => p.own || st.favorites.includes(p.id),
    [q, setQ] = V.useState(""),
    [done, setDone] = V.useState(null),
    list = q.trim() ? mtSearch(st, q.trim().toLowerCase()) : mtPool(st),
    tap = (p) => {
      setDone(p.name), setTimeout(() => mtAddOne(p, when), 380);
    };
  return n.jsxs("div", {
    className: "mt-page mt-tiles",
    children: [
      n.jsx("header", { className: "mt-bar", children: n.jsx(MtClose, {}) }),
      n.jsx("div", {
        className: "mt-bigtabs",
        role: "radiogroup",
        "aria-label": "Приём пищи",
        children: MF_TYPES.map((t) => n.jsx("button", { type: "button", role: "radio", "aria-checked": t === when.type, onClick: () => mtSetType(t), children: t }, t)),
      }),
      n.jsxs("section", {
        className: "mt-widget",
        children: [
          n.jsxs("label", {
            className: "mt-ask",
            children: [
              n.jsx(Q, { name: "search", size: 22 }),
              n.jsx("input", { "aria-label": "Найти блюдо", placeholder: "Найти блюдо", value: q, onChange: (e) => setQ(e.target.value) }),
            ],
          }),
          n.jsx("div", {
            className: "mt-widget-row",
            children: [
              ["icon.food.camera", "Камера", () => N.sheet("camera", { target: "meal" })],
              ["gallery", "Галерея", () => N.sheet("camera", { target: "meal", gallery: !0 })],
              ["icon.food.add_manual", "Вручную", () => N.sheet("entry", { kind: "meal", name: q.trim() })],
            ].map(([icon, label, f]) =>
              n.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => (mfHideKeyboard(), f()),
                  children: [icon === "gallery" ? n.jsx(MtGalleryIcon, {}) : n.jsx(Q, { name: icon, size: 24 }), n.jsx("span", { children: label })],
                },
                label,
              ),
            ),
          }),
        ],
      }),
      n.jsx("div", {
        className: "scroll mt-grid-wrap",
        children: list.length
          ? n.jsx("div", {
              className: "mt-grid",
              children: list.map((p) => {
                const [bg, fg] = mtTint(p.name);
                return n.jsxs(
                  "button",
                  {
                    type: "button",
                    className: `mt-tile ${done === p.name ? "done" : ""}`,
                    style: { "--bg": bg, "--fg": fg },
                    "aria-label": `Добавить «${p.name}» в ${when.type.toLowerCase()}`,
                    disabled: !!done,
                    onClick: () => tap(p),
                    children: [
                      saved(p) && n.jsx("i", { className: "mt-tile-heart", children: "♥" }),
                      n.jsx("b", { children: p.name }),
                      n.jsxs("span", { children: [rt(mtKcal(p)), " ккал · ", rt(p.portion || 100), " г"] }),
                      n.jsx("em", { "aria-hidden": "true", children: done === p.name ? "✓" : "+" }),
                    ],
                  },
                  p.id + p.name,
                );
              }),
            })
          : n.jsx("p", { className: "mt-none", children: "Такого нет в базе — сфотографируйте или введите вручную." }),
      }),
    ],
  });
}

function MealAddTest() {
  const v = mtVariant(we());
  return v === "phrase" ? n.jsx(MtPhrase, {}) : v === "deck" ? n.jsx(MtDeck, {}) : n.jsx(MtTiles, {});
}
