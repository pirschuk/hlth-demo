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
/* блок приёма (2026-11-11, итерация 3):
 *  - шапка заполненного приёма — на градиенте карточек DS (gradient.card,
 *    как [-Meal Card] gradient): иконка приёма в белом квадрате, название,
 *    время и число блюд, крупные ккал, шеврон в фиксированном слоте;
 *  - БЖУ — у каждого блюда (строка [-meal widget-inner] meal blocks:
 *    название + время, «ккал · г», точки БЖУ), у приёма — нет;
 *  - свёрнут: состав строкой; раскрыт: блюда и «Добавить» / «Скопировать»;
 *  - пустой: та же карточка без градиента, «Нет записей», «+» в том же слоте.
 * Не из DS: раскрывающийся блок, строка состава. */
function MlBlock({ meal }) {
  const st = we(),
    items = mpItems(st, meal),
    t = msTotals(items),
    count = items.length,
    open = count > 0 && (st.mealOpen || []).includes(meal),
    times = items.map((e) => e.time).filter(Boolean).sort(),
    toggle = () =>
      N.update((s) => {
        const o = s.mealOpen || [];
        s.mealOpen = o.includes(meal) ? o.filter((x) => x !== meal) : [...o, meal];
      });
  return n.jsxs("section", {
    className: `ml-card ${count ? "is-filled" : "is-empty"} ${open ? "is-open" : ""}`,
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
          n.jsx("span", { className: "ml-icon", children: n.jsx(Q, { name: "icon.food.fork_knife", size: 22 }) }),
          n.jsxs("span", {
            className: "ml-title",
            children: [
              n.jsx($, { token: "answer0L", children: meal }),
              n.jsx($, { token: "number3M", className: "ms-muted", children: count ? `${times[0]} · ${mlCount(count)}` : "Нет записей" }),
            ],
          }),
          count > 0 &&
            n.jsxs("span", {
              className: "ml-kcal",
              children: [n.jsx($, { token: "widget2Headline", children: rt(Math.round(t.calories)) }), n.jsx($, { token: "number3M", className: "ms-muted", children: "ккал" })],
            }),
          n.jsx("span", {
            className: `ml-slot ${count ? "" : "is-add"}`,
            children: n.jsx(Q, { name: count ? "icon.chevron.down" : "entry-plus", size: count ? 14 : 20 }),
          }),
        ],
      }),
      count > 0 &&
        !open &&
        n.jsx("button", {
          type: "button",
          className: "ml-compo-row",
          onClick: toggle,
          "aria-label": `Показать блюда: ${mlComposition(items)}`,
          children: n.jsx($, { token: "assastiveTextM", className: "ml-compo", children: mlComposition(items) }),
        }),
      open &&
        n.jsxs("div", {
          className: "ml-body",
          children: [
            n.jsx("div", { className: "meal-history-list ml-list", children: items.map((e) => n.jsx(MsMealRow, { entry: e }, e.id)) }),
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
