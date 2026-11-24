/* =====================================================================
 * «Добавить завтрак» (макет владельца 2026-11-24) и что делать, если блок
 * «Обычно на завтрак» не загрузился. Экран: панель «Экран → Питание →
 * Добавить завтрак (обычно)». Состояние блока — «Поведение → Блок «Обычно
 * на…»» (state.controls.usualState):
 *   ok       — загрузился;
 *   loading  — скелетон (в продукте: дольше ~4 с — считаем ошибкой);
 *   hide     — 1 «Тихо убрать»: блока нет, экран работает без него;
 *   retry    — 2 «Ошибка на месте»: карточка-заглушка с «Повторить»;
 *   fallback — 3 «Свои данные»: показываем недавнее из телефона
 *              (кэш журнала), сверху строка «Подсказки не загрузились ·
 *              Обновить»; если и своих данных нет — как 2.
 * Компоненты — по макету (DS: [Food] Header, Search, [-My food] -list,
 * [Food] Button_Add ×4, [-Статистика] Error page — уменьшенная).
 * Список «обычно на завтрак» — демо-данные.
 * ===================================================================== */

var US_LIST = [
  ["Геркулесовая каша", 88, 3, 1.7, 15, 200],
  ["Яйцо варёное", 157, 12.7, 11.5, 0.7, 55],
  ["Маффин с яйцом и свиной котлетой", 260, 13, 14, 20, 140],
  ["Капучино 280 мл", 37, 2, 2, 3, 280],
  ["Сэндвич с ветчиной, сыром и томатами", 230, 12, 9, 25, 180],
].map(([name, k, p, f, c, g], i) => ({ id: "us" + i, name, per: { k, p, f, c }, g }));

function usState(s) {
  return s.controls.usualState ?? "ok";
}
function usRecent(s) {
  /* «свои данные» — что человек ел в этот приём раньше (из журнала на телефоне) */
  const seen = new Set();
  return s.entries
    .filter((e) => e.kind === "meal" && (e.meal || "Перекус") === "Завтрак" && !e.recognizing && !e.recognizeError)
    .filter((e) => !seen.has(e.name) && seen.add(e.name))
    .slice(0, 5)
    .map((e) => ({ id: e.id, name: e.name, g: e.grams || 100, per: { k: (e.value / (e.grams || 100)) * 100, p: (e.proteins / (e.grams || 100)) * 100, f: (e.fats / (e.grams || 100)) * 100, c: (e.carbs / (e.grams || 100)) * 100 } }));
}

function UsRow({ it }) {
  const k = it.g / 100;
  return n.jsxs("button", {
    type: "button",
    className: "us-row",
    onClick: () => N.sheet("product", { product: { id: it.id, name: it.name, calories: it.per.k, proteins: it.per.p, fats: it.per.f, carbs: it.per.c, portion: it.g }, from: "search" }),
    children: [
      n.jsx(Q, { name: "food-fork", size: 24 }),
      n.jsxs("span", {
        className: "us-row-t",
        children: [
          n.jsx($, { token: "assastiveTextL", children: it.name }),
          n.jsxs("span", {
            className: "us-row-m",
            children: [
              n.jsxs($, { token: "number3M", className: "ms-muted", children: [rt(Math.round(it.per.k * k)), " ккал · ", rt(it.g), " г"] }),
              [
                ["p", "#5A4FF5"],
                ["f", "#9245F0"],
                ["c", "#F17C59"],
              ].map(([x, col]) =>
                n.jsxs("span", { className: "us-dot", children: [n.jsx("i", { style: { background: col } }), n.jsxs($, { token: "number3M", children: [rt(Math.round(it.per[x] * k * 10) / 10), " г"] })] }, x),
              ),
            ],
          }),
        ],
      }),
    ],
  });
}
function UsList({ items }) {
  return n.jsx("div", { className: "us-list", children: items.map((it) => n.jsx(UsRow, { it }, it.id)) });
}
function UsSkeleton() {
  return n.jsx("div", {
    className: "us-list us-skel",
    "aria-label": "Загружаем",
    children: [1, 2, 3, 4].map((i) => n.jsxs("div", { children: [n.jsx("i", {}), n.jsx("b", {}), n.jsx("b", {})] }, i)),
  });
}

/* блок «Обычно на завтрак» во всех состояниях */
function UsBlock() {
  const st = we(),
    state = usState(st),
    [phase, setPhase] = V.useState(null),
    own = usRecent(st),
    retry = () => {
      setPhase("loading");
      setTimeout(() => (setPhase(null), N.update((s) => void (s.controls.usualState = "ok"))), 1200);
    },
    cap = (t) => n.jsx($, { as: "h3", token: "capsSign", className: "us-cap", children: t });
  if (phase === "loading" || state === "loading") return n.jsxs(n.Fragment, { children: [cap("ОБЫЧНО НА ЗАВТРАК"), n.jsx(UsSkeleton, {})] });
  if (state === "ok") return n.jsxs(n.Fragment, { children: [cap("ОБЫЧНО НА ЗАВТРАК"), n.jsx(UsList, { items: US_LIST })] });
  if (state === "hide")
    return n.jsx($, { as: "p", token: "number3M", className: "us-hint", children: "Начните вводить — найдём в базе. Или выберите способ ниже." });
  if (state === "fallback" && own.length)
    return n.jsxs(n.Fragment, {
      children: [
        cap("ВЫ ЕЛИ НА ЗАВТРАК"),
        n.jsxs("div", {
          className: "us-note",
          role: "status",
          children: [
            n.jsx($, { token: "number3M", children: "Подсказки не загрузились — показываем ваши недавние" }),
            n.jsx("button", { type: "button", onClick: retry, children: "Обновить" }),
          ],
        }),
        n.jsx(UsList, { items: own }),
      ],
    });
  return n.jsxs(n.Fragment, {
    children: [
      cap("ОБЫЧНО НА ЗАВТРАК"),
      n.jsxs("div", {
        className: "us-err",
        role: "status",
        children: [
          n.jsx("span", { className: "us-err-ic", children: n.jsx(Q, { name: "food.recognition.error-attention-triangle", size: 22 }) }),
          n.jsx($, { as: "b", token: "answer1L", children: "Не загрузились подсказки" }),
          n.jsx($, { as: "p", token: "number3M", className: "ms-muted", children: "Поиск, фото и мои блюда работают" }),
          n.jsx("button", { type: "button", className: "us-retry", onClick: retry, children: "Повторить" }),
        ],
      }),
    ],
  });
}

function UsualScreen() {
  const st = we();
  return n.jsxs("div", {
    className: "us-page",
    children: [
      n.jsxs("header", {
        className: "us-head",
        children: [
          n.jsx("button", { type: "button", className: "us-sq", "aria-label": "Назад", onClick: () => N.back(), children: n.jsx(Q, { name: "main.icons.chevron_left", size: 24 }) }),
          n.jsxs("button", {
            type: "button",
            className: "us-pill",
            children: [n.jsx(Q, { name: "icon.food.fork_knife", size: 20 }), n.jsx($, { token: "answer1L", children: "Добавить завтрак" }), n.jsx(Q, { name: "icon.chevron.down", size: 12 })],
          }),
        ],
      }),
      n.jsxs("div", {
        className: "us-sheet",
        children: [
          n.jsxs("label", {
            className: "us-search",
            children: [n.jsx(Q, { name: "search", size: 24 }), n.jsx("input", { "aria-label": "Найти блюдо или продукт", placeholder: "Найти блюдо или продукт" })],
          }),
          n.jsx("div", { className: "scroll us-scroll", children: n.jsx(UsBlock, {}) }),
        ],
      }),
      n.jsx("div", {
        className: "us-ways",
        children: [
          ["icon.food.add_manual", "Добавить вручную", () => N.sheet("entry", { kind: "meal" })],
          ["img:assets/icon.food.gallery.svg", "Добавить фото", () => N.sheet("camera", { target: "meal", gallery: !0 })],
          ["icon.food.camera", "Открыть камеру", () => N.sheet("camera", { target: "meal" })],
          ["heart-fill", "Мои блюда", () => N.go("nutrition-favorites", "stats")],
        ].map(([ic, l, fn]) =>
          n.jsxs(
            "button",
            {
              type: "button",
              onClick: fn,
              children: [
                n.jsx("span", { children: ic.startsWith("img:") ? n.jsx("img", { src: ic.slice(4), width: 24, height: 24, alt: "" }) : n.jsx(Q, { name: ic, size: 24 }) }),
                n.jsx($, { token: "number3M", children: l }),
              ],
            },
            l,
          ),
        ),
      }),
    ],
  });
}
