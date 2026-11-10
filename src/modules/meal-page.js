/* =====================================================================
 * Вариант экрана «Приёмы пищи»: карточки приёмов → страница приёма.
 * По макету 2026-11-09 (главная + «Завтрак»). Переключается в панели
 * «Поведение → Экран «Приёмы пищи»» (state.controls.mealList:
 * "groups" — группы с блюдами; "blocks" — этот вариант; "hybrid" — блоки с блюдами, см. внизу).
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
/* режимы, где у приёма есть своя страница (после добавления возвращаемся на неё) */
function mpPaged(s) {
  return ["blocks", "hybrid"].includes(mpVariant(s));
}
function mpItems(s, meal) {
  return $f(s, "meal").filter((e) => (e.meal || "Перекус") === meal);
}
function mpAddTo(meal) {
  N.update((s) => {
    (s.mealDraftType = meal), (s.mealDraftDate = s.mealDraftTime = null);
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

/* =====================================================================
 * Гибрид (state.controls.mealList = "hybrid"): всё на одном экране.
 * Блок приёма всегда раскрыт: шапка «Завтрак · N  ккал ›» → страница приёма
 * (повтор, итоги, «+»), под ней блюда компактными строками → карточка блюда.
 * Больше MH_LIMIT блюд — первые MH_LIMIT и «Ещё N ›» → страница приёма.
 * Пустой приём — строка «Добавить» с выбранным типом.
 * MH_LIMIT = 3 — допущение (не из ТЗ). Компактная строка — не из DS
 * (основа — [-My food] -list: название, ккал справа, вторая строка серым).
 * ===================================================================== */
var MH_LIMIT = 3;
function MhRow({ entry: e }) {
  if (e.recognizing || e.recognizeError) return n.jsx(MealRecognitionRow, { entry: e });
  return n.jsxs("button", {
    type: "button",
    className: "mh-row",
    onClick: () => N.sheet("entry", { kind: "meal", entryId: e.id }),
    children: [
      n.jsxs("span", {
        className: "mh-row-copy",
        children: [
          n.jsx($, { token: "assastiveTextL", className: "mh-row-name", children: e.name }),
          n.jsxs($, { token: "number3M", className: "ms-muted", children: [e.time, " · ", rt(Math.round(e.grams || 100)), " ", e.unit || "г"] }),
        ],
      }),
      n.jsxs($, { token: "number2L", className: "mh-row-kcal", children: [rt(Math.round(e.value)), " ккал"] }),
    ],
  });
}
function MealHybrid() {
  const st = we();
  return n.jsx("div", {
    className: "mp-blocks mh-blocks",
    children: MF_TYPES.map((meal) => {
      const items = mpItems(st, meal),
        t = msTotals(items),
        count = items.filter((e) => !e.recognizeError).length,
        more = items.length - MH_LIMIT;
      return n.jsxs(
        "section",
        {
          className: "mh-card",
          "aria-label": meal,
          children: [
            n.jsxs("button", {
              type: "button",
              className: "mh-head",
              onClick: () => (items.length ? mpOpen(meal) : mpAddTo(meal)),
              "aria-label": items.length ? `${meal}: ${Math.round(t.calories)} ккал. Открыть приём` : `${meal}: нет записей. Добавить`,
              children: [
                n.jsx($, { token: "answer0L", children: meal }),
                count > 0 && n.jsxs($, { token: "number2L", className: "mh-head-kcal", children: [rt(Math.round(t.calories)), " ккал"] }),
                n.jsx(Q, { name: items.length ? "chevron" : "entry-plus", size: items.length ? 16 : 20 }),
              ],
            }),
            count > 1 && n.jsx(MsDots, { values: t, className: "ms-dots mh-dots" }),
            items.length > 0 &&
              n.jsxs("div", {
                className: "mh-list",
                children: [
                  items.slice(0, MH_LIMIT).map((e) => n.jsx(MhRow, { entry: e }, e.id)),
                  more > 0 &&
                    n.jsxs("button", {
                      type: "button",
                      className: "mh-more",
                      onClick: () => mpOpen(meal),
                      children: [n.jsx($, { token: "assastiveTextL", children: `Ещё ${more}` }), n.jsx(Q, { name: "chevron", size: 14 })],
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
