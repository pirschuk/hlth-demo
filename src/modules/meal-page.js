/* =====================================================================
 * Вариант экрана «Приёмы пищи»: блоки приёмов → страница приёма.
 * Переключается в панели «Поведение → Экран «Приёмы пищи»»
 * (state.controls.mealList: "groups" — группы с блюдами, по умолчанию;
 *  "blocks" — этот вариант).
 *
 *  - Главная: одна карточка, в ней строка на каждый из четырёх приёмов:
 *    название, сумма ккал, состав одной строкой, БЖУ. Пустой приём —
 *    «Нет записей» и «+».
 *  - Страница приёма (экран стека `meal-page:<Приём>`): итог ккал и БЖУ
 *    без прогресса (прогресс к норме — только в общем виджете «Питание»),
 *    список блюд, кнопка «Добавить блюдо» (сегодня) или «Повторить на
 *    сегодня» (прошлые дни).
 * ===================================================================== */

var MP_PREFIX = "meal-page:";

function mpVariant(s) {
  return s.controls.mealList ?? "groups";
}
function mpItems(s, meal) {
  return $f(s, "meal").filter((e) => (e.meal || "Перекус") === meal);
}
function mpCount(nn) {
  const m10 = nn % 10,
    m100 = nn % 100;
  return `${nn} ${m10 === 1 && m100 !== 11 ? "позиция" : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? "позиции" : "позиций"}`;
}
function mpNames(items) {
  const names = items.filter((e) => !e.recognizing && !e.recognizeError).map((e) => e.name);
  return names.length > 1 ? `${names[0]} и ещё ${names.length - 1}` : names[0] || "";
}
function mpAddTo(meal) {
  N.update((s) => {
    s.mealDraftType = meal;
  });
  N.go("nutrition-add", "stats");
}
function mpOpen(meal) {
  N.go(MP_PREFIX + meal);
}

/* ---------- главная: блоки приёмов ---------- */
function MealBlocks() {
  const st = we();
  return n.jsx("section", {
    className: "mp-blocks",
    "aria-label": "Приёмы пищи",
    children: MF_TYPES.map((meal) => {
      const items = mpItems(st, meal),
        t = msTotals(items),
        pending = items.some((e) => e.recognizing);
      return t.count || pending
        ? n.jsxs(
            "div",
            {
              className: "mp-block",
              children: [
                n.jsxs("button", {
                  type: "button",
                  className: "mp-block-open",
                  onClick: () => mpOpen(meal),
                  "aria-label": `${meal}: ${Math.round(t.calories)} ккал, ${mpCount(t.count)}. Открыть приём`,
                  children: [
                    n.jsxs("span", {
                      className: "mp-block-top",
                      children: [
                        n.jsx($, { token: "answer1L", children: meal }),
                        n.jsxs($, { token: "number1L", className: "mp-block-kcal", children: [rt(Math.round(t.calories)), " ккал"] }),
                      ],
                    }),
                    n.jsx($, {
                      token: "number3M",
                      className: "mp-block-names",
                      children: pending && !t.count ? "Идёт распознавание…" : mpNames(items),
                    }),
                    t.count > 0 && n.jsx(MsDots, { values: t, className: "ms-dots mp-block-dots" }),
                  ],
                }),
                n.jsx("button", {
                  type: "button",
                  className: "mp-add",
                  "aria-label": `Добавить в ${meal.toLowerCase()}`,
                  onClick: () => mpAddTo(meal),
                  children: n.jsx(Q, { name: "plus", size: 16 }),
                }),
              ],
            },
            meal,
          )
        : n.jsxs(
            "div",
            {
              className: "mp-block is-empty",
              children: [
                n.jsxs("span", {
                  className: "mp-block-top",
                  children: [
                    n.jsxs("span", {
                      children: [
                        n.jsx($, { token: "answer1L", children: meal }),
                        n.jsx($, { token: "number3M", className: "mp-block-names", children: "Нет записей" }),
                      ],
                    }),
                    n.jsx("button", {
                      type: "button",
                      className: "mp-add",
                      "aria-label": `Добавить в ${meal.toLowerCase()}`,
                      onClick: () => mpAddTo(meal),
                      children: n.jsx(Q, { name: "plus", size: 16 }),
                    }),
                  ],
                }),
              ],
            },
            meal,
          );
    }),
  });
}

/* ---------- страница приёма ---------- */
function MealPage({ meal }) {
  const st = we(),
    items = mpItems(st, meal),
    t = msTotals(items),
    past = st.date < sl,
    dayLabel = st.date === sl ? "Сегодня" : st.date === Jn(sl, -1) ? `Вчера, ${_p(st.date)}` : _p(st.date);
  return n.jsxs("div", {
    className: "mp-page",
    children: [
      n.jsxs("header", {
        className: "mp-head",
        children: [
          n.jsx("button", {
            className: "icon-button",
            "aria-label": "Назад",
            onClick: () => N.back(),
            children: n.jsx(Q, { name: "main.icons.chevron_left", size: 24 }),
          }),
          n.jsxs("div", {
            children: [
              n.jsx("h1", { children: meal }),
              n.jsx("p", { children: dayLabel }),
            ],
          }),
          n.jsx("span", {}),
        ],
      }),
      n.jsxs("div", {
        className: "scroll mp-scroll",
        children: [
          n.jsxs("section", {
            className: "mp-total",
            "aria-label": `Итого: ${Math.round(t.calories)} ккал`,
            children: [
              n.jsxs("div", {
                className: "mp-total-kcal",
                children: [
                  n.jsx($, { token: "widget1Headline", children: rt(Math.round(t.calories)) }),
                  n.jsx($, { token: "answer1M", className: "ms-muted", children: "ккал" }),
                  n.jsx($, { token: "number3M", className: "ms-muted mp-total-count", children: mpCount(t.count) }),
                ],
              }),
              n.jsx("div", {
                className: "mp-total-macros",
                children: [
                  ["proteins", "Белки"],
                  ["fats", "Жиры"],
                  ["carbs", "Углеводы"],
                ].map(([k, l]) =>
                  n.jsxs(
                    "div",
                    {
                      children: [
                        n.jsxs("span", {
                          className: "mp-macro-label",
                          children: [n.jsx("i", { style: { background: MS_COLORS[k] } }), n.jsx($, { token: "number3M", children: l })],
                        }),
                        n.jsxs($, { token: "number1L", children: [msG(t[k]), " г"] }),
                      ],
                    },
                    k,
                  ),
                ),
              }),
            ],
          }),
          items.length
            ? n.jsx("div", {
                className: "meal-history-list mp-list",
                children: items.map((G) => n.jsx(MsMealRow, { entry: G }, G.id)),
              })
            : n.jsx("div", { className: "card native-manual-empty mp-list", children: "В этом приёме пока нет блюд" }),
        ],
      }),
      n.jsx("footer", {
        className: "mp-footer",
        children:
          past && t.count
            ? n.jsxs(re, {
                onClick: () => N.sheet("meal-repeat", { date: st.date, meal }),
                children: [n.jsx(MrRepeatIcon, { size: 18 }), "Повторить на сегодня"],
              })
            : n.jsx(re, { onClick: () => mpAddTo(meal), children: "Добавить блюдо" }),
      }),
    ],
  });
}
