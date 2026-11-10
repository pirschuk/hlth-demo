/* =====================================================================
 * Флоу «Добавление приёма пищи» по Figma «ЗОЖ приложение (2026)»,
 * страница «↪ Добавление приёма пищи [new]» (22776:329480), без «Section 2».
 *
 * Экраны:
 *  - карточка блюда (поиск / «Мои блюда» / ручной ввод / просмотр записи);
 *  - шторка «Тип приёма и время» (HAR-710, доработки 27.10.2026);
 *  - камера → предпросмотр → «Идёт распознавание еды» → строка в списке.
 *
 * Модуль вставляется в бандл перед render() (см. scripts/build.mjs) и
 * использует общие сущности прототипа: n (jsx), V (React), N (стор),
 * we (подписка), Q (иконка), $ (текст), re (кнопка), rt (формат), zp.
 * ===================================================================== */

var MF_TYPES = ["Завтрак", "Обед", "Ужин", "Перекус"];
var MF_NUTR = [
  ["calories", "Калории", "kal", "ккал"],
  ["proteins", "Белки", "belki", "г"],
  ["fats", "Жиры", "jir", "г"],
  ["carbs", "Углеводы", "ugl", "г"],
];
var MF_MACROS = [
  ["proteins", "belki"],
  ["fats", "jir"],
  ["carbs", "ugl"],
];
var MF_LIMIT = { calories: 9999, proteins: 999, fats: 999, carbs: 999, portion: 999, eaten: 9999 };
var MF_TOO_BIG = "Введено слишком большое значение";
var MF_NAME_MAX = 255;

function mfNum(s) {
  if (s === "" || s == null) return NaN;
  return Number(String(s).replace(/\s/g, "").replace(",", "."));
}
function mfRound(v) {
  return Math.round(v * 10) / 10;
}
function mfStr(v) {
  return Number.isFinite(v) ? String(mfRound(v)).replace(".", ",") : "";
}
function mfFmt(v) {
  return Number.isFinite(v) ? rt(mfRound(v)) : "–";
}
function mfDayLabel(date, today, long) {
  if (date === today) return "Сегодня";
  if (date === Jn(today, -1)) return "Вчера";
  const d = new Date(date + "T12:00:00");
  const wd = d.toLocaleDateString("ru-RU", { weekday: "short" });
  const dm = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  return long ? `${wd[0].toUpperCase()}${wd.slice(1)} ${dm}` : dm;
}
function mfToast(text, icon) {
  N.update((s) => {
    s.toast = text;
    s.toastPill = text;
    s.toastIcon = icon || "toast.check-circle";
  });
}
function mfHideKeyboard() {
  document.activeElement?.blur?.();
  N.update((s) => {
    s.controls.keyboard = !1;
  });
}

/* ---------- значения из продукта / записи ---------- */
function mfFromProduct(p) {
  return {
    name: p?.name || "",
    per100: Object.fromEntries(MF_NUTR.map(([k]) => [k, p ? +p[k] : NaN])),
    portion: p?.portion || 100,
  };
}
function mfFromEntry(e) {
  const g = e.grams || 100;
  const per100 =
    e.per100 ||
    {
      calories: (e.value * 100) / g,
      proteins: ((e.proteins || 0) * 100) / g,
      fats: ((e.fats || 0) * 100) / g,
      carbs: ((e.carbs || 0) * 100) / g,
    };
  return { name: e.name, per100, portion: e.portionWeight || 100 };
}

/* ---------- маленькие части интерфейса ---------- */
function MfMacros({ values, strong }) {
  return n.jsx("span", {
    className: "mf-macros",
    children: MF_MACROS.map(([k, icon]) =>
      n.jsxs(
        "span",
        {
          children: [
            n.jsx(Q, { name: `icon.food.${icon}`, size: 16 }),
            n.jsxs($, { token: strong ? "number2L" : "number2M", children: [mfFmt(values[k]), " г"] }),
          ],
        },
        k,
      ),
    ),
  });
}
function MfSummary({ kcal, grams, values }) {
  return n.jsxs("div", {
    className: "mf-summary",
    children: [
      n.jsxs($, {
        token: "number2L",
        children: [mfFmt(kcal), " ккал", n.jsx("i", { children: "·" }), mfFmt(grams), " г"],
      }),
      n.jsx(MfMacros, { values }),
    ],
  });
}
function MfIconButton({ label, icon, size = 20, onClick, disabled, active }) {
  return n.jsx("button", {
    type: "button",
    className: `mf-icon-btn ${active ? "active" : ""}`,
    "aria-label": label,
    disabled,
    onClick,
    children: n.jsx(Q, { name: icon, size }),
  });
}
function MfField({ id, label, icon, unit, value, invalid, onChange, onFocus, onBlur, focused }) {
  return n.jsxs("label", {
    className: "mf-row",
    children: [
      n.jsx("span", { className: "mf-row-icon", children: n.jsx(Q, { name: icon, size: 17 }) }),
      n.jsx($, { token: "answer1L", className: "mf-row-label", children: label }),
      n.jsxs("span", {
        className: `mf-input ${focused ? "focused" : ""} ${invalid ? "invalid" : ""}`,
        children: [
          n.jsx("input", {
            "data-mf-field": id,
            "aria-label": `${label}, ${unit}`,
            "aria-invalid": invalid,
            inputMode: "decimal",
            placeholder: "–",
            value,
            size: 1,
            onChange: (e) => onChange(e.target.value),
            onFocus,
            onBlur,
          }),
          n.jsx("span", { className: "mf-unit", children: unit }),
        ],
      }),
    ],
  });
}

/* ---------- шторка «Тип приёма и время» ---------- */
function MfDrum({ items, value, onChange, label, width }) {
  const ref = V.useRef(null),
    timer = V.useRef(0),
    H = 44,
    idx = Math.max(0, items.findIndex((i) => i.value === value));
  V.useLayoutEffect(() => {
    ref.current && (ref.current.scrollTop = idx * H);
  }, []);
  return n.jsx("div", {
    ref,
    className: "mf-drum",
    role: "listbox",
    "aria-label": label,
    tabIndex: 0,
    style: width ? { flex: `0 0 ${width}px` } : void 0,
    onKeyDown: (e) => {
      const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const i = Math.min(items.length - 1, Math.max(0, idx + d));
      onChange(items[i].value), ref.current?.scrollTo({ top: i * H, behavior: "smooth" });
    },
    onScroll: (e) => {
      clearTimeout(timer.current);
      const el = e.currentTarget;
      timer.current = setTimeout(() => {
        const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / H)));
        items[i].value !== value && onChange(items[i].value);
      }, 90);
    },
    children: items.map((it, i) =>
      n.jsx(
        "div",
        {
          role: "option",
          "aria-selected": it.value === value,
          className: it.value === value ? "selected" : "",
          onClick: () => {
            onChange(it.value), ref.current?.scrollTo({ top: i * H, behavior: "smooth" });
          },
          children: it.label,
        },
        it.value,
      ),
    ),
  });
}
function MfTypeSheet({ value, today, onSave, onClose }) {
  const [type, setType] = V.useState(value.type),
    [date, setDate] = V.useState(value.date),
    [hh, setH] = V.useState(value.time.slice(0, 2)),
    [mm, setM] = V.useState(value.time.slice(3, 5)),
    days = Array.from({ length: 14 }, (_, i) => Jn(today, i - 13)).map((d) => ({
      value: d,
      label: mfDayLabel(d, today, !0),
    })),
    pad = (v) => String(v).padStart(2, "0"),
    hours = Array.from({ length: 24 }, (_, i) => ({ value: pad(i), label: pad(i) })),
    mins = Array.from({ length: 60 }, (_, i) => ({ value: pad(i), label: pad(i) }));
  return n.jsx("div", {
    className: "mf-sheet-backdrop",
    onClick: onClose,
    children: n.jsxs("section", {
      className: "mf-sheet",
      role: "dialog",
      "aria-label": "Тип и время приёма пищи",
      onClick: (e) => e.stopPropagation(),
      children: [
        n.jsx("button", {
          className: "mf-sheet-close",
          "aria-label": "Закрыть",
          onClick: onClose,
          children: n.jsx(Q, { name: "close", size: 18 }),
        }),
        n.jsx($, { as: "h2", token: "answer1L", children: "Тип приёма" }),
        n.jsx("div", {
          className: "mf-type-chips",
          role: "radiogroup",
          "aria-label": "Тип приёма",
          children: MF_TYPES.map((t) =>
            n.jsx(
              "button",
              {
                type: "button",
                role: "radio",
                "aria-checked": t === type,
                onClick: () => setType(t),
                children: t,
              },
              t,
            ),
          ),
        }),
        n.jsx($, { as: "h2", token: "answer1L", children: "Время приёма" }),
        n.jsxs("div", {
          className: "mf-drums",
          children: [
            n.jsx("i", { className: "mf-drum-band", "aria-hidden": "true" }),
            n.jsx(MfDrum, { label: "День", items: days, value: date, onChange: setDate }),
            n.jsx(MfDrum, { label: "Часы", items: hours, value: hh, onChange: setH, width: 56 }),
            n.jsx(MfDrum, { label: "Минуты", items: mins, value: mm, onChange: setM, width: 56 }),
          ],
        }),
        n.jsx(re, {
          className: "mf-primary",
          onClick: () => onSave({ type, date, time: `${hh}:${mm}` }),
          children: "Сохранить",
        }),
        n.jsx("button", { className: "mf-text-btn", onClick: onClose, children: "Отменить изменения" }),
      ],
    }),
  });
}

/* ---------- карточка блюда ---------- */
function MealCard({ data }) {
  const st = we(),
    today = st.date,
    entry = data.entryId ? st.entries.find((e) => e.id === data.entryId) : null,
    product = entry ? null : data.product ?? (data.productId ? st.products.find((p) => p.id === data.productId) : null),
    mode = entry ? "entry" : product ? (data.from === "own" ? "own" : "product") : "manual",
    initial = V.useMemo(() => {
      const src = entry ? mfFromEntry(entry) : product ? mfFromProduct(product) : mfFromProduct(null);
      if (mode === "manual" && data.name) src.name = data.name;
      return src;
    }, []),
    [pid] = V.useState(() => (entry ? entry.productId || entry.id : product ? product.id : N.id())),
    [name, setName] = V.useState(initial.name),
    [basis, setBasis] = V.useState("100"),
    [vals, setVals] = V.useState(() => Object.fromEntries(MF_NUTR.map(([k]) => [k, mfStr(initial.per100[k])]))),
    [pw, setPw] = V.useState(String(initial.portion)),
    [eaten, setEaten] = V.useState(String(entry?.grams || (mode === "manual" ? 100 : product?.portion || 100))),
    [when, setWhen] = V.useState(() => ({
      type: entry?.meal || data.meal || st.mealDraftType || st.lastMealType || "Завтрак",
      date: entry?.date || data.date || st.mealDraftDate || today,
      time: entry?.time || data.time || st.mealDraftTime || st.controls.clock,
    })),
    [open, setOpen] = V.useState(mode === "manual"),
    [touched, setTouched] = V.useState({}),
    [focus, setFocus] = V.useState(null),
    [typeSheet, setTypeSheet] = V.useState(!1),
    [baseline, setBaseline] = V.useState(null),
    titleRef = V.useRef(null),
    pwN = mfNum(pw),
    eatenN = mfNum(eaten),
    numVals = Object.fromEntries(MF_NUTR.map(([k]) => [k, mfNum(vals[k])])),
    per100 = Object.fromEntries(
      MF_NUTR.map(([k]) => [k, basis === "100" ? numVals[k] : (numVals[k] * 100) / pwN]),
    ),
    bad = (v, lim) => !Number.isFinite(v) || v < 0 || v > lim,
    fieldBad = {
      ...Object.fromEntries(MF_NUTR.map(([k]) => [k, bad(numVals[k], MF_LIMIT[k])])),
      portion: basis === "portion" && (bad(pwN, MF_LIMIT.portion) || pwN <= 0),
      eaten: bad(eatenN, MF_LIMIT.eaten) || eatenN <= 0,
    },
    tooBig = {
      ...Object.fromEntries(MF_NUTR.map(([k]) => [k, numVals[k] > MF_LIMIT[k]])),
      portion: pwN > MF_LIMIT.portion,
      eaten: eatenN > MF_LIMIT.eaten,
    },
    showBad = (k) => fieldBad[k] && (touched[k] || tooBig[k]),
    valuesOk = MF_NUTR.every(([k]) => !fieldBad[k]) && !fieldBad.portion && !fieldBad.eaten,
    canAdd = valuesOk && name.trim().length > 0 && !st.pending.includes("diary"),
    totals = Object.fromEntries(MF_NUTR.map(([k]) => [k, (per100[k] * eatenN) / 100])),
    snapshot = JSON.stringify([name.trim(), MF_NUTR.map(([k]) => mfRound(per100[k] || 0)), pwN, eatenN, when]),
    base = baseline ?? snapshot;
  V.useEffect(() => {
    baseline === null && setBaseline(snapshot);
  }, []);
  const dirty = base !== snapshot,
    productDirty =
      JSON.stringify([name.trim(), MF_NUTR.map(([k]) => mfRound(per100[k] || 0)), pwN]) !==
      JSON.stringify(JSON.parse(base).slice(0, 3)),
    saved = st.favorites.includes(pid) || st.products.some((p) => p.id === pid && p.own),
    order = ["title", ...(basis === "portion" ? ["portion"] : []), ...MF_NUTR.map(([k]) => k), "eaten"],
    keyboard = st.controls.keyboard && focus,
    nameLong = name.length > 100,
    dayLabel = mfDayLabel(when.date, today);

  V.useLayoutEffect(() => {
    const el = titleRef.current;
    el && ((el.style.height = "auto"), (el.style.height = `${el.scrollHeight}px`));
  }, [name, nameLong]);

  const setField = (k, v) => {
      const next = mfNum(v),
        lim = k === "portion" ? MF_LIMIT.portion : k === "eaten" ? MF_LIMIT.eaten : MF_LIMIT[k],
        prev = k === "portion" ? pwN : k === "eaten" ? eatenN : numVals[k];
      next > lim && !(prev > lim) && mfToast(MF_TOO_BIG, "toast.attention");
      k === "portion" ? setPw(v) : k === "eaten" ? setEaten(v) : setVals((s) => ({ ...s, [k]: v }));
    },
    blur = (k) => () => {
      setTouched((t) => ({ ...t, [k]: !0 })), setFocus((f) => (f === k ? null : f));
    },
    switchBasis = (b) => {
      if (b === basis) return;
      const w = Number.isFinite(pwN) && pwN > 0 ? pwN : 100;
      setVals((s) =>
        Object.fromEntries(
          MF_NUTR.map(([k]) => {
            const v = mfNum(s[k]);
            return [k, Number.isFinite(v) ? mfStr(b === "portion" ? (v * w) / 100 : (v * 100) / w) : s[k]];
          }),
        ),
      );
      Number.isFinite(pwN) && pwN > 0 ? 0 : setPw("100");
      setBasis(b);
    },
    stepEaten = (d) => {
      const v = Number.isFinite(eatenN) ? eatenN : 0;
      setEaten(String(Math.min(MF_LIMIT.eaten, Math.max(1, Math.round((v + d) / 10) * 10))));
    },
    goNext = () => {
      const i = order.indexOf(focus);
      if (i < 0 || i === order.length - 1) return mfHideKeyboard();
      const nextKey = order[i + 1],
        el =
          nextKey === "title"
            ? titleRef.current
            : document.querySelector(`.mf-page [data-mf-field="${nextKey}"]`);
      el ? el.focus() : mfHideKeyboard();
    },
    productPayload = () => ({
      id: pid,
      name: name.trim(),
      ...Object.fromEntries(MF_NUTR.map(([k]) => [k, mfRound(per100[k])])),
      portion: basis === "portion" ? pwN : product?.portion || entry?.portionWeight || 100,
      own: !0,
    }),
    entryPayload = (id) => ({
      ...(entry || {}),
      id,
      kind: "meal",
      name: name.trim(),
      date: when.date,
      time: when.time,
      meal: when.type,
      provider: "manual",
      productId: pid,
      grams: eatenN,
      unit: "г",
      value: Math.round(totals.calories),
      proteins: mfRound(totals.proteins),
      fats: mfRound(totals.fats),
      carbs: mfRound(totals.carbs),
      per100: Object.fromEntries(MF_NUTR.map(([k]) => [k, mfRound(per100[k])])),
      portionWeight: basis === "portion" ? pwN : entry?.portionWeight || 100,
    }),
    add = async () => {
      if (!canAdd) {
        setTouched(Object.fromEntries(order.map((k) => [k, !0])));
        return;
      }
      mfHideKeyboard();
      const e = entryPayload(N.id());
      (await N.run("diary", (s) => {
        s.entries.push(e),
          (s.sheet = null),
          (s.flow = null),
          (s.tab = "stats"),
          (s.date = e.date),
          (s.lastMealType = e.meal),
          (s.mealDraftType = s.mealDraftDate = s.mealDraftTime = null),
          (s.stacks.stats = ["stats", "detail-meal"]),
          mlReveal(s, e.meal),
          (s.toast = s.toastPill = `Добавлено в ${e.meal.toLowerCase()}: ${e.name}`),
          (s.toastIcon = "toast.check-circle");
      })) || 0;
    },
    saveEntry = async () => {
      if (!canAdd) {
        setTouched(Object.fromEntries(order.map((k) => [k, !0])));
        return;
      }
      mfHideKeyboard();
      const e = entryPayload(entry.id);
      (await N.run("diary", (s) => {
        const i = s.entries.findIndex((x) => x.id === e.id);
        i >= 0 && (s.entries[i] = e), (s.toast = s.toastPill = "Информация обновлена"), (s.toastIcon = "toast.check-circle");
      })) && setBaseline(snapshot);
    },
    saveOwn = async () => {
      if (!valuesOk || !name.trim()) {
        setTouched(Object.fromEntries(order.map((k) => [k, !0])));
        return;
      }
      mfHideKeyboard();
      const p = productPayload();
      (await N.run("products", (s) => {
        const i = s.products.findIndex((x) => x.id === p.id);
        i >= 0 ? (s.products[i] = { ...s.products[i], ...p }) : s.products.push(p),
          s.favorites.includes(p.id) || s.favorites.push(p.id),
          (s.toast = s.toastPill = "Информация о блюде обновлена"),
          (s.toastIcon = "toast.check-circle");
      })) && setBaseline(snapshot);
    },
    toggleSaved = () => {
      if (saved) {
        N.update((s) => {
          (s.favorites = s.favorites.filter((x) => x !== pid)),
            (s.products = s.products.filter((p) => !(p.id === pid && p.own && !zp.some((z) => z.id === pid))));
        });
        mfToast("Блюдо удалено из «Мои блюда»", "toast.heart");
        return;
      }
      if (!name.trim() || MF_NUTR.some(([k]) => fieldBad[k])) {
        setTouched(Object.fromEntries(order.map((k) => [k, !0])));
        mfToast("Заполните название и пищевую ценность", "toast.attention");
        return;
      }
      const p = productPayload();
      N.update((s) => {
        const i = s.products.findIndex((x) => x.id === p.id);
        i >= 0 ? (s.products[i] = { ...s.products[i], ...p, own: s.products[i].own || p.own }) : s.products.push(p),
          s.favorites.includes(p.id) || s.favorites.push(p.id);
      });
      mfToast("Блюдо добавлено в «Мои блюда»", "toast.heart");
    };

  /* шапка; в варианте B приём — в нижней панели, в шапке только дата и время */
  const barTypes = mode !== "entry" && (st.controls.typePlace ?? "title") === "bar",
    header = n.jsxs("header", {
    className: "mf-header",
    children: [
      n.jsx(MfIconButton, {
        label: mode === "manual" || mode === "entry" ? "Закрыть" : "Назад",
        icon: mode === "manual" || mode === "entry" ? "close" : "back",
        size: mode === "manual" || mode === "entry" ? 16 : 18,
        onClick: () => (mfHideKeyboard(), N.back()),
      }),
      n.jsxs("button", {
        type: "button",
        className: "mf-type",
        "aria-label": `Тип и время приёма: ${when.type}, ${dayLabel}, ${when.time}`,
        onClick: () => (mfHideKeyboard(), setTypeSheet(!0)),
        children: [
          n.jsxs("span", {
            className: "mf-type-main",
            children: [
              n.jsx(Q, { name: barTypes ? "ic.statistic.sleep.picker.clock" : "icon.food.fork_knife", size: 20 }),
              n.jsx($, { token: "assastiveTextL", children: barTypes ? `${dayLabel}, ${when.time}` : when.type }),
              n.jsx(Q, { name: "icon.chevron.down", size: 12 }),
            ],
          }),
          !barTypes && n.jsx($, { token: "number3M", className: "mf-type-sub", children: `${dayLabel}, ${when.time}` }),
        ],
      }),
      n.jsxs("div", {
        className: "mf-header-right",
        children: [
          mode === "own"
            ? n.jsx(MfIconButton, {
                label: "Сохранить изменения блюда",
                icon: "ic.measurements.save",
                size: 22,
                disabled: !productDirty || st.pending.includes("products"),
                onClick: () => void saveOwn(),
              })
            : n.jsx(MfIconButton, {
                label: saved ? "Убрать из «Мои блюда»" : "Сохранить в «Мои блюда»",
                icon: saved ? "heart-fill" : "heart",
                active: saved,
                onClick: toggleSaved,
              }),
          mode === "entry" &&
            n.jsx(MfIconButton, {
              label: "Удалить запись",
              icon: "icon.trash",
              size: 18,
              disabled: entry?.provider === "apple",
              onClick: () => N.sheet("confirm", { action: "delete-entry", entryId: entry.id }),
            }),
        ],
      }),
    ],
  });

  /* заголовок-название */
  const title = n.jsxs("section", {
    className: "mf-top",
    children: [
      header,
      mode === "own" &&
        n.jsxs("span", {
          className: "mf-badge",
          children: [n.jsx(Q, { name: "heart-fill", size: 14 }), "Мои блюда"],
        }),
      n.jsxs("div", {
        className: "mf-title-wrap",
        children: [
          n.jsx("textarea", {
            ref: titleRef,
            className: `mf-title ${nameLong ? "long" : ""} ${touched.title && !name.trim() ? "invalid" : ""}`,
            "aria-label": "Название блюда",
            placeholder: "Введите, что вы ели",
            rows: 1,
            maxLength: MF_NAME_MAX,
            value: name,
            onChange: (e) => setName(e.target.value),
            onFocus: () => setFocus("title"),
            onBlur: blur("title"),
          }),
          focus === "title" &&
            name &&
            n.jsx("button", {
              className: "mf-clear",
              "aria-label": "Очистить название",
              onPointerDown: (e) => e.preventDefault(),
              onClick: () => setName(""),
              children: n.jsx(Q, { name: "clear-circle", size: 20 }),
            }),
        ],
      }),
      n.jsx($, {
        token: "capsSign",
        className: `mf-hint ${name.length >= MF_NAME_MAX ? "limit" : ""}`,
        children:
          name.length >= 100
            ? `${name.length}/${MF_NAME_MAX}`
            : name
              ? "НАЖМИТЕ НА НАЗВАНИЕ, ЧТОБЫ ОТРЕДАКТИРОВАТЬ"
              : "НАЖМИТЕ, ЧТОБЫ ВВЕСТИ ТЕКСТ",
      }),
    ],
  });

  /* пищевая ценность */
  const collapsedValues = basis === "100" ? per100 : numVals,
    collapsedGrams = basis === "100" ? 100 : pwN,
    nutrition = n.jsxs("section", {
      className: "mf-card",
      children: [
        n.jsxs("button", {
          type: "button",
          className: "mf-card-head",
          "aria-expanded": open,
          onClick: () => setOpen(!open),
          children: [
            n.jsx($, { token: "answer1L", children: "Пищевая ценность" }),
            n.jsx(Q, { name: "icon.chevron.down", size: 14, className: open ? "mf-rot" : "" }),
          ],
        }),
        open
          ? n.jsxs(n.Fragment, {
              children: [
                n.jsx("div", {
                  className: "mf-seg",
                  role: "radiogroup",
                  "aria-label": "Значения указаны",
                  children: [
                    ["100", "100 г"],
                    ["portion", "Порция"],
                  ].map(([v, l]) =>
                    n.jsx(
                      "button",
                      {
                        type: "button",
                        role: "radio",
                        "aria-checked": basis === v,
                        onClick: () => switchBasis(v),
                        children: l,
                      },
                      v,
                    ),
                  ),
                }),
                basis === "portion" &&
                  n.jsx(MfField, {
                    id: "portion",
                    label: "Вес порции",
                    icon: "ic.statistic.meal",
                    unit: "г",
                    value: pw,
                    focused: focus === "portion",
                    invalid: showBad("portion"),
                    onChange: (v) => setField("portion", v),
                    onFocus: () => setFocus("portion"),
                    onBlur: blur("portion"),
                  }),
                MF_NUTR.map(([k, label, icon, unit]) =>
                  n.jsx(
                    MfField,
                    {
                      id: k,
                      label,
                      icon: `icon.food.${icon}`,
                      unit,
                      value: vals[k],
                      focused: focus === k,
                      invalid: showBad(k),
                      onChange: (v) => setField(k, v),
                      onFocus: () => setFocus(k),
                      onBlur: blur(k),
                    },
                    k,
                  ),
                ),
              ],
            })
          : n.jsxs("div", {
              className: "mf-collapsed",
              children: [
                n.jsxs($, {
                  token: "number2M",
                  children: [mfFmt(collapsedValues.calories), " ккал", n.jsx("i", { children: "·" }), mfFmt(collapsedGrams), " г"],
                }),
                n.jsx(MfMacros, { values: collapsedValues }),
              ],
            }),
      ],
    });

  /* съеденное количество */
  const amount = n.jsxs("section", {
    className: "mf-card",
    children: [
      n.jsx($, { as: "h3", token: "answer1L", className: "mf-card-title", children: "Съеденное количество" }),
      n.jsxs("div", {
        className: "mf-amount",
        children: [
          n.jsxs("label", {
            className: `mf-input wide ${focus === "eaten" ? "focused" : ""} ${showBad("eaten") ? "invalid" : ""}`,
            children: [
              n.jsx("input", {
                "data-mf-field": "eaten",
                "aria-label": "Съеденное количество, г",
                inputMode: "decimal",
                value: eaten,
                size: 1,
                onChange: (e) => setField("eaten", e.target.value),
                onFocus: () => setFocus("eaten"),
                onBlur: blur("eaten"),
              }),
              n.jsx("span", { className: "mf-unit", children: "г" }),
            ],
          }),
          n.jsx("button", {
            type: "button",
            className: "mf-step",
            "aria-label": "Уменьшить на 10 г",
            onClick: () => stepEaten(-10),
            children: n.jsx(Q, { name: "entry-minus", size: 22 }),
          }),
          n.jsx("button", {
            type: "button",
            className: "mf-step",
            "aria-label": "Увеличить на 10 г",
            onClick: () => stepEaten(10),
            children: n.jsx(Q, { name: "entry-plus", size: 22 }),
          }),
        ],
      }),
      basis === "portion" &&
        Number.isFinite(pwN) &&
        pwN > 0 &&
        n.jsx("div", {
          className: "mf-portions",
          children: [
            [0.5, "½ порции"],
            [1, "1 порция"],
            [2, "2 порции"],
          ].map(([m, l]) =>
            n.jsx(
              "button",
              {
                type: "button",
                "aria-pressed": eatenN === mfRound(pwN * m),
                onClick: () => setEaten(mfStr(pwN * m)),
                children: l,
              },
              l,
            ),
          ),
        }),
    ],
  });

  /* нижняя панель */
  const showBar = !keyboard && (mode !== "entry" || dirty),
    bar =
      showBar &&
      n.jsxs("footer", {
        className: "mf-bar",
        children: [
          valuesOk && n.jsx(MfSummary, { kcal: totals.calories, grams: eatenN, values: totals }),
          /* вариант B «Где менять приём»: SegmentedControl над кнопкой */
          barTypes &&
            n.jsx("div", {
              className: "mf-seg mf-bar-types",
              role: "radiogroup",
              "aria-label": "Приём пищи",
              children: MF_TYPES.map((t) =>
                n.jsx("button", { type: "button", role: "radio", "aria-checked": t === when.type, onClick: () => setWhen((w) => ({ ...w, type: t })), children: t }, t),
              ),
            }),
          n.jsx(re, {
            className: "mf-primary",
            disabled: !canAdd,
            onClick: () => void (mode === "entry" ? saveEntry() : add()),
            children: mode === "entry" ? "Сохранить изменения" : `Добавить в ${when.type.toLowerCase()}`,
          }),
        ],
      });

  return n.jsxs("div", {
    className: `mf-page ${keyboard ? "with-keyboard" : ""}`,
    children: [
      n.jsxs("div", { className: "mf-scroll scroll", children: [title, nutrition, amount] }),
      bar,
      keyboard &&
        n.jsx("button", {
          type: "button",
          className: "mf-accessory",
          onPointerDown: (e) => e.preventDefault(),
          onClick: goNext,
          children: focus === "title" || order.indexOf(focus) === order.length - 1 ? "Готово" : "Далее",
        }),
      typeSheet &&
        n.jsx(MfTypeSheet, {
          value: when,
          today,
          onClose: () => setTypeSheet(!1),
          onSave: (v) => {
            setWhen(v), setTypeSheet(!1);
          },
        }),
    ],
  });
}

/* ---------- распознавание по фото ---------- */
var MF_PHOTO = "assets/demo-meal.svg";
var MF_RECOGNIZED = [
  { name: "Пицца пепперони и роллы с лососем", value: 486, grams: 260, proteins: 21.4, fats: 18.2, carbs: 58.6 },
  { name: "Куриная грудка с рисом и овощами", value: 412, grams: 320, proteins: 38.5, fats: 9.1, carbs: 44.2 },
  { name: "Овощной салат с лососем", value: 318, grams: 240, proteins: 22.8, fats: 19.4, carbs: 11.6 },
];

function mfStartRecognition() {
  const id = N.id(),
    outcome = N.state.controls.next,
    epoch = N.epoch;
  N.update((s) => {
    s.controls.next = "success";
    s.entries.push({
      id,
      kind: "meal",
      recognizing: !0,
      name: "Идёт распознавание",
      date: s.mealDraftDate || s.date,
      time: s.mealDraftTime || s.controls.clock,
      meal: s.mealDraftType || s.lastMealType || "Завтрак",
      value: 0,
      grams: 0,
      proteins: 0,
      fats: 0,
      carbs: 0,
      provider: "manual",
    });
  });
  N.update((s) => {
    s.mealDraftType = s.mealDraftDate = s.mealDraftTime = null;
  });
  N.log("recognition: начало");
  const t = setTimeout(() => {
    N.jobs.delete(t);
    if (epoch !== N.epoch) return;
    N.update((s) => {
      const e = s.entries.find((x) => x.id === id);
      if (!e) return;
      if (outcome === "error" || outcome === "empty") {
        Object.assign(e, { recognizing: !1, recognizeError: !0, name: "Не удалось распознать еду" });
      } else {
        const r = MF_RECOGNIZED[s.entries.filter((x) => x.recognized).length % MF_RECOGNIZED.length];
        Object.assign(e, r, { recognizing: !1, recognized: !0 });
      }
    });
    N.log(`recognition: ${outcome === "error" || outcome === "empty" ? "ошибка" : "готово"}`);
  }, Math.max(2500, N.state.controls.delay * 4));
  N.jobs.set(t, () => {});
}
function mfUsePhoto() {
  N.update((s) => {
    (s.sheet = null),
      (s.flow = null),
      (s.tab = "stats"),
      s.stacks.stats.at(-1) !== "detail-meal" && (s.stacks.stats = ["stats", "detail-meal"]),
      s.mealRecognitionHintHidden || (s.sheet = { kind: "meal-recognition-info", data: {} });
  });
  mfStartRecognition();
}

function MealCamera({ gallery }) {
  const [shot, setShot] = V.useState(!!gallery);
  return n.jsxs("div", {
    className: "mf-camera",
    role: "dialog",
    "aria-label": shot ? "Предпросмотр фото" : "Камера",
    children: [
      !shot &&
        n.jsxs("div", {
          className: "mf-camera-top",
          children: [
            n.jsx("button", {
              "aria-label": "Закрыть камеру",
              onClick: () => N.back(),
              children: n.jsx(Q, { name: "close", size: 16 }),
            }),
            n.jsx("button", { "aria-label": "Вспышка", children: "ϟ" }),
          ],
        }),
      n.jsxs("div", {
        className: `mf-viewfinder ${shot ? "shot" : ""}`,
        children: [
          n.jsx("img", { src: MF_PHOTO, alt: "Кадр с едой" }),
          !shot && n.jsx("i", { className: "mf-frame", "aria-hidden": "true" }),
        ],
      }),
      shot
        ? n.jsxs("div", {
            className: "mf-camera-preview",
            children: [
              n.jsx("button", { onClick: () => setShot(!1), children: "Переснять" }),
              n.jsx("button", { onClick: mfUsePhoto, children: "Использовать" }),
            ],
          })
        : n.jsxs("div", {
            className: "mf-camera-controls",
            children: [
              n.jsx("button", {
                className: "mf-cam-side round",
                "aria-label": "Загрузить фото из галереи",
                onClick: () => setShot(!0),
                children: n.jsx("img", { src: "assets/icon.food.gallery.svg", width: 22, height: 22, alt: "" }),
              }),
              n.jsx("button", {
                className: "mf-shutter",
                "aria-label": "Сделать фото",
                onClick: () => setShot(!0),
              }),
              n.jsx("button", { className: "mf-cam-side round", "aria-label": "Сменить камеру", children: "↻" }),
            ],
          }),
    ],
  });
}

function MealRecognitionInfo() {
  return n.jsxs("div", {
    className: "mf-recognition-info",
    children: [
      n.jsx(Q, { name: "food.recognition.logo", size: 132 }),
      n.jsx($, { as: "h2", token: "answer0L", children: "Идёт распознавание еды" }),
      n.jsx("p", {
        children:
          "После распознавания еда появится в списке приёмов пищи. Результат можно будет проверить и отредактировать.",
      }),
      n.jsx(re, { className: "mf-primary", onClick: () => N.back(), children: "Отлично" }),
      n.jsx("button", {
        className: "mf-text-btn",
        onClick: () =>
          N.update((s) => {
            (s.mealRecognitionHintHidden = !0), (s.sheet = null);
          }),
        children: "Больше не показывать",
      }),
    ],
  });
}

/* строка «Идёт распознавание» / ошибка в списке приёмов пищи */
function MealRecognitionRow({ entry }) {
  return entry.recognizing
    ? n.jsxs("div", {
        className: "meal-history-row mf-recognizing",
        role: "status",
        children: [
          n.jsx(Q, { name: "chat.sparkles.ai.cell", size: 20 }),
          n.jsxs("span", {
            children: [
              n.jsx($, { token: "assastiveTextL", children: "Идёт распознавание" }),
              n.jsx($, { token: "number3M", children: "Распознаём продукты и считаем КБЖУ…" }),
            ],
          }),
        ],
      })
    : n.jsxs("button", {
        className: "meal-history-row mf-recognizing error",
        onClick: () => {
          N.update((s) => {
            s.entries = s.entries.filter((x) => x.id !== entry.id);
          });
          N.sheet("entry", { kind: "meal" });
        },
        children: [
          n.jsx(Q, { name: "food.recognition.error-attention-triangle", size: 20 }),
          n.jsxs("span", {
            children: [
              n.jsx($, { token: "assastiveTextL", children: "Не удалось распознать еду" }),
              n.jsx($, { token: "number3M", children: "Нажмите, чтобы добавить вручную" }),
            ],
          }),
        ],
      });
}
