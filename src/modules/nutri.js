/* =====================================================================
 * Экран «Питание» — с нуля, 3 варианта (plan.md 2026-11-12). Переключатель
 * «Поведение → Экран «Питание»» (state.controls.mealList: v1 / v2 / v3 /
 * groups — исходный экран приложения).
 *   v1 «Выписка» — панель способов добавления под итогом дня; приёмы как
 *      группы выписки (заголовок «ккал · N блюд» + «⋯»), блюда видны всегда.
 *   v2 «Переключатель приёмов» — 4 плитки приёмов в ряд, ниже блюда только
 *      выбранного приёма и его действия «Скопировать» / «Добавить в …».
 *   v3 «Камера в центре» — приёмы сеткой 2×2 (ккал, число, названия),
 *      касание → шторка приёма; внизу большая кнопка камеры.
 * Общее: итог дня (ккал из цели, Б/Ж/У из целей), строка блюда (ккал, вес,
 * время, Б/Ж/У), свайп влево → «Удалить» с «Вернуть», копирование приёма —
 * шторка meal-repeat. Палитра прототипа, остальное — не из DS.
 * ===================================================================== */

var NV_MACROS = [
  ["proteins", "Белки", "#5A4FF5"],
  ["fats", "Жиры", "#9245F0"],
  ["carbs", "Углеводы", "#F17C59"],
];
function nvOn(s) {
  return ["v1", "v2", "v3"].includes(s.controls.mealList ?? "v2");
}
function nvVariant(s) {
  return s.controls.mealList ?? "v2";
}
function nvEntries(s) {
  return s.controls.view === "empty" ? [] : $f(s, "meal");
}
function mpItems(s, meal) {
  return nvEntries(s).filter((e) => (e.meal || "Перекус") === meal);
}
function nvSum(items) {
  const ok = items.filter((e) => !e.recognizing && !e.recognizeError);
  return {
    calories: ok.reduce((a, e) => a + (e.value || 0), 0),
    proteins: ok.reduce((a, e) => a + (e.proteins || 0), 0),
    fats: ok.reduce((a, e) => a + (e.fats || 0), 0),
    carbs: ok.reduce((a, e) => a + (e.carbs || 0), 0),
  };
}
function nvG(v) {
  return rt(Math.round((v || 0) * 10) / 10);
}
function nvCount(nn) {
  return `${nn} ${nn % 10 === 1 && nn % 100 !== 11 ? "блюдо" : [2, 3, 4].includes(nn % 10) && ![12, 13, 14].includes(nn % 100) ? "блюда" : "блюд"}`;
}
function nvLower(meal) {
  return meal.toLowerCase();
}
/* куда добавляем: выбранный приём; после добавления/копирования — показать его */
function mlReveal(s, meal) {
  s.nvMeal = meal;
}
function mpAddTo(meal) {
  N.update((s) => {
    (s.mealDraftType = meal), (s.lastMealType = meal), (s.mealDraftDate = s.mealDraftTime = null);
  });
  N.go("nutrition-add", "stats");
}
/* общее добавление: приём — последний выбранный, меняется в карточке блюда */
function nvPrep(s) {
  s.mealDraftType = s.nvMeal || s.lastMealType || "Завтрак";
  s.mealDraftDate = s.mealDraftTime = null;
}
function nvAdd(how) {
  N.update(nvPrep);
  how === "photo"
    ? N.sheet("camera", { target: "meal", links: nvVariant(N.state) === "v3" })
    : how === "favorites"
      ? N.go("nutrition-favorites", "stats")
      : how === "manual"
        ? N.sheet("entry", { kind: "meal" })
        : N.go("nutrition-add", "stats");
}
function nvCopy(st, meal) {
  N.sheet("meal-repeat", { date: st.date, meal });
}
/* удаление с возможностью вернуть */
function nvDelete(e) {
  N.update((s) => {
    s.entries = s.entries.filter((x) => x.id !== e.id);
    s.nvUndo = { entry: e, at: Date.now() };
  });
  setTimeout(() => N.update((s) => void (s.nvUndo && Date.now() - s.nvUndo.at > 3900 && (s.nvUndo = null))), 4000);
}
function nvRestore() {
  N.update((s) => {
    s.nvUndo && (s.entries.push(s.nvUndo.entry), (s.nvUndo = null));
  });
}

/* ---------- итог дня ---------- */
function NvDay() {
  const st = we(),
    t = nvSum(nvEntries(st)),
    goal = st.goals.meal || 0,
    left = goal - t.calories;
  return n.jsxs("section", {
    className: "nv-day",
    "aria-label": `Съедено ${Math.round(t.calories)} из ${goal} ккал`,
    children: [
      n.jsxs("div", {
        className: "nv-day-top",
        children: [
          n.jsxs("div", {
            children: [
              n.jsx("span", { className: "nv-day-kcal", children: rt(Math.round(t.calories)) }),
              n.jsxs("span", { className: "nv-day-goal", children: [" из ", rt(goal), " ккал"] }),
            ],
          }),
          n.jsx("span", {
            className: `nv-day-left ${left < 0 ? "over" : ""}`,
            children: left >= 0 ? `осталось ${rt(Math.round(left))}` : `больше на ${rt(Math.round(-left))}`,
          }),
        ],
      }),
      n.jsx("div", { className: "nv-bar", children: n.jsx("i", { style: { width: `${Math.min(100, (t.calories / (goal || 1)) * 100)}%` } }) }),
      n.jsx("div", {
        className: "nv-macros",
        children: NV_MACROS.map(([k, l, c]) =>
          n.jsxs(
            "div",
            {
              children: [
                n.jsx("span", { className: "nv-macro-label", children: l }),
                n.jsxs("span", {
                  className: "nv-macro-val",
                  children: [n.jsx("b", { children: Math.round(t[k]) }), ` из ${st.goals[k]} г`],
                }),
                n.jsx("div", { className: "nv-bar thin", children: n.jsx("i", { style: { width: `${Math.min(100, (t[k] / (st.goals[k] || 1)) * 100)}%`, background: c } }) }),
              ],
            },
            k,
          ),
        ),
      }),
    ],
  });
}

/* ---------- строка блюда со свайпом ---------- */
function NvMacroDots({ e }) {
  return n.jsx("span", {
    className: "nv-dots",
    children: NV_MACROS.map(([k, , c]) =>
      n.jsxs("span", { children: [n.jsx("i", { style: { background: c } }), nvG(e[k]), " г"] }, k),
    ),
  });
}
function NvDish({ e }) {
  const [dx, setDx] = V.useState(0),
    drag = V.useRef(null);
  if (e.recognizing || e.recognizeError)
    return n.jsx("div", { className: "nv-dish-wrap", children: n.jsx(MealRecognitionRow, { entry: e }) });
  const down = (ev) => (drag.current = { x: ev.clientX, start: dx, moved: !1 }),
    move = (ev) => {
      const d = drag.current;
      if (!d) return;
      const nx = Math.max(-96, Math.min(0, d.start + ev.clientX - d.x));
      Math.abs(ev.clientX - d.x) > 6 && (d.moved = !0);
      d.moved && setDx(nx);
    },
    up = () => {
      const d = drag.current;
      drag.current = null;
      if (!d) return;
      d.moved ? setDx(dx < -40 ? -96 : 0) : dx ? setDx(0) : N.sheet("entry", { kind: "meal", entryId: e.id });
    };
  return n.jsxs("div", {
    className: `nv-dish-wrap ${dx ? "is-swiped" : ""}`,
    children: [
      n.jsx("button", {
        type: "button",
        className: "nv-del",
        "aria-label": `Удалить ${e.name}`,
        tabIndex: dx ? 0 : -1,
        onClick: () => nvDelete(e),
        children: "Удалить",
      }),
      n.jsxs("div", {
        role: "button",
        tabIndex: 0,
        className: "nv-dish",
        style: { transform: `translateX(${dx}px)` },
        "aria-label": `${e.name}, ${Math.round(e.value)} ккал. Открыть`,
        onPointerDown: down,
        onPointerMove: move,
        onPointerUp: up,
        onPointerLeave: () => drag.current && up(),
        onKeyDown: (ev) => ev.key === "Enter" && N.sheet("entry", { kind: "meal", entryId: e.id }),
        children: [
          n.jsxs("span", {
            className: "nv-dish-main",
            children: [
              n.jsx("span", { className: "nv-dish-name", children: e.name }),
              n.jsxs("span", { className: "nv-dish-sub", children: [rt(Math.round(e.grams || 100)), " ", e.unit || "г", " · ", e.time] }),
              n.jsx(NvMacroDots, { e }),
            ],
          }),
          n.jsxs("span", { className: "nv-dish-kcal", children: [rt(Math.round(e.value)), n.jsx("small", { children: "ккал" })] }),
        ],
      }),
    ],
  });
}
function NvDishes({ items }) {
  return n.jsx("div", { className: "nv-dishes", children: items.map((e) => n.jsx(NvDish, { e }, e.id)) });
}

/* ---------- 1 · Выписка ---------- */
var NV_WAYS = [
  ["photo", "icon.food.camera", "Фото"],
  ["search", "search", "Найти"],
  ["favorites", "heart", "Мои блюда"],
  ["manual", "icon.food.edit", "Вручную"],
];
function NvWays() {
  return n.jsx("div", {
    className: "nv-ways",
    role: "group",
    "aria-label": "Добавить еду",
    children: NV_WAYS.map(([k, icon, l]) =>
      n.jsxs(
        "button",
        {
          type: "button",
          className: `nv-way ${k === "photo" ? "main" : ""}`,
          onClick: () => nvAdd(k),
          children: [n.jsx("span", { className: "nv-way-ico", children: n.jsx(Q, { name: icon, size: 22 }) }), n.jsx("span", { children: l })],
        },
        k,
      ),
    ),
  });
}
function NvStatement() {
  const st = we(),
    [menu, setMenu] = V.useState(null);
  return n.jsxs(n.Fragment, {
    children: [
      n.jsx(NvWays, {}),
      MF_TYPES.map((meal) => {
        const items = mpItems(st, meal),
          t = nvSum(items);
        return n.jsxs(
          "section",
          {
            className: "nv-group",
            "aria-label": meal,
            children: [
              n.jsxs("div", {
                className: "nv-group-head",
                children: [
                  n.jsx("h3", { children: meal }),
                  n.jsx("span", {
                    className: "nv-group-sum",
                    children: items.length ? `${rt(Math.round(t.calories))} ккал · ${nvCount(items.length)}` : "пусто",
                  }),
                  n.jsx("button", {
                    type: "button",
                    className: "nv-round",
                    "aria-label": items.length ? `Действия: ${nvLower(meal)}` : `Добавить в ${nvLower(meal)}`,
                    onClick: () => (items.length ? setMenu(meal) : mpAddTo(meal)),
                    children: items.length ? n.jsx("span", { className: "nv-more", children: "•••" }) : n.jsx(Q, { name: "entry-plus", size: 18 }),
                  }),
                ],
              }),
              items.length > 0 && n.jsx(NvDishes, { items }),
            ],
          },
          meal,
        );
      }),
      menu &&
        n.jsx(NvSheet, {
          onClose: () => setMenu(null),
          title: menu,
          children: n.jsxs("div", {
            className: "nv-menu",
            children: [
              n.jsxs("button", {
                type: "button",
                onClick: () => (setMenu(null), mpAddTo(menu)),
                children: [n.jsx(Q, { name: "entry-plus", size: 22 }), `Добавить в ${nvLower(menu)}`],
              }),
              n.jsxs("button", {
                type: "button",
                onClick: () => (setMenu(null), nvCopy(st, menu)),
                children: [n.jsx(MrCopyIcon, { size: 22 }), `Скопировать ${nvLower(menu)}`],
              }),
            ],
          }),
        }),
    ],
  });
}

/* ---------- 2 · Переключатель приёмов ---------- */
function NvSwitch() {
  const st = we(),
    all = nvEntries(st),
    first = MF_TYPES.find((m) => all.some((e) => (e.meal || "Перекус") === m)),
    sel = MF_TYPES.includes(st.nvMeal) ? st.nvMeal : st.lastMealType || first || "Завтрак",
    items = mpItems(st, sel);
  return n.jsxs(n.Fragment, {
    children: [
      n.jsx("div", {
        className: "nv-tabs",
        role: "tablist",
        "aria-label": "Приёмы пищи",
        children: MF_TYPES.map((meal) => {
          const its = mpItems(st, meal),
            t = nvSum(its);
          return n.jsxs(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": meal === sel,
              className: `nv-tab ${its.length ? "" : "is-empty"}`,
              onClick: () => N.update((s) => void (s.nvMeal = meal)),
              children: [
                n.jsx("span", { className: "nv-tab-name", children: meal }),
                n.jsx("span", { className: "nv-tab-kcal", children: its.length ? rt(Math.round(t.calories)) : "—" }),
                n.jsx("span", { className: "nv-tab-count", children: its.length ? nvCount(its.length) : "пусто" }),
              ],
            },
            meal,
          );
        }),
      }),
      n.jsxs("section", {
        className: "nv-focus",
        role: "tabpanel",
        "aria-label": sel,
        children: [
          n.jsxs("div", {
            className: "nv-focus-head",
            children: [
              n.jsx("h3", { children: sel }),
              items.length > 0 &&
                n.jsxs("button", {
                  type: "button",
                  className: "nv-link",
                  onClick: () => nvCopy(st, sel),
                  children: [n.jsx(MrCopyIcon, { size: 18 }), "Скопировать"],
                }),
            ],
          }),
          items.length
            ? n.jsx(NvDishes, { items })
            : n.jsxs("div", {
                className: "nv-focus-empty",
                children: [n.jsx("b", { children: `В ${nvLower(sel)} пока ничего нет` }), n.jsx("span", { children: "Сфотографируйте тарелку или найдите блюдо — посчитаем сами" })],
              }),
          n.jsxs("button", {
            type: "button",
            className: "nv-primary",
            onClick: () => mpAddTo(sel),
            children: [n.jsx(Q, { name: "entry-plus", size: 20 }), `Добавить в ${nvLower(sel)}`],
          }),
        ],
      }),
    ],
  });
}

/* ---------- 3 · Камера в центре ---------- */
function NvGrid() {
  const st = we();
  return n.jsx("div", {
    className: "nv-grid",
    children: MF_TYPES.map((meal) => {
      const items = mpItems(st, meal),
        t = nvSum(items),
        names = items.filter((e) => !e.recognizing && !e.recognizeError).map((e) => e.name);
      return n.jsxs(
        "button",
        {
          type: "button",
          className: `nv-cell ${items.length ? "" : "is-empty"}`,
          "aria-label": items.length ? `${meal}: ${Math.round(t.calories)} ккал, ${nvCount(items.length)}. Открыть` : `${meal}: пусто. Добавить`,
          onClick: () => (items.length ? N.update((s) => void (s.nvOpen = meal)) : mpAddTo(meal)),
          children: [
            n.jsx("span", { className: "nv-cell-name", children: meal }),
            items.length
              ? n.jsxs(n.Fragment, {
                  children: [
                    n.jsxs("span", { className: "nv-cell-kcal", children: [rt(Math.round(t.calories)), n.jsx("small", { children: " ккал" })] }),
                    n.jsx("span", { className: "nv-cell-count", children: nvCount(items.length) }),
                    n.jsxs("span", {
                      className: "nv-pills",
                      children: [
                        names.slice(0, 2).map((x, i) => n.jsx("i", { children: x }, i)),
                        names.length > 2 && n.jsx("i", { className: "more", children: `+${names.length - 2}` }),
                      ],
                    }),
                  ],
                })
              : n.jsxs("span", { className: "nv-cell-add", children: [n.jsx(Q, { name: "entry-plus", size: 18 }), "Добавить"] }),
          ],
        },
        meal,
      );
    }),
  });
}
function NvMealSheet() {
  const st = we(),
    meal = st.nvOpen;
  if (!meal) return null;
  const items = mpItems(st, meal),
    t = nvSum(items),
    close = () => N.update((s) => void (s.nvOpen = null));
  return n.jsx(NvSheet, {
    onClose: close,
    title: meal,
    sub: `${rt(Math.round(t.calories))} ккал · ${nvCount(items.length)}`,
    children: n.jsxs(n.Fragment, {
      children: [
        items.length ? n.jsx(NvDishes, { items }) : n.jsx("p", { className: "nv-focus-empty", children: "Все блюда удалены" }),
        n.jsxs("div", {
          className: "nv-sheet-actions",
          children: [
            n.jsxs("button", {
              type: "button",
              className: "nv-secondary",
              disabled: !items.length,
              onClick: () => (close(), nvCopy(st, meal)),
              children: [n.jsx(MrCopyIcon, { size: 18 }), "Скопировать"],
            }),
            n.jsxs("button", {
              type: "button",
              className: "nv-primary",
              onClick: () => (close(), mpAddTo(meal)),
              children: [n.jsx(Q, { name: "entry-plus", size: 18 }), "Добавить"],
            }),
          ],
        }),
      ],
    }),
  });
}

/* ---------- общие оверлеи ---------- */
function NvSheet({ title, sub, onClose, children }) {
  return n.jsx("div", {
    className: "nv-backdrop",
    onClick: (ev) => ev.target === ev.currentTarget && onClose(),
    children: n.jsxs("div", {
      className: "nv-sheet",
      role: "dialog",
      "aria-label": title,
      children: [
        n.jsx("i", { className: "nv-grip", "aria-hidden": "true" }),
        n.jsxs("div", {
          className: "nv-sheet-head",
          children: [
            n.jsxs("div", { children: [n.jsx("h2", { children: title }), sub && n.jsx("span", { children: sub })] }),
            n.jsx("button", { type: "button", className: "nv-round", "aria-label": "Закрыть", onClick: onClose, children: n.jsx(Q, { name: "close", size: 14 }) }),
          ],
        }),
        children,
      ],
    }),
  });
}
function NutriBody() {
  const st = we(),
    v = nvVariant(st);
  return n.jsxs("div", {
    className: `nv nv-${v}`,
    children: [n.jsx(NvDay, {}), v === "v1" ? n.jsx(NvStatement, {}) : v === "v2" ? n.jsx(NvSwitch, {}) : n.jsx(NvGrid, {})],
  });
}
function NutriOverlay() {
  const st = we(),
    v = nvVariant(st);
  return n.jsxs(n.Fragment, {
    children: [
      v === "v3" &&
        n.jsxs("button", {
          type: "button",
          className: "nv-cam-fab",
          "aria-label": "Сфотографировать еду",
          onClick: () => nvAdd("photo"),
          children: [n.jsx(Q, { name: "icon.food.camera", size: 28 }), n.jsx("span", { children: "Добавить еду" })],
        }),
      v === "v3" && n.jsx(NvMealSheet, {}),
      st.nvUndo &&
        n.jsxs("div", {
          className: "nv-undo",
          role: "status",
          children: [n.jsx("span", { children: "Блюдо удалено" }), n.jsx("button", { type: "button", onClick: nvRestore, children: "Вернуть" })],
        }),
    ],
  });
}
