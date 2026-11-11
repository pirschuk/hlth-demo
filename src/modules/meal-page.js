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
  return items
    .filter((e) => !e.recognizing && !e.recognizeError)
    .map((e) => e.name)
    .join(" · ");
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
/* блок приёма (2026-11-11, после «шумит»): все блоки одного вида — белая
 * карточка r20 с обводкой Blue/20; справа в шапке фиксированный слот 32×32
 * (шеврон у заполненного — поворачивается, «+» у пустого); цвет — только
 * точки БЖУ. Свёрнут: ккал, состав строкой, БЖУ. Раскрыт: блюда строками
 * с разделителями и строка действий «Добавить» / «Скопировать».
 * Не из DS: раскрывающийся блок, строка состава. */
function MlBlock({ meal }) {
  const st = we(),
    items = mpItems(st, meal),
    t = msTotals(items),
    count = items.length,
    open = count > 0 && (st.mealOpen || []).includes(meal),
    toggle = () =>
      N.update((s) => {
        const o = s.mealOpen || [];
        s.mealOpen = o.includes(meal) ? o.filter((x) => x !== meal) : [...o, meal];
      });
  return n.jsxs("section", {
    className: `ml-card ${open ? "is-open" : ""}`,
    "aria-label": meal,
    children: [
      n.jsxs("button", {
        type: "button",
        className: "ml-top",
        "aria-expanded": count ? open : void 0,
        "aria-label": count
          ? `${meal}: ${Math.round(t.calories)} ккал, ${mlCount(count)}. ${open ? "Свернуть" : "Показать блюда"}`
          : `${meal}: нет записей. Добавить`,
        onClick: count ? toggle : () => mpAddTo(meal),
        children: [
          n.jsxs("span", {
            className: "ml-title",
            children: [
              n.jsxs("span", {
                className: "ml-line",
                children: [
                  n.jsx($, { token: "answer0L", children: meal }),
                  count > 0 && n.jsxs($, { token: "answer1L", className: "ml-kcal", children: [rt(Math.round(t.calories)), " ккал"] }),
                ],
              }),
              !count
                ? n.jsx($, { token: "assastiveTextM", className: "ml-compo", children: "Нет записей" })
                : !open && n.jsx($, { token: "assastiveTextM", className: "ml-compo", children: mlComposition(items) }),
              count > 0 && n.jsx(MsDots, { values: t, className: "ms-dots ml-dots" }),
            ],
          }),
          n.jsx("span", {
            className: `ml-slot ${count ? "" : "is-add"}`,
            children: n.jsx(Q, { name: count ? "icon.chevron.down" : "entry-plus", size: count ? 14 : 20 }),
          }),
        ],
      }),
      open &&
        n.jsxs("div", {
          className: "ml-body",
          children: [
            items.map((e) => n.jsx(MhRow, { entry: e }, e.id)),
            n.jsxs("div", {
              className: "ml-actions",
              children: [
                n.jsxs("button", {
                  type: "button",
                  onClick: () => mpAddTo(meal),
                  children: [n.jsx(Q, { name: "entry-plus", size: 18 }), n.jsx($, { token: "assastiveTextL", children: "Добавить" })],
                }),
                n.jsxs("button", {
                  type: "button",
                  onClick: () => N.sheet("meal-repeat", { date: st.date, meal }),
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
    children: MF_TYPES.map((meal) => n.jsx(MlBlock, { meal }, meal)),
  });
}
