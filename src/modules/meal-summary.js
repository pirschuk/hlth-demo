/* =====================================================================
 * Итог по приёму пищи (ккал и БЖУ) на экране «Приёмы пищи».
 * Два варианта для сравнения, переключаются в панели «Поведение →
 * Итог приёма пищи» (state.controls.mealSummary):
 *   "header" — A: итог строкой в шапке группы (MacroFactor / Alma);
 *   "card"   — B: карточка приёма с итогом и долей дневной нормы +
 *              отдельный экран приёма пищи (Yazio / MyFitnessPal);
 *   "off"    — как было.
 * Итог показывается, когда в приёме 2 и больше позиций.
 * ===================================================================== */

var MS_COLORS = { proteins: "#5A4FF5", fats: "#9245F0", carbs: "#F17C59" };
var MS_LABELS = { proteins: "Белки", fats: "Жиры", carbs: "Углеводы" };
var MS_GOAL_SHARE = { Завтрак: 0.25, Обед: 0.35, Ужин: 0.3, Перекус: 0.1 };

function msVariant(s) {
  return s.controls.mealSummary ?? "header";
}
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
function msPlural(n, one, few, many) {
  const m10 = n % 10,
    m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many;
}
function msG(v) {
  return rt(Math.round(v * 10) / 10);
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
function MsDots({ values, strong, className = "meal-history-macros" }) {
  return n.jsx("div", {
    className,
    children: ["proteins", "fats", "carbs"].map((k) =>
      n.jsxs(
        "span",
        {
          children: [
            n.jsx("i", { style: { background: MS_COLORS[k] } }),
            n.jsxs($, { token: strong ? "number2L" : "number3M", children: [msG(values[k] || 0), " г"] }),
          ],
        },
        k,
      ),
    ),
  });
}

/* ---------- Вариант A: итог в шапке группы ---------- */
function MsGroupHeaderVariant({ name, items }) {
  const t = msTotals(items),
    show = t.count >= 2;
  return n.jsxs("section", {
    className: "meal-history-group ms-a",
    children: [
      n.jsxs("div", {
        className: "ms-a-head",
        children: [
          n.jsx($, { as: "h3", token: "capsSign", children: name.toUpperCase() }),
          show &&
            n.jsxs($, {
              token: "number3L",
              className: "ms-a-kcal",
              children: ["Итого ", rt(Math.round(t.calories)), " ккал"],
            }),
        ],
      }),
      n.jsxs("div", {
        className: "meal-history-list",
        children: [
          show &&
            n.jsxs("div", {
              className: "ms-a-summary",
              "aria-label": `Итого за ${name.toLowerCase()}: ${Math.round(t.calories)} ккал`,
              children: [
                n.jsxs($, {
                  token: "number3M",
                  className: "ms-a-count",
                  children: [t.count, " ", msPlural(t.count, "позиция", "позиции", "позиций")],
                }),
                n.jsx(MsDots, { values: t, strong: !0, className: "ms-dots" }),
              ],
            }),
          items.map((G) => n.jsx(MsMealRow, { entry: G }, G.id)),
        ],
      }),
    ],
  });
}

/* ---------- Вариант B: карточка приёма + экран приёма ---------- */
function MsBars({ totals, goals, share }) {
  return n.jsx("div", {
    className: "ms-bars",
    children: ["proteins", "fats", "carbs"].map((k) => {
      const goal = (goals[k] || 0) * share,
        pct = goal ? Math.min(100, (totals[k] / goal) * 100) : 0;
      return n.jsxs(
        "div",
        {
          children: [
            n.jsxs("span", {
              className: "ms-bar-label",
              children: [n.jsx("i", { style: { background: MS_COLORS[k] } }), n.jsx($, { token: "number3M", children: MS_LABELS[k] })],
            }),
            n.jsx("span", {
              className: "ms-bar",
              children: n.jsx("b", { style: { width: `${pct}%`, background: MS_COLORS[k] } }),
            }),
            n.jsxs($, {
              token: "number2L",
              children: [msG(totals[k]), n.jsxs("small", { children: [" / ", rt(Math.round(goal)), " г"] })],
            }),
          ],
        },
        k,
      );
    }),
  });
}
function msOpenMeal(name) {
  N.sheet("meal-summary", { meal: name });
}
function msAddTo(name) {
  N.update((s) => {
    s.mealDraftType = name;
  });
  N.go("nutrition-add", "stats");
}
function MsGroupCardVariant({ name, items }) {
  const st = we(),
    t = msTotals(items),
    show = t.count >= 2,
    dayPct = st.goals.meal ? Math.round((t.calories / st.goals.meal) * 100) : 0;
  return n.jsx("section", {
    className: "meal-history-group ms-b",
    children: n.jsxs("div", {
      className: "meal-history-list",
      children: [
        n.jsxs("button", {
          className: "ms-b-head",
          onClick: () => msOpenMeal(name),
          "aria-label": `${name}: ${Math.round(t.calories)} ккал. Открыть приём пищи`,
          children: [
            n.jsxs("span", {
              className: "ms-b-title",
              children: [
                n.jsx($, { token: "answer1L", children: name }),
                n.jsxs($, {
                  token: "number3M",
                  className: "ms-muted",
                  children: [t.count, " ", msPlural(t.count, "позиция", "позиции", "позиций"), show ? ` · ${dayPct}% дневной нормы` : ""],
                }),
              ],
            }),
            n.jsxs("span", {
              className: "ms-b-kcal",
              children: [
                n.jsx($, { token: "answer0L", children: rt(Math.round(t.calories)) }),
                n.jsx($, { token: "number3M", className: "ms-muted", children: " ккал" }),
                n.jsx(Q, { name: "chevron", size: 16 }),
              ],
            }),
          ],
        }),
        show && n.jsx(MsDots, { values: t, strong: !0, className: "ms-dots ms-b-dots" }),
        items.map((G) => n.jsx(MsMealRow, { entry: G }, G.id)),
        n.jsxs("button", {
          className: "ms-b-add",
          onClick: () => msAddTo(name),
          children: [n.jsx(Q, { name: "plus", size: 14 }), `Добавить в ${name.toLowerCase()}`],
        }),
      ],
    }),
  });
}

function MealSummaryScreen({ data }) {
  const st = we(),
    name = data.meal,
    items = st.entries.filter((e) => e.kind === "meal" && e.date === st.date && (e.meal || "Перекус") === name),
    t = msTotals(items),
    share = MS_GOAL_SHARE[name] ?? 0.25,
    goal = Math.round(st.goals.meal * share),
    pct = goal ? Math.min(100, (t.calories / goal) * 100) : 0;
  return n.jsxs("div", {
    className: "ms-screen",
    children: [
      n.jsxs("header", {
        className: "ms-screen-head",
        children: [
          n.jsx("button", {
            className: "mf-icon-btn",
            "aria-label": "Назад",
            onClick: () => N.back(),
            children: n.jsx(Q, { name: "back", size: 18 }),
          }),
          n.jsxs("div", {
            children: [
              n.jsx($, { as: "h1", token: "answer0L", children: name }),
              n.jsx($, { token: "number3M", className: "ms-muted", children: mfDayLabel(st.date, st.date) === "Сегодня" ? "Сегодня" : _p(st.date) }),
            ],
          }),
          n.jsx("span", {}),
        ],
      }),
      n.jsxs("div", {
        className: "ms-screen-scroll scroll",
        children: [
          n.jsxs("section", {
            className: "ms-total-card",
            children: [
              n.jsx($, { token: "number3M", className: "ms-muted", children: "Итого за приём" }),
              n.jsxs("div", {
                className: "ms-total-kcal",
                children: [
                  n.jsx($, { token: "widget1Headline", children: rt(Math.round(t.calories)) }),
                  n.jsxs($, { token: "answer1M", className: "ms-muted", children: [" / ", rt(goal), " ккал"] }),
                ],
              }),
              n.jsx("span", {
                className: `ms-bar big ${t.calories > goal ? "over" : ""}`,
                children: n.jsx("b", { style: { width: `${pct}%` } }),
              }),
              n.jsx($, {
                token: "number3M",
                className: t.calories > goal ? "ms-over-text" : "ms-muted",
                children:
                  t.calories > goal
                    ? `На ${rt(Math.round(t.calories - goal))} ккал больше рекомендации на ${name.toLowerCase()}`
                    : `Рекомендация на ${name.toLowerCase()} — ${Math.round(share * 100)}% дневной нормы`,
              }),
              n.jsx(MsBars, { totals: t, goals: st.goals, share }),
            ],
          }),
          n.jsxs($, { as: "h3", token: "capsSign", className: "ms-list-title", children: [t.count, " ", msPlural(t.count, "ПОЗИЦИЯ", "ПОЗИЦИИ", "ПОЗИЦИЙ")] }),
          n.jsx("div", {
            className: "meal-history-list",
            children: items.length
              ? items.map((G) => n.jsx(MsMealRow, { entry: G }, G.id))
              : n.jsx("div", { className: "ms-empty", children: "В этом приёме пока нет блюд" }),
          }),
        ],
      }),
      n.jsx("footer", {
        className: "ms-screen-footer",
        children: n.jsx(re, {
          onClick: () => msAddTo(name),
          children: `Добавить в ${name.toLowerCase()}`,
        }),
      }),
    ],
  });
}

function MealGroup({ name, items }) {
  const st = we();
  return msVariant(st) === "card"
    ? n.jsx(MsGroupCardVariant, { name, items })
    : n.jsx(MsGroupHeaderVariant, { name, items });
}
