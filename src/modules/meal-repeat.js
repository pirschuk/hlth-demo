/* =====================================================================
 * Повтор приёма пищи: скопировать прошлый приём (например, вчерашний
 * завтрак) на сегодня.
 *  - Вход: иконка «Повторить» в шапке группы на экране «Приёмы пищи»,
 *    только для прошедших дней.
 *  - Шторка: в какой приём добавить, какие позиции взять (по умолчанию
 *    все), итог по выбранным, «Добавить на сегодня».
 *  - Копии получают сегодняшнюю дату и текущее время, исходные записи
 *    не меняются.
 * ===================================================================== */

function MrRepeatIcon({ size = 18 }) {
  return n.jsx("span", {
    "aria-hidden": "true",
    className: "icon sf-symbol",
    style: {
      width: size,
      height: size,
      maskImage: "url(./assets/chat.arrows.refresh.png)",
      WebkitMaskImage: "url(./assets/chat.arrows.refresh.png)",
    },
  });
}

function mrSourceItems(s, date, meal) {
  return s.entries.filter(
    (e) => e.kind === "meal" && e.date === date && (e.meal || "Перекус") === meal && !e.recognizing && !e.recognizeError,
  );
}

function MealRepeatButton({ date, meal }) {
  return n.jsx("button", {
    type: "button",
    className: "mr-repeat-btn",
    "aria-label": `Повторить ${meal.toLowerCase()} на сегодня`,
    onClick: () => N.sheet("meal-repeat", { date, meal }),
    children: n.jsx(MrRepeatIcon, {}),
  });
}

function MealRepeatSheet({ data }) {
  const st = we(),
    items = mrSourceItems(st, data.date, data.meal),
    [picked, setPicked] = V.useState(() => items.map((e) => e.id)),
    [type, setType] = V.useState(data.meal),
    chosen = items.filter((e) => picked.includes(e.id)),
    t = msTotals(chosen),
    dayLabel = mfDayLabel(data.date, sl, !0),
    busy = st.pending.includes("diary"),
    toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    submit = async () => {
      if (!chosen.length) return;
      const ids = chosen.map(() => N.id());
      await N.run("diary", (s) => {
        chosen.forEach((e, i) => {
          s.entries.push({
            ...e,
            id: ids[i],
            date: sl,
            time: s.controls.clock,
            meal: type,
            provider: "manual",
            repeatedFrom: e.id,
          });
        });
        s.date = sl;
        s.sheet = null;
        s.toast = s.toastPill = `${type} добавлен на сегодня`;
        s.toastIcon = "toast.check-circle";
      });
    };
  return n.jsxs("div", {
    className: "mr-sheet",
    children: [
      n.jsx($, { as: "h2", token: "headline2", children: `Повторить ${data.meal.toLowerCase()}` }),
      n.jsx($, {
        token: "assastiveTextM",
        className: "ms-muted mr-sub",
        children: `${dayLabel} · ${items.length} ${items.length % 10 === 1 && items.length % 100 !== 11 ? "позиция" : [2, 3, 4].includes(items.length % 10) && ![12, 13, 14].includes(items.length % 100) ? "позиции" : "позиций"}`,
      }),
      n.jsx($, { as: "h3", token: "answer1L", className: "mr-label", children: "Добавить на сегодня в" }),
      n.jsx("div", {
        className: "mf-type-chips",
        role: "radiogroup",
        "aria-label": "Приём пищи",
        children: MF_TYPES.map((x) =>
          n.jsx(
            "button",
            { type: "button", role: "radio", "aria-checked": x === type, onClick: () => setType(x), children: x },
            x,
          ),
        ),
      }),
      n.jsx($, { as: "h3", token: "answer1L", className: "mr-label", children: "Что повторить" }),
      n.jsx("div", {
        className: "mr-list",
        children: items.map((e) =>
          n.jsxs(
            "label",
            {
              className: "mr-item",
              children: [
                n.jsx("input", {
                  type: "checkbox",
                  className: "mr-check",
                  checked: picked.includes(e.id),
                  onChange: () => toggle(e.id),
                }),
                n.jsxs("span", {
                  className: "mr-item-copy",
                  children: [
                    n.jsx($, { token: "assastiveTextL", children: e.name }),
                    n.jsx($, {
                      token: "number3M",
                      className: "ms-muted",
                      children: `${rt(Math.round(e.value))} ккал · ${rt(Math.round(e.grams || 100))} ${e.unit || "г"}`,
                    }),
                  ],
                }),
              ],
            },
            e.id,
          ),
        ),
      }),
      n.jsxs("footer", {
        className: "mr-footer",
        children: [
          chosen.length > 0 && n.jsx(MfSummary, { kcal: t.calories, grams: chosen.reduce((a, e) => a + (e.grams || 0), 0), values: t }),
          n.jsx(re, {
            disabled: !chosen.length || busy,
            onClick: () => void submit(),
            children: chosen.length ? "Добавить на сегодня" : "Выберите позиции",
          }),
        ],
      }),
    ],
  });
}
