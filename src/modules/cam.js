/* =====================================================================
 * Умная камера — 3 варианта (2026-11-16). Переключатель «Поведение →
 * Умная камера» (state.controls.camVariant): auto / tabs / tray.
 * Открывается: панель «Экран → Питание → Умная камера» и кнопка камеры на
 * экране «Что было на …?» (nx.js). Только цвета прототипа, остальное своё.
 *   auto «Просто наведи» — режимов нет: коды ловятся сами, кнопка снимка
 *        сама понимает, еда это или этикетка.
 *   tabs «Три режима» — Еда / Код / Этикетка; у каждого своя рамка и свой
 *        способ (код — без кнопки); если в кадре не то — подсказка сменить.
 *        В «Еде» — мультифото до 3: снял → просмотр (ScPreview) → «Разобрать» или «+».
 *   tray «Как на кассе» — камера сверху, снизу копится список: можно
 *        отсканировать тарелку, кефир и батончик и добавить всё разом.
 * Общее: только живые фото — галереи нет (решение владельца 2026-11-26); вспышка; разбор тарелки на
 * продукты с весом, чтение этикетки, штрихкод и QR «Честного знака».
 * ПРОТОТИП: настоящей камеры нет — плашка «Перед камерой: …» меняет сцену
 * (тарелка / упаковка со штрихкодом / QR / этикетка). Данные демо.
 * ===================================================================== */

var SC_SCENES = [
  ["plate", "тарелка"],
  ["barcode", "батончик со штрихкодом"],
  ["qr", "кефир с QR-кодом"],
  ["label", "этикетка йогурта"],
];
var SC_RESULT = {
  barcode: { id: "nx-bar", name: "Батончик мюсли с орехами", per: { k: 412, p: 8.5, f: 14, c: 61 }, g: 35, src: "Штрихкод" },
  qr: { id: "nx-kefir", name: "Кефир 1%", per: { k: 40, p: 3, f: 1, c: 4 }, g: 250, src: "Честный знак" },
  label: { id: null, name: "", per: { k: 66, p: 7, f: 2, c: 4.3 }, g: 140, src: "Этикетка" },
};
var SC_PLATE = () =>
  [
    ["Куриная грудка запечённая", { k: 165, p: 31, f: 3.6, c: 0 }, 150],
    ["Рис отварной", { k: 130, p: 2.7, f: 0.3, c: 28 }, 180],
    ["Салат из огурцов и томатов", { k: 24, p: 1, f: 0.2, c: 4.6 }, 120],
  ].map(([name, per, g], i) => ({ key: "p" + i + N.id(), name, per, g, src: "Фото" }));

function scVar(s) {
  return s.controls.camVariant ?? "auto";
}
function scProducts(k) {
  return `${k} ${k % 10 === 1 && k % 100 !== 11 ? "продукт" : [2, 3, 4].includes(k % 10) && ![12, 13, 14].includes(k % 100) ? "продукта" : "продуктов"}`;
}
function scKcal(it) {
  return (it.per.k * it.g) / 100;
}
function scMeal(s, meal) {
  return meal || s.nxMeal || s.lastMealType || "Обед";
}
/* сохранить в журнал (тот же формат, что и в nx.js) */
function scSave(items, meal, onDone) {
  const st = N.state,
    list = items.map((it) => nxEntry({ id: it.id || null, name: it.name || "Продукт с этикетки", per: it.per }, it.g, meal, st.date, st.controls.clock));
  nxAddEntries(list, meal, `${nxDishes(list.length)} — ${NX_IN[meal]}`);
  onDone && onDone();
}

/* ---------- сцена «перед камерой» (имитация) ---------- */
function ScScene({ scene, frozen }) {
  return n.jsx("div", {
    className: `sc-scene s-${scene} ${frozen ? "frozen" : ""}`,
    "aria-hidden": "true",
    children:
      scene === "plate"
        ? n.jsx("img", { src: "assets/demo-meal.svg", alt: "" })
        : scene === "label"
          ? n.jsxs("div", {
              className: "sc-labelcard",
              children: [
                n.jsx("b", { children: "Пищевая ценность в 100 г" }),
                ...[
                  ["Белки", "7 г"],
                  ["Жиры", "2 г"],
                  ["Углеводы", "4,3 г"],
                  ["Энергетическая ценность", "66 ккал"],
                ].map(([a, b]) => n.jsxs("p", { children: [n.jsx("span", { children: a }), n.jsx("span", { children: b })] }, a)),
              ],
            })
          : n.jsxs("div", {
              className: `sc-pack ${scene}`,
              children: [
                n.jsx("b", { children: scene === "barcode" ? "МЮСЛИ" : "КЕФИР 1%" }),
                n.jsx("small", { children: scene === "barcode" ? "батончик с орехами" : "900 г" }),
                n.jsx("i", { className: "sc-code" }),
              ],
            }),
  });
}
function ScDemoPill({ scene, setScene }) {
  const i = SC_SCENES.findIndex((x) => x[0] === scene);
  return n.jsxs("button", {
    type: "button",
    className: "sc-demo",
    onClick: () => setScene(SC_SCENES[(i + 1) % SC_SCENES.length][0]),
    children: [n.jsx("em", { children: "прототип" }), " Перед камерой: ", n.jsx("b", { children: SC_SCENES[i][1] }), " ›"],
  });
}

/* ---------- иконки ---------- */
var SC_IC = {
  close: "M6 6l12 12M18 6L6 18",
  flash: "M13 3L5 14h6l-1 7 8-11h-6z",
  flashOff: "M13 3l-3 4M5 14h6l-1 7 4-5.5M15 10h3l-2.5 3.5M3 3l18 18",
  gallery: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5a1.5 1.5 0 1 0 0-.01",
  plate: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  code: "M4 6v12M7 6v12M10 6v12M14 6v12M16 6v12M20 6v12",
  label: "M6 3h12v18H6zM9 8h6M9 12h6M9 16h4",
  minus: "M5 12h14",
  plus: "M12 5v14M5 12h14",
  check: "M5 12l5 5 9-10",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  back: "M15 5l-7 7 7 7",
  retake: "M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4",
  trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  camPlus: "M3 8h3l2-3h6l2 3h1M21 13v6H3V8M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 3v6M17 6h6",
};
function ScI({ n: name, s = 22, w = 1.9 }) {
  return n.jsx("svg", {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: w,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    children: n.jsx("path", { d: SC_IC[name] }),
  });
}
function ScFlash({ on, set, cls = "" }) {
  return n.jsx("button", {
    type: "button",
    className: `sc-round ${cls} ${on ? "lit" : ""}`,
    "aria-pressed": on,
    "aria-label": on ? "Выключить вспышку" : "Включить вспышку",
    onClick: () => set(!on),
    children: n.jsx(ScI, { n: on ? "flash" : "flashOff", s: 20 }),
  });
}

/* ---------- результат (варианты auto и tabs) ---------- */
/* неудача кода / этикетки: не тупик — следующий шаг всегда есть */
var SC_FAIL = {
  codenf: ["Не нашли товар по коду", "Штрихкода 4607 0153 2210 4 нет в нашей базе. Снимите этикетку — посчитаем по ней.", [["label", "Снять этикетку"], ["again", "Сканировать снова"], ["manual", "Ввести вручную"]]],
  labelbad: ["Не получилось прочитать", "Цифры размыты или в тени. Снимите таблицу ровно, при хорошем свете.", [["retake", "Переснять"], ["manual", "Ввести вручную"]]],
};
function ScFail({ kind, onAct }) {
  const [t, d, acts] = SC_FAIL[kind];
  return n.jsxs("div", {
    className: "sc-result sc-fail",
    role: "alertdialog",
    "aria-label": t,
    children: [
      n.jsx("span", { className: "sc-fail-ic", children: n.jsx(ScI, { n: kind === "codenf" ? "code" : "label", s: 26 }) }),
      n.jsx("h2", { children: t }),
      n.jsx("p", { children: d }),
      acts.map(([k, l], i) => n.jsx("button", { type: "button", className: i ? "sc-sec" : "sc-cta", onClick: () => onAct(k), children: l }, k)),
    ],
  });
}
function scManual(meal, onClose) {
  const inNx = (N.state.nxLayers || []).length > 0;
  onClose();
  setTimeout(() => (inNx ? nxOpen({ k: "manual", meal: scMeal(N.state, meal) }) : N.sheet("entry", { kind: "meal" })), 0);
}
function ScResult({ kind, meal: m0, onBack, onDone, shots }) {
  const st = we(),
    multi = kind === "plate" && shots && shots.length > 0,
    [items, setItems] = V.useState(() => (multi ? scItemsFromShots(shots) : kind === "plate" ? SC_PLATE() : [{ ...SC_RESULT[kind], key: kind }])),
    [meal, setMeal] = V.useState(scMeal(st, m0)),
    [name, setName] = V.useState(""),
    on = items.filter((x) => !x.off),
    total = on.reduce((a, x) => a + scKcal(x), 0),
    upd = (key, fn) => setItems((xs) => xs.map((x) => (x.key === key ? fn(x) : x))),
    title = kind === "label" ? "Этикетка прочитана" : kind === "barcode" ? "Нашли по штрихкоду" : "Нашли по «Честному знаку»",
    ok = on.length && (kind !== "label" || name.trim());
  return n.jsxs("div", {
    className: "sc-result",
    role: "dialog",
    "aria-label": title,
    children: [
      n.jsxs("div", {
        className: "sc-res-h",
        children: [
          n.jsx("h2", { children: multi ? `На ${shots.length === 1 ? "фото" : `${shots.length} фото`} — ${scProducts(items.length)}` : kind === "plate" ? `На фото: ${on.length} из ${items.length}` : title }),
          n.jsx("button", { type: "button", onClick: onBack, children: multi || kind === "label" ? "К фото" : "Заново" }),
        ],
      }),
      multi && shots.length > 1 &&
        n.jsx("div", { className: "sc-res-shots", children: shots.map((sh, i) => n.jsxs("span", { children: [n.jsx("img", { src: sh.src, alt: "" }), n.jsx("i", { children: i + 1 })] }, sh.id)) }),
      kind === "label" &&
        n.jsxs("label", {
          className: "sc-name",
          children: [n.jsx("span", { children: "Как назвать продукт" }), n.jsx("input", { value: name, placeholder: "Например, йогурт греческий", onChange: (v) => setName(v.target.value) })],
        }),
      n.jsx("div", {
        className: "sc-items",
        children: items.map((x) =>
          n.jsxs(
            "div",
            {
              className: `sc-item ${x.off ? "off" : ""}`,
              children: [
                kind === "plate" &&
                  n.jsx("button", {
                    type: "button",
                    role: "checkbox",
                    "aria-checked": !x.off,
                    "aria-label": x.name,
                    className: "sc-check",
                    onClick: () => upd(x.key, (y) => ({ ...y, off: !y.off })),
                    children: !x.off && n.jsx(ScI, { n: "check", s: 15, w: 3 }),
                  }),
                n.jsxs("span", {
                  className: "sc-item-t",
                  children: [
                    n.jsxs("b", { children: [kind === "label" ? name || "Сколько съели" : x.name, multi && shots.length > 1 && n.jsxs("em", { className: "sc-ph", children: ["фото ", x.photo] })] }),
                    n.jsxs("small", { children: [nxN(scKcal(x)), " ккал · Б ", nxN((x.per.p * x.g) / 100, 1), " · Ж ", nxN((x.per.f * x.g) / 100, 1), " · У ", nxN((x.per.c * x.g) / 100, 1)] }),
                  ],
                }),
                n.jsxs("span", {
                  className: "sc-step",
                  children: [
                    n.jsx("button", { type: "button", "aria-label": "Меньше", onClick: () => upd(x.key, (y) => ({ ...y, g: Math.max(5, y.g - 10) })), children: n.jsx(ScI, { n: "minus", s: 15 }) }),
                    n.jsxs("b", { children: [x.g, " г"] }),
                    n.jsx("button", { type: "button", "aria-label": "Больше", onClick: () => upd(x.key, (y) => ({ ...y, g: y.g + 10 })), children: n.jsx(ScI, { n: "plus", s: 15 }) }),
                  ],
                }),
              ],
            },
            x.key,
          ),
        ),
      }),
      n.jsx("div", {
        className: "sc-meals",
        role: "radiogroup",
        "aria-label": "Приём пищи",
        children: NX_MEALS.map((x) => n.jsx("button", { type: "button", role: "radio", "aria-checked": x === meal, onClick: () => setMeal(x), children: x }, x)),
      }),
      n.jsx("button", {
        type: "button",
        className: "sc-cta",
        disabled: !ok,
        onClick: () => scSave(on.map((x) => (kind === "label" ? { ...x, name: name.trim() } : x)), meal, onDone),
        children: kind === "label" && !name.trim() ? "Назовите продукт" : `Добавить ${NX_IN[meal]} · ${nxN(total)} ккал`,
      }),
    ],
  });
}

/* ---------- мультифото: до 3 фото еды (решение владельца 2026-11-26) ----------
 * Сценарий: снял → сразу просмотр → «Разобрать» (главное) или «камера+» → ещё фото →
 * снова просмотр → у любого фото «Переснять» / «Заменить из галереи» / «Удалить» →
 * «Разобрать N фото» → один список продуктов со всех фото (у продукта — «фото N»).
 * Демо: у каждой картинки свой набор продуктов. Не из DS: стопка, слоты, просмотр. */
var SC_MAX = 3;
var SC_SHOT_SRC = ["assets/demo-meal.svg", "assets/demo-breakfast.svg", "assets/demo-salad.svg"];
var SC_BY_SRC = {
  "assets/demo-meal.svg": [
    ["Куриная грудка запечённая", { k: 165, p: 31, f: 3.6, c: 0 }, 150],
    ["Рис отварной", { k: 130, p: 2.7, f: 0.3, c: 28 }, 180],
    ["Салат из огурцов и томатов", { k: 24, p: 1, f: 0.2, c: 4.6 }, 120],
  ],
  "assets/demo-breakfast.svg": [
    ["Омлет из 2 яиц", { k: 154, p: 11, f: 12, c: 1.5 }, 130],
    ["Тост цельнозерновой", { k: 245, p: 9, f: 3.3, c: 43 }, 30],
  ],
  "assets/demo-salad.svg": [["Салат с зеленью и маслом", { k: 70, p: 1, f: 5.5, c: 4.5 }, 150]],
};
function scItemsFromShots(shots) {
  return shots.flatMap((sh, i) =>
    (SC_BY_SRC[sh.src] || []).map(([name, per, g], j) => ({ key: `s${i}-${j}-${N.id()}`, name, per, g, src: "Фото", photo: i + 1 })),
  );
}
function scNextSrc(shots, skip = -1) {
  const used = shots.filter((_, i) => i !== skip).map((x) => x.src);
  return SC_SHOT_SRC.find((x) => !used.includes(x)) || SC_SHOT_SRC[0];
}
function useScShots() {
  const [shots, setShots] = V.useState([]),
    [view, setView] = V.useState(null) /* null — камера, "preview" — просмотр */,
    [sel, setSel] = V.useState(0),
    [replace, setReplace] = V.useState(null) /* индекс, который переснимаем */,
    [confirm, setConfirm] = V.useState(!1),
    [blink, setBlink] = V.useState(!1);
  const api = {
    shots, view, sel, replace, confirm, blink,
    setView, setSel, setConfirm,
    left: SC_MAX - shots.length,
    shoot() {
      setBlink(!0), setTimeout(() => setBlink(!1), 180);
      if (replace !== null) {
        const i = replace;
        setShots((xs) => xs.map((x, k) => (k === i ? { id: N.id(), src: scNextSrc(xs, i) } : x)));
        setReplace(null), setSel(i), setView("preview");
        return;
      }
      /* главный путь: снял — сразу просмотр с «Разобрать»; ещё фото — по желанию */
      setShots((xs) => {
        const next = [...xs, { id: N.id(), src: scNextSrc(xs) }].slice(0, SC_MAX);
        setSel(next.length - 1);
        return next;
      });
      setView("preview");
    },
    retake(i) {
      setReplace(i), setView(null);
    },
    retakeCancel() {
      setReplace(null);
    },
    remove(i) {
      setShots((xs) => {
        const next = xs.filter((_, k) => k !== i);
        next.length ? setSel(Math.min(i, next.length - 1)) : setView(null);
        return next;
      });
    },
    reset() {
      setShots([]), setView(null), setSel(0), setReplace(null), setConfirm(!1);
    },
  };
  return api;
}
/* просмотр — сразу после снимка. Главное — «Разобрать». Ещё фото — плитка «+»
 * рядом с миниатюрой (возможность, не обязанность). На фото — «Переснять»,
 * сверху — «×» (выйти) и корзина (убрать это фото). Заменить из галереи =
 * корзина + «+» (в камере галерея всегда слева) — отдельная кнопка не нужна. */
function ScPreview({ m, onAnalyze, onExit }) {
  const cur = m.shots[m.sel] || m.shots[0];
  if (!cur) return null;
  return n.jsxs("div", {
    className: "sc-prev",
    role: "dialog",
    "aria-label": "Фото",
    children: [
      n.jsxs("div", {
        className: "sc-prev-img",
        children: [
          n.jsx("img", { src: cur.src, alt: `Фото ${m.sel + 1}` }, cur.id),
          n.jsxs("div", {
            className: "sc-prev-top",
            children: [
              n.jsx("button", { type: "button", className: "sc-glass", "aria-label": "Закрыть", onClick: onExit, children: n.jsx(ScI, { n: "close", s: 20 }) }),
              n.jsx("button", { type: "button", className: "sc-glass", "aria-label": `Убрать фото ${m.sel + 1}`, onClick: () => m.remove(m.sel), children: n.jsx(ScI, { n: "trash", s: 20 }) }),
            ],
          }),
          n.jsxs("button", { type: "button", className: "sc-glass wide", onClick: () => m.retake(m.sel), children: [n.jsx(ScI, { n: "retake", s: 18 }), "Переснять"] }),
        ],
      }),
      n.jsxs("div", {
        className: "sc-prev-bar",
        children: [
          n.jsxs("div", {
            className: "sc-thumbs",
            role: "tablist",
            "aria-label": "Фото",
            children: [
              m.shots.map((sh, i) =>
                n.jsx(
                  "button",
                  { type: "button", role: "tab", "aria-selected": i === m.sel, "aria-label": `Фото ${i + 1}`, className: "sc-thumb", onClick: () => m.setSel(i), children: n.jsx("img", { src: sh.src, alt: "" }) },
                  sh.id,
                ),
              ),
              m.left > 0 &&
                n.jsx("button", { type: "button", className: "sc-thumb is-add", "aria-label": "Снять ещё фото — откроется камера", onClick: () => m.setView(null), children: n.jsx(ScI, { n: "camPlus", s: 24 }) }),
            ],
          }),
          n.jsx("button", { type: "button", className: "sc-go", onClick: onAnalyze, children: "Разобрать" }),
        ],
      }),
    ],
  });
}
/* просмотр этикетки: одно фото, без «камера +»; главное — «Прочитать» */
function ScLabelPreview({ onRetake, onRead, onExit }) {
  return n.jsxs("div", {
    className: "sc-prev",
    role: "dialog",
    "aria-label": "Фото этикетки",
    children: [
      n.jsxs("div", {
        className: "sc-prev-img is-label",
        children: [
          n.jsx(ScScene, { scene: "label" }),
          n.jsx("div", {
            className: "sc-prev-top",
            children: n.jsx("button", { type: "button", className: "sc-glass", "aria-label": "Закрыть", onClick: onExit, children: n.jsx(ScI, { n: "close", s: 20 }) }),
          }),
          n.jsxs("button", { type: "button", className: "sc-glass wide", onClick: onRetake, children: [n.jsx(ScI, { n: "retake", s: 18 }), "Переснять"] }),
        ],
      }),
      n.jsx("div", { className: "sc-prev-bar", children: n.jsx("button", { type: "button", className: "sc-go", onClick: onRead, children: "Прочитать" }) }),
    ],
  });
}
function ScLeave({ n: k, onStay, onLeave }) {
  return n.jsx("div", {
    className: "sc-gal-wrap",
    onClick: (v) => v.target === v.currentTarget && onStay(),
    children: n.jsxs("div", {
      className: "sc-gal sc-leave",
      role: "alertdialog",
      "aria-label": "Удалить снятые фото?",
      children: [
        n.jsx("b", { children: `Удалить ${k === 1 ? "снятое фото" : `${k} снятых фото`}?` }),
        n.jsx("p", { children: "Они ещё не разобраны и не сохранены" }),
        n.jsx("button", { type: "button", className: "sc-cta", onClick: onStay, children: "Продолжить" }),
        n.jsx("button", { type: "button", className: "sc-ghost", onClick: onLeave, children: "Удалить и выйти" }),
      ],
    }),
  });
}
/* общий слой мультифото поверх камеры */
function ScMultiLayers({ m, c }) {
  return n.jsxs(n.Fragment, {
    children: [
      m.blink && n.jsx("i", { className: "sc-blink" }),
      m.view === "preview" && !c.busy && !c.result && n.jsx(ScPreview, { m, onAnalyze: () => scAnalyze(c, "plate"), onExit: () => m.setConfirm(!0) }),
    ],
  });
}

/* ---------- общее состояние камеры ---------- */
function useScCam(initial = "plate") {
  const [scene, setScene] = V.useState(initial),
    [flash, setFlash] = V.useState(!1),
    [busy, setBusy] = V.useState(null),
    [result, setResult] = V.useState(null);
  return { scene, setScene, flash, setFlash, busy, setBusy, result, setResult };
}
function scAnalyze(c, kind) {
  c.setBusy(kind);
  setTimeout(() => (c.setBusy(null), c.setResult(kind)), 1300);
}

/* ===== A · Просто наведи ===== */
function ScAuto({ meal, onClose, onDone }) {
  const c = useScCam(),
    code = c.scene === "barcode" || c.scene === "qr",
    [seen, setSeen] = V.useState(null);
  V.useEffect(() => {
    setSeen(null);
    if (!code || c.result || c.busy) return;
    const t = setTimeout(() => setSeen(c.scene), 900);
    return () => clearTimeout(t);
  }, [c.scene, c.result, c.busy]);
  const shoot = () => (code ? setSeen(c.scene) : scAnalyze(c, c.scene));
  return n.jsxs("div", {
    className: `sc sc-auto ${c.flash ? "flash" : ""}`,
    role: "dialog",
    "aria-label": "Умная камера",
    children: [
      n.jsx(ScScene, { scene: c.result ? (c.result === "label" ? "label" : "plate") : c.scene, frozen: !!(c.busy || c.result) }),
      c.busy && n.jsxs("div", { className: "sc-busy", children: [n.jsx("i", {}), n.jsx("p", { children: c.busy === "label" ? "Читаем этикетку…" : "Ищем продукты на фото…" })] }),
      !c.result &&
        n.jsxs(n.Fragment, {
          children: [
            n.jsxs("div", {
              className: "sc-top",
              children: [
                n.jsx("button", { type: "button", className: "sc-round", "aria-label": "Закрыть", onClick: onClose, children: n.jsx(ScI, { n: "close", s: 20 }) }),
                n.jsx(ScFlash, { on: c.flash, set: c.setFlash }),
              ],
            }),
            !c.busy &&
              n.jsxs("div", {
                className: "sc-auto-hint",
                children: [
                  n.jsx("p", { children: "Наведите на еду, этикетку или код" }),
                  n.jsx("div", {
                    className: "sc-caps",
                    children: [
                      ["plate", "Еда"],
                      ["label", "Этикетка"],
                      ["barcode", "Штрихкод"],
                      ["qr", "QR"],
                    ].map(([k, l]) => n.jsx("span", { className: (seen || c.scene) === k ? "on" : "", children: l }, k)),
                  }),
                ],
              }),
            seen &&
              n.jsxs("button", {
                type: "button",
                className: "sc-found",
                onClick: () => c.setResult(seen),
                children: [
                  n.jsx("span", { className: "sc-found-ic", children: n.jsx(ScI, { n: "code", s: 20 }) }),
                  n.jsxs("span", { className: "sc-found-t", children: [n.jsx("small", { children: SC_RESULT[seen].src }), n.jsx("b", { children: SC_RESULT[seen].name }), n.jsxs("em", { children: [SC_RESULT[seen].per.k, " ккал в 100 г"] })] }),
                  n.jsx("span", { className: "sc-found-go", children: "Добавить" }),
                ],
              }),
            n.jsxs("div", {
              className: "sc-bottom",
              children: [
                n.jsx(ScDemoPill, { scene: c.scene, setScene: c.setScene }),
                n.jsxs("div", {
                  className: "sc-shoot",
                  children: [
                    n.jsx("span", { className: "sc-round big ghost" }),
                    n.jsx("button", { type: "button", className: "sc-shutter", "aria-label": "Снять", disabled: !!c.busy, onClick: shoot }),
                    n.jsx("span", { className: "sc-round big ghost" }),
                  ],
                }),
              ],
            }),
          ],
        }),
      c.result && n.jsx(ScResult, { kind: c.result, meal, onBack: () => c.setResult(null), onDone }),
    ],
  });
}

/* ===== B · Три режима ===== */
var SC_TABS = [
  ["plate", "Еда", "plate", "Снимите тарелку сверху целиком"],
  ["code", "Код", "code", "Штрихкод или QR «Честного знака» — сработает само"],
  ["label", "Этикетка", "label", "Таблица «Пищевая ценность» — ровно в рамку"],
];
function ScTabs({ meal, onClose, onDone }) {
  const c = useScCam(),
    m = useScShots(),
    close = () => (m.shots.length ? m.setConfirm(!0) : onClose()),
    [mode, setModeRaw] = V.useState("plate"),
    /* прототип: настоящей камеры нет — «в кадре» то, что соответствует режиму */
    st = we(),
    codeCase = st.controls.camCode ?? "found" /* панель: found / qr / notfound */,
    labelCase = st.controls.camLabel ?? "ok" /* панель: ok / bad */,
    setMode = (k) => (setModeRaw(k), c.setScene(k === "code" ? (codeCase === "qr" ? "qr" : "barcode") : k), setLabelShot(!1)),
    /* этикетка: одно фото → просмотр «Переснять / Прочитать» (без «камера +») */
    [labelShot, setLabelShot] = V.useState(!1),
    act = (k) =>
      k === "label" ? (c.setResult(null), setMode("label")) : k === "again" ? (c.setResult(null), setMode("code")) : k === "retake" ? (c.setResult(null), setLabelShot(!1)) : scManual(meal, onClose);
  /* код: находится сам, без снимка и без просмотра → сразу продукт (или «не нашли») */
  V.useEffect(() => {
    if (mode !== "code" || c.result || c.busy) return;
    const t = setTimeout(() => c.setResult(codeCase === "notfound" ? "codenf" : codeCase === "qr" ? "qr" : "barcode"), 1100);
    return () => clearTimeout(t);
  }, [mode, c.result, c.busy, codeCase]);
  return n.jsxs("div", {
    className: `sc sc-tabs m-${mode} ${c.flash ? "flash" : ""}`,
    role: "dialog",
    "aria-label": "Умная камера",
    children: [
      n.jsx(ScScene, { scene: c.result ? (c.result === "label" ? "label" : c.result === "plate" ? "plate" : c.scene) : c.scene, frozen: !!(c.busy || c.result) }),
      c.busy &&
        n.jsxs("div", {
          className: "sc-busy",
          children: [n.jsx("i", {}), n.jsx("p", { children: c.busy === "label" ? "Читаем этикетку…" : m.shots.length > 1 ? `Разбираем ${m.shots.length} фото…` : "Ищем продукты на фото…" })],
        }),
      !c.result &&
        n.jsxs(n.Fragment, {
          children: [
            /* верх: только выход. Есть снятые фото — «‹» назад к ним, а не «×» */
            n.jsxs("div", {
              className: "sc-top",
              children: [
                m.shots.length
                  ? n.jsx("button", { type: "button", className: "sc-glass", "aria-label": "Назад к снятым фото", onClick: () => (m.setView("preview"), m.retakeCancel && m.retakeCancel()), children: n.jsx(ScI, { n: "back", s: 20 }) })
                  : n.jsx("button", { type: "button", className: "sc-glass", "aria-label": "Закрыть", onClick: close, children: n.jsx(ScI, { n: "close", s: 20 }) }),
                n.jsx("span", { className: "sc-glass ghost" }),
              ],
            }),
            !c.busy && n.jsx("div", { className: "sc-aim", children: n.jsx("i", { className: "sc-frame" }) }),
            /* меню: режимы — строкой текста над затвором; галерея слева, вспышка справа */
            n.jsxs("div", {
              className: "sc-dock",
              children: [
                n.jsx("div", {
                  className: "sc-modes2",
                  role: "tablist",
                  "aria-label": "Что снимаем",
                  children: SC_TABS.map(([k, l]) => n.jsx("button", { type: "button", role: "tab", "aria-selected": k === mode, onClick: () => setMode(k), children: l }, k)),
                }),
                n.jsxs("div", {
                  className: "sc-row",
                  children: [
                    n.jsx("span", { className: "sc-glass ghost" }),
                    mode === "code"
                      ? n.jsx("span", { className: "sc-shutter is-scan", role: "status", "aria-label": "Ищем код", children: n.jsx("i", {}) })
                      : n.jsx("button", { type: "button", className: "sc-shutter", "aria-label": "Снять", disabled: !!c.busy, onClick: () => (mode === "plate" ? m.shoot() : setLabelShot(!0)) }),
                    n.jsx(ScFlash, { on: c.flash, set: c.setFlash, cls: "sc-glass" }),
                  ],
                }),
              ],
            }),
          ],
        }),
      n.jsx(ScMultiLayers, { m, c }),
      labelShot &&
        !c.busy &&
        !c.result &&
        n.jsx(ScLabelPreview, { onRetake: () => setLabelShot(!1), onRead: () => scAnalyze(c, labelCase === "bad" ? "labelbad" : "label"), onExit: onClose }),
      c.result && SC_FAIL[c.result] && n.jsx(ScFail, { kind: c.result, onAct: act }),
      c.result &&
        !SC_FAIL[c.result] &&
        n.jsx(ScResult, {
          kind: c.result,
          meal,
          shots: c.result === "plate" ? m.shots : null,
          onBack: () => (c.setResult(null), c.result === "plate" && m.shots.length ? m.setView("preview") : c.result === "label" ? setLabelShot(!0) : 0),
          onDone,
        }),
      m.confirm && n.jsx(ScLeave, { n: m.shots.length, onStay: () => m.setConfirm(!1), onLeave: () => (m.reset(), onClose()) }),
    ],
  });
}

/* ===== C · Как на кассе ===== */
function ScTray({ meal: m0, onClose, onDone }) {
  const st = we(),
    c = useScCam(),
    [items, setItems] = V.useState([]),
    [meal, setMeal] = V.useState(scMeal(st, m0)),
    [beep, setBeep] = V.useState(null),
    code = c.scene === "barcode" || c.scene === "qr",
    got = V.useRef(new Set()),
    total = items.reduce((a, x) => a + scKcal(x), 0),
    push = (list, msg) => (setItems((xs) => [...list, ...xs]), setBeep(msg), setTimeout(() => setBeep(null), 1400)),
    upd = (key, fn) => setItems((xs) => xs.map((x) => (x.key === key ? fn(x) : x))),
    shoot = (k = c.scene) => {
      if (k === "barcode" || k === "qr") return;
      c.setBusy(k);
      setTimeout(() => {
        c.setBusy(null);
        k === "plate" ? push(SC_PLATE(), "Тарелка: +3 продукта") : push([{ ...SC_RESULT.label, key: "l" + N.id(), name: "" }], "Этикетка прочитана");
      }, 1200);
    };
  V.useEffect(() => {
    if (!code || got.current.has(c.scene)) return;
    const t = setTimeout(() => {
      got.current.add(c.scene);
      push([{ ...SC_RESULT[c.scene], key: c.scene + N.id() }], `${SC_RESULT[c.scene].src}: ${SC_RESULT[c.scene].name}`);
    }, 900);
    return () => clearTimeout(t);
  }, [c.scene]);
  const named = items.every((x) => x.src !== "Этикетка" || (x.name || "").trim());
  return n.jsxs("div", {
    className: `sc sc-tray ${c.flash ? "flash" : ""}`,
    role: "dialog",
    "aria-label": "Умная камера",
    children: [
      n.jsxs("div", {
        className: "sc-window",
        children: [
          n.jsx(ScScene, { scene: c.scene, frozen: !!c.busy }),
          c.busy && n.jsxs("div", { className: "sc-busy", children: [n.jsx("i", {}), n.jsx("p", { children: c.busy === "label" ? "Читаем этикетку…" : "Ищем продукты…" })] }),
          n.jsxs("div", {
            className: "sc-top",
            children: [
              n.jsx("button", { type: "button", className: "sc-round", "aria-label": "Закрыть", onClick: onClose, children: n.jsx(ScI, { n: "close", s: 20 }) }),
              n.jsx(ScDemoPill, { scene: c.scene, setScene: c.setScene }),
              n.jsx(ScFlash, { on: c.flash, set: c.setFlash }),
            ],
          }),
          beep && n.jsxs("div", { className: "sc-beep", role: "status", children: [n.jsx(ScI, { n: "check", s: 16, w: 3 }), beep] }),
          n.jsxs("div", {
            className: "sc-win-ctrl",
            children: [
              n.jsx("span", { className: "sc-round ghost" }),
              code
                ? n.jsx("span", { className: "sc-tray-auto", children: "Коды добавляются сами" })
                : n.jsx("button", { type: "button", className: "sc-shutter sm", "aria-label": "Снять", disabled: !!c.busy, onClick: () => shoot() }),
              n.jsx("span", { className: "sc-round ghost" }),
            ],
          }),
        ],
      }),
      n.jsxs("div", {
        className: "sc-sheet",
        children: [
          n.jsxs("div", {
            className: "sc-sheet-h",
            children: [
              n.jsxs("div", { children: [n.jsx("h2", { children: items.length ? scProducts(items.length) : "Пока пусто" }), n.jsx("span", { children: items.length ? `${nxN(total)} ккал` : "Снимайте тарелку, этикетку или код — всё соберётся здесь" })] }),
            ],
          }),
          items.length > 0 &&
            n.jsx("div", {
              className: "sc-items",
              children: items.map((x) =>
                n.jsxs(
                  "div",
                  {
                    className: "sc-item",
                    children: [
                      n.jsx("span", { className: `sc-src s-${x.src === "Фото" ? "plate" : x.src === "Этикетка" ? "label" : "code"}`, children: n.jsx(ScI, { n: x.src === "Фото" ? "plate" : x.src === "Этикетка" ? "label" : "code", s: 16 }) }),
                      n.jsxs("span", {
                        className: "sc-item-t",
                        children: [
                          x.src === "Этикетка"
                            ? n.jsx("input", { className: "sc-inline", value: x.name, placeholder: "Назовите продукт", "aria-label": "Название продукта с этикетки", onChange: (v) => upd(x.key, (y) => ({ ...y, name: v.target.value })) })
                            : n.jsx("b", { children: x.name }),
                          n.jsxs("small", { children: [nxN(scKcal(x)), " ккал"] }),
                        ],
                      }),
                      n.jsxs("span", {
                        className: "sc-step",
                        children: [
                          n.jsx("button", { type: "button", "aria-label": "Меньше", onClick: () => upd(x.key, (y) => ({ ...y, g: Math.max(5, y.g - 10) })), children: n.jsx(ScI, { n: "minus", s: 15 }) }),
                          n.jsxs("b", { children: [x.g, " г"] }),
                          n.jsx("button", { type: "button", "aria-label": "Больше", onClick: () => upd(x.key, (y) => ({ ...y, g: y.g + 10 })), children: n.jsx(ScI, { n: "plus", s: 15 }) }),
                        ],
                      }),
                      n.jsx("button", { type: "button", className: "sc-x", "aria-label": `Убрать ${x.name || "продукт"}`, onClick: () => setItems((xs) => xs.filter((y) => y.key !== x.key)), children: n.jsx(ScI, { n: "close", s: 14 }) }),
                    ],
                  },
                  x.key,
                ),
              ),
            }),
          items.length > 0 &&
            n.jsxs("div", {
              className: "sc-tray-foot",
              children: [
                n.jsx("div", {
                  className: "sc-meals",
                  role: "radiogroup",
                  "aria-label": "Приём пищи",
                  children: NX_MEALS.map((x) => n.jsx("button", { type: "button", role: "radio", "aria-checked": x === meal, onClick: () => setMeal(x), children: x }, x)),
                }),
                n.jsx("button", {
                  type: "button",
                  className: "sc-cta",
                  disabled: !named,
                  onClick: () => scSave(items, meal, onDone),
                  children: named ? `Добавить всё ${NX_IN[meal]} · ${nxN(total)} ккал` : "Назовите продукт с этикетки",
                }),
              ],
            }),
        ],
      }),
    ],
  });
}

/* ---------- корень ---------- */
function SmartCamera({ meal, onClose, onDone }) {
  const st = we(),
    v = scVar(st),
    p = { meal, onClose, onDone };
  return v === "tabs" ? n.jsx(ScTabs, p) : v === "tray" ? n.jsx(ScTray, p) : n.jsx(ScAuto, p);
}
/* отдельный экран (панель «Экран → Питание → Умная камера») */
function SmartCameraScreen() {
  return n.jsx(SmartCamera, {
    onClose: () => N.back(),
    onDone: () => N.update((s) => void (s.stacks.stats = ["stats", "detail-meal"])),
  });
}
