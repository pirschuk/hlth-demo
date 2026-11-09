/* =====================================================================
 * Вариант экрана «Приёмы пищи»: карточки приёмов → страница приёма.
 * По макету 2026-11-09 (главная + «Завтрак»). Переключается в панели
 * «Поведение → Экран «Приёмы пищи»» (state.controls.mealList:
 * "groups" — группы с блюдами; "blocks" — этот вариант).
 *
 *  - Главная: календарь, общий виджет «Питание», карточка на каждый приём:
 *    название + бейдж с количеством блюд, БЖУ слева, ккал справа.
 *    Карточка целиком открывает страницу приёма; пустой приём — сразу
 *    добавление с выбранным типом. Плавающий «+» — общее добавление.
 *  - Страница приёма (экран стека `meal-page:<Приём>`): заголовок,
 *    иконка «Повторить» справа (шторка дублирования), итог ккал и БЖУ,
 *    список блюд, плавающий «+» — добавить в этот приём.
 * ===================================================================== */

var MP_PREFIX = "meal-page:";
var MP_MACROS = [
  ["proteins", "Белки"],
  ["fats", "Жиры"],
  ["carbs", "Углеводы"],
];

function mpVariant(s) {
  return s.controls.mealList ?? "groups";
}
function mpItems(s, meal) {
  return $f(s, "meal").filter((e) => (e.meal || "Перекус") === meal);
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

/* ---------- главная: карточка на каждый приём ---------- */
function MealBlocks() {
  const st = we();
  return n.jsx("div", {
    className: "mp-blocks",
    children: MF_TYPES.map((meal) => {
      const items = mpItems(st, meal),
        t = msTotals(items),
        count = items.filter((e) => !e.recognizeError).length;
      return n.jsxs(
        "button",
        {
          type: "button",
          className: `mp-card ${count ? "" : "is-blank"}`,
          onClick: () => (count ? mpOpen(meal) : mpAddTo(meal)),
          "aria-label": count
            ? `${meal}: ${count} ${count === 1 ? "блюдо" : count < 5 ? "блюда" : "блюд"}, ${Math.round(t.calories)} ккал`
            : `${meal}: нет записей. Добавить`,
          children: [
            n.jsxs("span", {
              className: "mp-card-title",
              children: [
                n.jsx($, { token: "answer0L", children: meal }),
                count > 0 && n.jsx("span", { className: "mp-badge", children: count }),
              ],
            }),
            count
              ? n.jsxs("span", {
                  className: "mp-card-row",
                  children: [
                    n.jsx(MsDots, { values: t, token: "answer1M", className: "ms-dots mp-card-dots" }),
                    n.jsxs($, { token: "answer1M", className: "mp-card-kcal", children: [rt(Math.round(t.calories)), " ккал"] }),
                  ],
                })
              : n.jsx($, { token: "answer1M", className: "mp-card-kcal", children: "Нет записей" }),
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
    t = msTotals(items);
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
          n.jsx("h1", { children: meal }),
          t.count > 0
            ? n.jsx("button", {
                className: "mp-repeat",
                "aria-label": `Повторить ${meal.toLowerCase()}`,
                onClick: () => N.sheet("meal-repeat", { date: st.date, meal }),
                children: n.jsx(MrRepeatIcon, { size: 24 }),
              })
            : n.jsx("span", {}),
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
                  n.jsx($, { token: "widget2Headline", className: "ms-muted", children: "ккал" }),
                ],
              }),
              n.jsx("div", {
                className: "mp-total-macros",
                children: MP_MACROS.map(([k, l]) =>
                  n.jsxs(
                    "div",
                    {
                      children: [
                        n.jsxs("span", {
                          className: "mp-macro-label",
                          children: [n.jsx("i", { style: { background: MS_COLORS[k] } }), n.jsx($, { token: "answer1M", children: l })],
                        }),
                        n.jsxs("span", {
                          className: "mp-macro-value",
                          children: [
                            n.jsx($, { token: "number1L", children: msG(t[k]) }),
                            n.jsx($, { token: "answer1M", className: "ms-muted", children: "г" }),
                          ],
                        }),
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
                className: "meal-history-list",
                children: items.map((G) => n.jsx(MsMealRow, { entry: G }, G.id)),
              })
            : n.jsx("div", { className: "card native-manual-empty", children: "Нет добавленных данных" }),
        ],
      }),
      n.jsx("button", {
        className: "native-detail-add",
        "aria-label": `Добавить в ${meal.toLowerCase()}`,
        onClick: () => mpAddTo(meal),
        children: "+",
      }),
    ],
  });
}
