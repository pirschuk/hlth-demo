/* =====================================================================
 * Экран «Приёмы пищи» (plan.md 2026-11-11, вариант A). Отдельных экранов
 * приёма нет. Переключатель «Поведение → Экран «Приёмы пищи»»
 * (state.controls.mealList): "accordion" — основной, "groups" — исходные группы.
 *  - Свёрнутый блок: название, ккал справа; состав строкой («Овсяная каша,
 *    яйцо, банан…»); БЖУ в граммах (норм на приём нет в ТЗ). Пустой — «+».
 *  - Касание шапки раскрывает блюда (компактные строки → карточка блюда)
 *    и действия «+ Добавить» / «Скопировать» (шторка копирования приёма).
 *  - Раскрытые запоминаются (state.mealOpen); после добавления или
 *    копирования приём-приёмник раскрывается.
 * Не из DS: раскрывающийся блок, строка состава, компактная строка блюда
 * (основа — [-My food] -list).
 * ===================================================================== */

function mpVariant(s) {
  return s.controls.mealList ?? "accordion";
}
function mlShown(s, list) {
  const v = mpVariant(s);
  return v !== "groups" && s.controls.view !== "empty";
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
function mlComposition(items) {
  const names = items.filter((e) => !e.recognizing && !e.recognizeError).map((e) => e.name),
    s = names.join(", ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
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
/* блок приёма */
function MlBlock({ meal, mode }) {
  const st = we(),
    items = mpItems(st, meal),
    t = msTotals(items),
    count = items.length,
    open = (st.mealOpen || []).includes(meal),
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
        ? n.jsxs(n.Fragment, {
            children: [
              n.jsx($, { token: "assastiveTextM", className: "ml-compo", children: mlComposition(items) }),
              n.jsx(MsDots, { values: t, className: "ms-dots ml-dots" }),
            ],
          })
        : n.jsx($, { token: "assastiveTextM", className: "ms-muted", children: "Нет записей" }),
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
        : n.jsxs("button", {
              type: "button",
              className: "ml-head",
              "aria-expanded": open,
              onClick: toggle,
              "aria-label": `${meal}: ${Math.round(t.calories)} ккал, ${mlCount(count)}. ${open ? "Свернуть" : "Показать блюда"}`,
              children: [summary, n.jsx("span", { className: "ml-chevron", children: n.jsx(Q, { name: "icon.chevron.down", size: 14 }) })],
            }),
      open &&
        count > 0 &&
        n.jsxs("div", {
          className: "mh-list",
          children: [
            items.map((e) => n.jsx(MhRow, { entry: e }, e.id)),
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
                    children: [n.jsx(MrCopyIcon, { size: 18 }), n.jsx($, { token: "assastiveTextL", children: "Скопировать" })],
                  }),
                ],
              }),
          ],
        }),
    ],
  });
}

function MealListAlt() {
  return n.jsx("div", {
    className: "mp-blocks",
    children: MF_TYPES.map((meal) => n.jsx(MlBlock, { meal, mode: "accordion" }, meal)),
  });
}
