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
/* блок приёма — визуал итерации 2026-11-11 (рефы: Yazio, Lifesum, Alma, Me+):
 * плитка приёма с глифом и оттенком, крупные ккал справа, полоса соотношения
 * БЖУ (доли калорий, не норма), состав строкой; раскрытие — блюда и действия.
 * Не из DS: оттенки плиток, глифы приёмов (иконки из набора прототипа), полоса БЖУ. */
var ML_LOOK = {
  Завтрак: { glyph: "ic.statistic.sleep.picker.sun.png", tone: "#FFF1D6", ink: "#E89B12" },
  Обед: { glyph: "icon.food.fork_knife.png", tone: "#E3F5E4", ink: "#3BA55C" },
  Ужин: { glyph: "ic.statistic.sleep.picker.moon.png", tone: "#ECE8FF", ink: "#7B61FF" },
  Перекус: { glyph: "ic.statistic.meal.png", tone: "#FFE6EC", ink: "#F0567A" },
};
function MlGlyph({ meal, size = 22 }) {
  const l = ML_LOOK[meal];
  return n.jsx("span", {
    className: "ml-tile",
    style: { background: l.tone },
    children: n.jsx("span", {
      "aria-hidden": "true",
      className: "ml-glyph",
      style: { width: size, height: size, background: l.ink, maskImage: `url(./assets/${l.glyph})`, WebkitMaskImage: `url(./assets/${l.glyph})` },
    }),
  });
}
function MlSplit({ t }) {
  const parts = [
      ["proteins", t.proteins * 4],
      ["fats", t.fats * 9],
      ["carbs", t.carbs * 4],
    ],
    sum = parts.reduce((a, [, v]) => a + v, 0) || 1;
  return n.jsxs("div", {
    className: "ml-split",
    children: [
      n.jsx("div", {
        className: "ml-split-bar",
        "aria-hidden": "true",
        children: parts.map(([k, v]) => n.jsx("i", { style: { flexGrow: v / sum, background: MS_COLORS[k] } }, k)),
      }),
      n.jsx("div", {
        className: "ml-split-legend",
        children: parts.map(([k], i) =>
          n.jsxs(
            "span",
            {
              children: [
                n.jsx("i", { style: { background: MS_COLORS[k] } }),
                n.jsx($, { token: "number3M", className: "ms-muted", children: ["Белки", "Жиры", "Углеводы"][i] }),
                n.jsxs($, { token: "number3L", children: [msG(t[k]), " г"] }),
              ],
            },
            k,
          ),
        ),
      }),
    ],
  });
}
function MlBlock({ meal }) {
  const st = we(),
    items = mpItems(st, meal),
    t = msTotals(items),
    count = items.length,
    open = (st.mealOpen || []).includes(meal),
    times = items.map((e) => e.time).filter(Boolean).sort(),
    when = times.length ? (times[0] === times.at(-1) ? times[0] : `${times[0]}–${times.at(-1)}`) : "",
    toggle = () =>
      N.update((s) => {
        const o = s.mealOpen || [];
        s.mealOpen = o.includes(meal) ? o.filter((x) => x !== meal) : [...o, meal];
      });
  if (!count)
    return n.jsxs("button", {
      type: "button",
      className: "ml-empty",
      "aria-label": `${meal}: пока пусто. Добавить`,
      onClick: () => mpAddTo(meal),
      children: [
        n.jsx(MlGlyph, { meal, size: 20 }),
        n.jsxs("span", {
          className: "ml-empty-copy",
          children: [n.jsx($, { token: "answer1L", children: meal }), n.jsx($, { token: "number3M", className: "ms-muted", children: "Пока пусто" })],
        }),
        n.jsx("span", { className: "ml-add", children: n.jsx(Q, { name: "entry-plus", size: 20 }) }),
      ],
    });
  return n.jsxs("section", {
    className: `ml-card ${open ? "is-open" : ""}`,
    style: { "--ml-tone": ML_LOOK[meal].tone },
    "aria-label": meal,
    children: [
      n.jsxs("button", {
        type: "button",
        className: "ml-top",
        "aria-expanded": open,
        "aria-label": `${meal}: ${Math.round(t.calories)} ккал, ${mlCount(count)}. ${open ? "Свернуть" : "Показать блюда"}`,
        onClick: toggle,
        children: [
          n.jsx(MlGlyph, { meal }),
          n.jsxs("span", {
            className: "ml-title",
            children: [n.jsx($, { token: "answer0L", children: meal }), n.jsx($, { token: "number3M", className: "ms-muted", children: `${when} · ${mlCount(count)}` })],
          }),
          n.jsxs("span", {
            className: "ml-kcal",
            children: [n.jsx($, { token: "widget2Headline", children: rt(Math.round(t.calories)) }), n.jsx($, { token: "number3M", className: "ms-muted", children: "ккал" })],
          }),
        ],
      }),
      n.jsx(MlSplit, { t }),
      open
        ? n.jsxs("div", {
            className: "ml-body",
            children: [
              n.jsx("div", { className: "ml-dishes", children: items.map((e) => n.jsx(MhRow, { entry: e }, e.id)) }),
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
              n.jsxs("button", {
                type: "button",
                className: "ml-fold",
                onClick: toggle,
                children: [n.jsx($, { token: "number3M", children: "Свернуть" }), n.jsx(Q, { name: "icon.chevron.down", size: 12 })],
              }),
            ],
          })
        : n.jsxs("button", {
            type: "button",
            className: "ml-compo-row",
            onClick: toggle,
            "aria-label": `Показать блюда: ${mlComposition(items)}`,
            children: [
              n.jsx($, { token: "assastiveTextM", className: "ml-compo", children: mlComposition(items) }),
              n.jsx(Q, { name: "icon.chevron.down", size: 12 }),
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
