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

/* ---------- общий виджет приёма (DS [Meal] Widget, вариант без цели) ---------- */
function MpMacros({ totals }) {
  return n.jsx("div", {
    className: "macros mp-macros",
    children: ["proteins", "fats", "carbs"].map((k, i) =>
      n.jsxs(
        "div",
        {
          children: [
            n.jsx($, { as: "small", className: "macro-label", token: "assastiveTextM", children: ["Белки", "Жиры", "Углеводы"][i] }),
            n.jsxs("div", {
              className: "macro-values",
              children: [
                n.jsx($, { token: "number1L", children: msG(totals[k]) }),
                n.jsx($, { token: "answer1M", className: "macro-unit", children: "г" }),
              ],
            }),
          ],
        },
        k,
      ),
    ),
  });
}
function MpWidget({ meal, totals, empty, corner, actions }) {
  return n.jsxs("section", {
    className: `metric-card meal mp-widget ${empty ? "is-empty" : ""}`,
    children: [
      n.jsxs("div", {
        className: "metric-title",
        children: [
          n.jsx(Q, { name: "ic.statistic.meal", size: 20 }),
          n.jsx($, { as: "strong", token: "assastiveTextL", children: meal }),
          corner,
        ],
      }),
      empty
        ? n.jsx("div", { className: "metric-empty", children: "Нет добавленных данных" })
        : n.jsxs(n.Fragment, {
            children: [
              n.jsx("div", {
                className: "metric-main",
                children: n.jsxs("div", {
                  className: "metric-value-line",
                  children: [
                    n.jsx($, { as: "span", token: "widget1Headline", className: "big-value", children: rt(Math.round(totals.calories)) }),
                    n.jsx($, { token: "widget2Headline", className: "metric-goal", children: "ккал" }),
                  ],
                }),
              }),
              n.jsx(MpMacros, { totals }),
            ],
          }),
      actions,
    ],
  });
}
function MpCornerButton({ label, onClick, repeat }) {
  return n.jsx("button", {
    type: "button",
    className: "mp-corner",
    "aria-label": label,
    onClick,
    children: repeat ? n.jsx(MrRepeatIcon, { size: 18 }) : n.jsx("span", { "aria-hidden": "true", children: "+" }),
  });
}

/* ---------- главная: блок на каждый приём ---------- */
function MealBlocks() {
  const st = we();
  return n.jsx("div", {
    className: "mp-blocks",
    children: MF_TYPES.map((meal) => {
      const items = mpItems(st, meal),
        t = msTotals(items),
        has = t.count > 0 || items.some((e) => e.recognizing);
      return n.jsx(
        MpWidget,
        {
          meal,
          totals: t,
          empty: !has,
          actions: n.jsxs("div", {
            className: "metric-actions",
            children: [
              has
                ? n.jsxs("button", {
                    onClick: () => mpOpen(meal),
                    children: ["Блюда ", n.jsx("span", { children: items.length }), n.jsx(Q, { name: "chevron", size: 16 })],
                  })
                : n.jsx("span", {}),
              n.jsx("button", {
                className: "metric-add",
                "aria-label": `Добавить в ${meal.toLowerCase()}`,
                onClick: () => mpAddTo(meal),
                children: n.jsx("span", { "aria-hidden": "true", children: "+" }),
              }),
            ],
          }),
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
            children: [n.jsx("h1", { children: meal }), n.jsx("p", { children: dayLabel })],
          }),
          n.jsx("span", {}),
        ],
      }),
      n.jsxs("div", {
        className: "scroll mp-scroll",
        children: [
          n.jsx(MpWidget, {
            meal: "Итого",
            totals: t,
            empty: !t.count,
            corner:
              past && t.count
                ? n.jsx(MpCornerButton, {
                    repeat: !0,
                    label: `Повторить ${meal.toLowerCase()} на сегодня`,
                    onClick: () => N.sheet("meal-repeat", { date: st.date, meal }),
                  })
                : n.jsx(MpCornerButton, { label: `Добавить в ${meal.toLowerCase()}`, onClick: () => mpAddTo(meal) }),
          }),
          items.length > 0 &&
            n.jsx("div", {
              className: "meal-history-list mp-list",
              children: items.map((G) => n.jsx(MsMealRow, { entry: G }, G.id)),
            }),
        ],
      }),
    ],
  });
}
