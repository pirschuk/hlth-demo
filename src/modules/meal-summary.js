/* =====================================================================
 * Итог по приёму пищи на экране «Приёмы пищи».
 * Сумма ккал и БЖУ выводится одной строкой в шапке группы, справа от
 * названия приёма. Только когда в приёме 2 и больше позиций.
 * Прогресс к норме остаётся в общем виджете «Питание» — здесь только сумма.
 * ===================================================================== */

var MS_COLORS = { proteins: "#5A4FF5", fats: "#9245F0", carbs: "#F17C59" };

function msTotals(items) {
  const done = items.filter((e) => !e.recognizing && !e.recognizeError);
  return {
    count: done.length,
    calories: done.reduce((a, e) => a + (e.value || 0), 0),
    proteins: done.reduce((a, e) => a + (e.proteins || 0), 0),
    fats: done.reduce((a, e) => a + (e.fats || 0), 0),
    carbs: done.reduce((a, e) => a + (e.carbs || 0), 0),
  };
}
function msG(v) {
  return rt(Math.round(v * 10) / 10);
}

function MsDots({ values, token = "number3M", className = "meal-history-macros" }) {
  return n.jsx("div", {
    className,
    children: ["proteins", "fats", "carbs"].map((k) =>
      n.jsxs(
        "span",
        {
          children: [
            n.jsx("i", { style: { background: MS_COLORS[k] } }),
            n.jsxs($, { token, children: [msG(values[k] || 0), " г"] }),
          ],
        },
        k,
      ),
    ),
  });
}

/* строка блюда — та же разметка, что и в исходном списке */
function MsMealRow({ entry: G }) {
  if (G.recognizing || G.recognizeError) return n.jsx(MealRecognitionRow, { entry: G });
  return n.jsxs("button", {
    className: "meal-history-row",
    onClick: () => N.sheet("entry", { kind: "meal", entryId: G.id }),
    children: [
      n.jsxs("div", {
        className: "meal-history-title",
        children: [
          n.jsx($, { token: "assastiveTextL", children: G.name }),
          n.jsx($, { token: "number3M", children: G.time }),
        ],
      }),
      n.jsxs($, {
        className: "meal-history-amount",
        token: "number3M",
        children: [rt(Math.round(G.value)), " ккал · ", rt(Math.round(G.grams || 100)), " ", G.unit || "г"],
      }),
      n.jsx(MsDots, { values: G }),
    ],
  });
}

function MealGroup({ name, items }) {
  const st = we(),
    t = msTotals(items),
    show = t.count >= 2,
    canRepeat = st.date < sl && t.count > 0;
  return n.jsxs("section", {
    className: "meal-history-group",
    children: [
      n.jsxs("div", {
        className: "ms-head",
        "aria-label": show
          ? `${name}: итого ${Math.round(t.calories)} ккал, белки ${msG(t.proteins)} г, жиры ${msG(t.fats)} г, углеводы ${msG(t.carbs)} г`
          : void 0,
        children: [
          n.jsx($, { as: "h3", token: "capsSign", children: name.toUpperCase() }),
          show &&
            n.jsxs("div", {
              className: "ms-total",
              children: [
                n.jsxs($, { token: "number3L", children: [rt(Math.round(t.calories)), " ккал"] }),
                n.jsx(MsDots, { values: t, className: "ms-dots" }),
              ],
            }),
          canRepeat && n.jsx(MealRepeatButton, { date: st.date, meal: name }),
        ],
      }),
      n.jsx("div", {
        className: "meal-history-list",
        children: items.map((G) => n.jsx(MsMealRow, { entry: G }, G.id)),
      }),
    ],
  });
}
