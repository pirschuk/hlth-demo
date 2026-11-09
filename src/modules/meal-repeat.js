/* =====================================================================
 * Дублирование приёма пищи (например, повторить вчерашний завтрак).
 *  - Вход: иконка «Повторить» на странице приёма; в варианте «группы» —
 *    в шапке группы прошедшего дня.
 *  - Шторка: тип приёма (можно повторить завтрак как обед), дата и время
 *    (по умолчанию — сегодня и текущее время), выбор блюд (по умолчанию
 *    все), итог по выбранным, «Добавить».
 *  - Копии получают выбранные дату, время и тип; исходные записи
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

function mrWhenLabel(date, time) {
  return `${mfDayLabel(date, sl, !0)}, ${time}`;
}

function MealRepeatSheet({ data }) {
  const st = we(),
    items = mrSourceItems(st, data.date, data.meal),
    [picked, setPicked] = V.useState(() => items.map((e) => e.id)),
    [type, setType] = V.useState(data.meal),
    [date, setDate] = V.useState(sl),
    [hh, setH] = V.useState(st.controls.clock.slice(0, 2)),
    [mm, setM] = V.useState(st.controls.clock.slice(3, 5)),
    [pickTime, setPickTime] = V.useState(!1),
    chosen = items.filter((e) => picked.includes(e.id)),
    t = msTotals(chosen),
    busy = st.pending.includes("diary"),
    pad = (v) => String(v).padStart(2, "0"),
    days = Array.from({ length: 14 }, (_, i) => Jn(sl, i - 13)).map((d) => ({ value: d, label: mfDayLabel(d, sl, !0) })),
    hours = Array.from({ length: 24 }, (_, i) => ({ value: pad(i), label: pad(i) })),
    mins = Array.from({ length: 60 }, (_, i) => ({ value: pad(i), label: pad(i) })),
    allOn = picked.length === items.length,
    toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    submit = async () => {
      if (!chosen.length) return;
      const ids = chosen.map(() => N.id()),
        time = `${hh}:${mm}`;
      await N.run("diary", (s) => {
        chosen.forEach((e, i) => {
          s.entries.push({ ...e, id: ids[i], date, time, meal: type, provider: "manual", repeatedFrom: e.id });
        });
        s.date = date;
        s.sheet = null;
        const top = s.stacks.stats.at(-1);
        typeof top === "string" && top.startsWith(MP_PREFIX) && (s.stacks.stats[s.stacks.stats.length - 1] = MP_PREFIX + type);
        s.toast = s.toastPill = date === sl ? `${type} добавлен на сегодня` : `${type} добавлен на ${_p(date)}`;
        s.toastIcon = "toast.check-circle";
      });
    };
  return n.jsxs("div", {
    className: "mr-sheet",
    children: [
      n.jsx($, { as: "h2", token: "headline2", children: `Повторить ${data.meal.toLowerCase()}` }),
      n.jsx($, { token: "assastiveTextM", className: "ms-muted mr-sub", children: `из записи за ${mrWhenLabel(data.date, items[0]?.time || "").replace(/, $/, "").toLowerCase()}` }),

      n.jsx($, { as: "h3", token: "answer1L", className: "mr-label", children: "Тип приёма" }),
      n.jsx("div", {
        className: "mf-type-chips",
        role: "radiogroup",
        "aria-label": "Тип приёма",
        children: MF_TYPES.map((x) =>
          n.jsx("button", { type: "button", role: "radio", "aria-checked": x === type, onClick: () => setType(x), children: x }, x),
        ),
      }),

      n.jsx($, { as: "h3", token: "answer1L", className: "mr-label", children: "Дата и время" }),
      n.jsxs("button", {
        type: "button",
        className: "mr-when",
        "aria-expanded": pickTime,
        onClick: () => setPickTime(!pickTime),
        children: [
          n.jsx($, { token: "answer1M", children: mrWhenLabel(date, `${hh}:${mm}`) }),
          n.jsx(Q, { name: "icon.chevron.down", size: 12, className: pickTime ? "mf-rot" : "" }),
        ],
      }),
      pickTime &&
        n.jsxs("div", {
          className: "mf-drums mr-drums",
          children: [
            n.jsx("i", { className: "mf-drum-band", "aria-hidden": "true" }),
            n.jsx(MfDrum, { label: "День", items: days, value: date, onChange: setDate }),
            n.jsx(MfDrum, { label: "Часы", items: hours, value: hh, onChange: setH, width: 56 }),
            n.jsx(MfDrum, { label: "Минуты", items: mins, value: mm, onChange: setM, width: 56 }),
          ],
        }),

      n.jsxs("div", {
        className: "mr-label-row",
        children: [
          n.jsx($, { as: "h3", token: "answer1L", children: "Блюда" }),
          n.jsx("button", {
            type: "button",
            className: "mr-all",
            onClick: () => setPicked(allOn ? [] : items.map((e) => e.id)),
            children: allOn ? "Снять все" : "Выбрать все",
          }),
        ],
      }),
      n.jsx("div", {
        className: "mr-list",
        children: items.map((e) =>
          n.jsxs(
            "label",
            {
              className: "mr-item",
              children: [
                n.jsx("input", { type: "checkbox", className: "mr-check", checked: picked.includes(e.id), onChange: () => toggle(e.id) }),
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
            children: chosen.length ? `Добавить в ${type.toLowerCase()}` : "Выберите блюда",
          }),
        ],
      }),
    ],
  });
}
