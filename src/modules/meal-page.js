/* =====================================================================
 * Экран «Приёмы пищи» — варианты без отдельных экранов приёма
 * (решение владельца 2026-11-10: в приёме редко больше 5 блюд, отдельные
 * страницы приёма не рассматриваем). Переключатель «Поведение → Экран
 * «Приёмы пищи»» (state.controls.mealList):
 *   "accordion" — A: блок на каждый приём, свёрнут до итога (ккал, БЖУ,
 *                 число блюд); касание шапки раскрывает блюда и действия
 *                 «Добавить» / «Повторить». Раскрытые запоминаются
 *                 (state.mealOpen); после добавления приём раскрывается.
 *   "open"      — B: блоки всегда раскрыты, действия — иконками в шапке
 *                 (повторить, «+» в этот приём).
 *   "feed"      — C: как BitePal — одна лента дня по времени, приём —
 *                 подпись в строке; добавление — общим «+».
 *   "groups"    — исходные группы приложения (MealGroup).
 * Не из DS: компактная строка блюда (основа — [-My food] -list),
 * раскрывающийся блок (ближе всего Cell с шевроном).
 * ===================================================================== */

function mpVariant(s) {
  return s.controls.mealList ?? "accordion";
}
function mlShown(s, list) {
  const v = mpVariant(s);
  return v !== "groups" && s.controls.view !== "empty" && (v !== "feed" || list.length > 0);
}
function mpItems(s, meal) {
  return $f(s, "meal").filter((e) => (e.meal || "Перекус") === meal);
}
/* раскрыть приём (вызывается внутри N.update/N.run) */
function mlReveal(s, meal) {
  const open = s.mealOpen || [];
  open.includes(meal) || (s.mealOpen = [...open, meal]);
}
function mpAddTo(meal) {
  N.update((s) => {
    (s.mealDraftType = meal), (s.mealDraftDate = s.mealDraftTime = null);
  });
  N.go("nutrition-add", "stats");
}
function mlCount(nn) {
  return `${nn} ${nn % 10 === 1 && nn % 100 !== 11 ? "блюдо" : [2, 3, 4].includes(nn % 10) && ![12, 13, 14].includes(nn % 100) ? "блюда" : "блюд"}`;
}

/* компактная строка блюда */
function MhRow({ entry: e, meal }) {
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
          n.jsxs($, {
            token: "number3M",
            className: "ms-muted",
            children: [meal ? `${e.meal || "Перекус"} · ` : "", e.time, " · ", rt(Math.round(e.grams || 100)), " ", e.unit || "г"],
          }),
        ],
      }),
      n.jsxs($, { token: "number2L", className: "mh-row-kcal", children: [rt(Math.round(e.value)), " ккал"] }),
    ],
  });
}
function MlIcon({ label, onClick, children }) {
  return n.jsx("button", { type: "button", className: "ml-icon", "aria-label": label, onClick, children });
}

/* A и B: блок приёма */
function MlBlock({ meal, mode }) {
  const st = we(),
    items = mpItems(st, meal),
    t = msTotals(items),
    count = items.length,
    open = mode === "open" || (st.mealOpen || []).includes(meal),
    toggle = () =>
      N.update((s) => {
        const o = s.mealOpen || [];
        s.mealOpen = o.includes(meal) ? o.filter((x) => x !== meal) : [...o, meal];
      }),
    repeat = () => N.sheet("meal-repeat", { date: st.date, meal });
  const summary = n.jsxs("span", {
    className: "ml-head-copy",
    children: [
      n.jsxs("span", {
        className: "ml-head-line",
        children: [
          n.jsx($, { token: "answer0L", children: meal }),
          count > 0 && n.jsxs($, { token: "number2L", className: "ml-kcal", children: [rt(Math.round(t.calories)), " ккал"] }),
        ],
      }),
      count > 0
        ? n.jsxs("span", {
            className: "ml-head-sub",
            children: [n.jsx($, { token: "number3M", className: "ms-muted", children: mlCount(count) }), n.jsx(MsDots, { values: t, className: "ms-dots" })],
          })
        : n.jsx($, { token: "number3M", className: "ms-muted", children: "Нет записей" }),
    ],
  });
  return n.jsxs("section", {
    className: `mh-card ml-${mode} ${open && count ? "is-open" : ""}`,
    "aria-label": meal,
    children: [
      !count
        ? n.jsxs("button", {
            type: "button",
            className: "ml-head",
            "aria-label": `${meal}: нет записей. Добавить`,
            onClick: () => mpAddTo(meal),
            children: [summary, n.jsx("span", { className: "ml-plus", children: n.jsx(Q, { name: "entry-plus", size: 20 }) })],
          })
        : mode === "accordion"
          ? n.jsxs("button", {
              type: "button",
              className: "ml-head",
              "aria-expanded": open,
              onClick: toggle,
              children: [summary, n.jsx("span", { className: "ml-chevron", children: n.jsx(Q, { name: "icon.chevron.down", size: 14 }) })],
            })
          : n.jsxs("div", {
              className: "ml-head",
              children: [
                summary,
                n.jsxs("span", {
                  className: "ml-actions",
                  children: [
                    n.jsx(MlIcon, { label: `Повторить ${meal.toLowerCase()}`, onClick: repeat, children: n.jsx(MrRepeatIcon, { size: 20 }) }),
                    n.jsx(MlIcon, { label: `Добавить в ${meal.toLowerCase()}`, onClick: () => mpAddTo(meal), children: n.jsx(Q, { name: "entry-plus", size: 20 }) }),
                  ],
                }),
              ],
            }),
      open &&
        count > 0 &&
        n.jsxs("div", {
          className: "mh-list",
          children: [
            items.map((e) => n.jsx(MhRow, { entry: e }, e.id)),
            mode === "accordion" &&
              n.jsxs("div", {
                className: "ml-foot",
                children: [
                  n.jsxs("button", {
                    type: "button",
                    onClick: () => mpAddTo(meal),
                    children: [n.jsx(Q, { name: "entry-plus", size: 18 }), n.jsx($, { token: "assastiveTextL", children: "Добавить" })],
                  }),
                  n.jsxs("button", {
                    type: "button",
                    onClick: repeat,
                    children: [n.jsx(MrRepeatIcon, { size: 18 }), n.jsx($, { token: "assastiveTextL", children: "Повторить" })],
                  }),
                ],
              }),
          ],
        }),
    ],
  });
}

/* C: лента дня */
function MlFeed() {
  const st = we(),
    items = [...$f(st, "meal")].sort((a, b) => (b.time || "").localeCompare(a.time || ""));
  return n.jsx("section", {
    className: "mh-card ml-feed",
    "aria-label": "Съедено за день",
    children: n.jsx("div", { className: "mh-list", children: items.map((e) => n.jsx(MhRow, { entry: e, meal: !0 }, e.id)) }),
  });
}

function MealListAlt() {
  const st = we(),
    v = mpVariant(st);
  if (v === "feed") return n.jsx("div", { className: "mp-blocks", children: n.jsx(MlFeed, {}) });
  return n.jsx("div", {
    className: "mp-blocks",
    children: MF_TYPES.map((meal) => n.jsx(MlBlock, { meal, mode: v }, meal)),
  });
}
