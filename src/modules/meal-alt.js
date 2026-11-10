/* =====================================================================
 * Добавление блюда — 3 альтернативные компоновки (тест, за переключателем
 * «Поведение → Экран добавления»; state.controls.addVariant). Основной
 * вариант — MealAddScreen («main»). Функции одинаковые: выбор приёма
 * (шторка «Что добавляем?»), общий поиск по каталогу и избранному, избранное
 * (экран «Избранное»), недавние ≤ 5, камера, ручной ввод.
 *   "hero"   — «Сцена»: синий градиентный блок сверху с крупным приёмом,
 *              поиском и камерой; избранное — карусель карточек.
 *              Реф. Lovi (мягкий поиск), Apple Music (карусель).
 *   "dock"   — «Нижняя строка»: крупный вопрос «Что было на ужин?», контент
 *              по центру, поиск + камера + ручной ввод внизу, у большого пальца.
 *              Реф. MacroFactor (поиск в нижнем доке).
 *   "bento"  — «Бенто»: сетка входов — большая фото-плитка «Сфотографировать»,
 *              рядом «Избранное · N» и «Вручную», ниже поиск и недавние.
 *              Реф. How We Feel (плитки), ChatGPT widget.
 * Не из DS: градиентный блок, карусель, нижний док, бенто-плитки.
 * ===================================================================== */

function mvCount(nn) {
  return `${nn} ${nn % 10 === 1 && nn % 100 !== 11 ? "блюдо" : [2, 3, 4].includes(nn % 10) && ![12, 13, 14].includes(nn % 100) ? "блюда" : "блюд"}`;
}
function MvClose({ light }) {
  return n.jsx("button", {
    type: "button",
    className: `mv-close ${light ? "light" : ""}`,
    "aria-label": "Закрыть",
    onClick: () => (mfHideKeyboard(), N.back()),
    children: n.jsx(Q, { name: "close", size: 16 }),
  });
}
function MvCam({ light }) {
  return n.jsx("button", {
    type: "button",
    className: `mv-cam ${light ? "light" : ""}`,
    "aria-label": "Распознать по фото",
    onClick: () => (mfHideKeyboard(), N.sheet("camera", { target: "meal" })),
    children: n.jsx(Q, { name: "icon.food.camera", size: 24 }),
  });
}
/* результаты общего поиска или контент по умолчанию */
function MvBody({ ctx, children }) {
  const { view, results, saved, q } = ctx;
  if (view === "loading") return n.jsx(MaSkeleton, {});
  if (view === "error") return n.jsx(MaError, {});
  if (!results) return children;
  return n.jsxs(n.Fragment, {
    children: [
      n.jsx($, { as: "h3", token: "capsSign", className: "ma-caption", children: "КАТАЛОГ И ИЗБРАННОЕ" }),
      results.length
        ? n.jsx(MaList, { items: results, saved })
        : n.jsx(MaEmpty, {
            image: "image.food.not_found",
            title: "Ничего не найдено",
            text: "В каталоге и избранном нет подходящих блюд.",
            action: n.jsx(re, {
              secondary: !0,
              className: "ma-empty-btn",
              onClick: () => (mfHideKeyboard(), N.sheet("entry", { kind: "meal", name: q.trim() })),
              children: "Добавить вручную",
            }),
          }),
    ],
  });
}
function MvRecent({ ctx }) {
  return n.jsxs(n.Fragment, {
    children: [
      n.jsx($, { as: "h3", token: "capsSign", className: "ma-caption", children: "НЕДАВНИЕ" }),
      ctx.recent.length ? n.jsx(MaList, { items: ctx.recent, saved: ctx.saved }) : n.jsx(MaEmpty, MA_EMPTY.recent),
    ],
  });
}

/* ---------- «Сцена» ---------- */
function MvHero({ ctx }) {
  const { type, favs, q, setQ } = ctx;
  return n.jsxs("div", {
    className: "ma-page ma-soft mv-hero-page",
    children: [
      n.jsxs("section", {
        className: "mv-hero",
        children: [
          n.jsxs("div", {
            className: "mv-hero-top",
            children: [
              n.jsx(MvClose, { light: !0 }),
              n.jsx($, { token: "assastiveTextM", className: "mv-hero-sub", children: `${mfDayLabel(st_date(), sl)}, ${N.state.controls.clock}` }),
              n.jsx("span", {}),
            ],
          }),
          n.jsxs("button", {
            type: "button",
            className: "mv-hero-title",
            "aria-label": `Приём пищи: ${type}. Сменить`,
            onClick: ctx.openChooser,
            children: [n.jsx("span", { children: type }), n.jsx("i", { "aria-hidden": "true", children: "▾" })],
          }),
          n.jsxs("div", {
            className: "ma-search-row mv-hero-search",
            children: [n.jsx(MaSearchField, { value: q, onChange: setQ, placeholder: "Найти блюдо или продукт" }), n.jsx(MvCam, { light: !0 })],
          }),
        ],
      }),
      n.jsx("div", {
        className: "scroll ma-list",
        children: n.jsx(MvBody, {
          ctx,
          children: n.jsxs(n.Fragment, {
            children: [
              n.jsxs("div", {
                className: "mv-row-head",
                children: [
                  n.jsx($, { as: "h3", token: "capsSign", className: "ma-caption", children: "ИЗБРАННОЕ" }),
                  favs.length > 0 && n.jsx("button", { type: "button", onClick: () => N.go("nutrition-favorites"), children: `Все ${favs.length} ›` }),
                ],
              }),
              favs.length
                ? n.jsx("div", {
                    className: "mv-carousel",
                    children: favs.slice(0, 8).map((p) =>
                      n.jsxs(
                        "button",
                        {
                          type: "button",
                          className: "mv-fav-card",
                          onClick: () => N.sheet("product", { product: p, from: p.own ? "own" : "search" }),
                          children: [
                            n.jsx("span", { className: "ma-link-icon", children: n.jsx(Q, { name: "heart-fill", size: 18 }) }),
                            n.jsx($, { token: "assastiveTextL", className: "mv-fav-name", children: p.name }),
                            n.jsxs($, { token: "number3M", className: "ms-muted", children: [rt(maKcal(p)), " ккал · ", rt(p.portion || 100), " г"] }),
                          ],
                        },
                        p.id + p.name,
                      ),
                    ),
                  })
                : n.jsx($, { as: "p", token: "assastiveTextM", className: "ms-muted mv-note", children: "Сохраняйте блюда сердечком в карточке — они появятся здесь." }),
              n.jsx(MvRecent, { ctx }),
              n.jsxs("button", {
                type: "button",
                className: "mv-manual",
                onClick: () => N.sheet("entry", { kind: "meal" }),
                children: [n.jsx(Q, { name: "icon.food.add_manual", size: 18 }), "Ввести вручную"],
              }),
            ],
          }),
        }),
      }),
      ctx.chooser,
    ],
  });
}
function st_date() {
  return N.state.mealDraftDate || N.state.date;
}

/* ---------- «Нижняя строка» ---------- */
function MvDock({ ctx }) {
  const { type, favs, q, setQ } = ctx;
  return n.jsxs("div", {
    className: "ma-page ma-soft mv-dock-page",
    children: [
      n.jsxs("header", {
        className: "mv-dock-head",
        children: [
          n.jsx(MvClose, {}),
          n.jsxs("h1", {
            className: "mv-question",
            children: [
              "Что было",
              n.jsx("br", {}),
              "на ",
              n.jsxs("button", {
                type: "button",
                "aria-label": `Приём пищи: ${type}. Сменить`,
                onClick: ctx.openChooser,
                children: [type.toLowerCase(), n.jsx("i", { "aria-hidden": "true", children: "▾" })],
              }),
              "?",
            ],
          }),
        ],
      }),
      n.jsx("div", {
        className: "scroll ma-list",
        children: n.jsx(MvBody, {
          ctx,
          children: n.jsxs(n.Fragment, {
            children: [
              n.jsx("div", {
                className: "ma-links",
                children: n.jsxs("button", {
                  type: "button",
                  className: "ma-link",
                  onClick: () => N.go("nutrition-favorites"),
                  children: [
                    n.jsx("span", { className: "ma-link-icon", children: n.jsx(Q, { name: "heart-fill", size: 20 }) }),
                    n.jsxs("span", {
                      className: "ma-link-copy",
                      children: [n.jsx($, { token: "answer1L", children: "Избранное" }), n.jsx($, { token: "number3M", className: "ms-muted", children: favs.length ? mvCount(favs.length) : "пока пусто" })],
                    }),
                    n.jsx(Q, { name: "chevron", size: 16 }),
                  ],
                }),
              }),
              n.jsx(MvRecent, { ctx }),
            ],
          }),
        }),
      }),
      n.jsxs("footer", {
        className: "mv-dock",
        children: [
          n.jsx(MaSearchField, { value: q, onChange: setQ, placeholder: "Найти блюдо" }),
          n.jsx(MvCam, {}),
          n.jsx("button", {
            type: "button",
            className: "mv-round",
            "aria-label": "Ввести вручную",
            onClick: () => (mfHideKeyboard(), N.sheet("entry", { kind: "meal", name: q.trim() })),
            children: n.jsx(Q, { name: "icon.food.add_manual", size: 22 }),
          }),
        ],
      }),
      ctx.chooser,
    ],
  });
}

/* ---------- «Бенто» ---------- */
function MvBento({ ctx }) {
  const { type, favs, q, setQ } = ctx;
  return n.jsxs("div", {
    className: "ma-page ma-soft",
    children: [
      n.jsxs("header", {
        className: "ma-header",
        children: [
          n.jsx(MfIconButton, { label: "Закрыть", icon: "close", size: 16, onClick: () => (mfHideKeyboard(), N.back()) }),
          n.jsxs("button", {
            type: "button",
            className: "ma-title",
            "aria-label": `Приём пищи: ${type}. Сменить`,
            onClick: ctx.openChooser,
            children: [n.jsx($, { as: "h1", token: "headline2", children: type }), n.jsx(Q, { name: "icon.chevron.down", size: 14 })],
          }),
          n.jsx("span", {}),
        ],
      }),
      n.jsx("div", {
        className: "scroll ma-list mv-bento-list",
        children: n.jsxs(n.Fragment, {
          children: [
            !q &&
              n.jsxs("div", {
                className: "mv-bento",
                children: [
                  n.jsxs("button", {
                    type: "button",
                    className: "mv-tile photo",
                    onClick: () => N.sheet("camera", { target: "meal" }),
                    children: [
                      n.jsx("img", { src: MF_PHOTO, alt: "" }),
                      n.jsx("span", { className: "mv-tile-icon", children: n.jsx(Q, { name: "icon.food.camera", size: 22 }) }),
                      n.jsx($, { token: "answer0L", children: "Сфотографировать" }),
                      n.jsx($, { token: "number3M", children: "или загрузить фото" }),
                    ],
                  }),
                  n.jsxs("button", {
                    type: "button",
                    className: "mv-tile fav",
                    onClick: () => N.go("nutrition-favorites"),
                    children: [
                      n.jsx("span", { className: "ma-link-icon", children: n.jsx(Q, { name: "heart-fill", size: 20 }) }),
                      n.jsx($, { token: "answer1L", children: "Избранное" }),
                      n.jsx($, { token: "number3M", className: "ms-muted", children: favs.length ? mvCount(favs.length) : "пока пусто" }),
                    ],
                  }),
                  n.jsxs("button", {
                    type: "button",
                    className: "mv-tile manual",
                    onClick: () => N.sheet("entry", { kind: "meal" }),
                    children: [
                      n.jsx("span", { className: "ma-link-icon", children: n.jsx(Q, { name: "icon.food.add_manual", size: 20 }) }),
                      n.jsx($, { token: "answer1L", children: "Вручную" }),
                      n.jsx($, { token: "number3M", className: "ms-muted", children: "КБЖУ сами" }),
                    ],
                  }),
                ],
              }),
            n.jsx("div", { className: "mv-bento-search", children: n.jsx(MaSearchField, { value: q, onChange: setQ, placeholder: "Найти блюдо или продукт" }) }),
            n.jsx(MvBody, { ctx, children: n.jsx(MvRecent, { ctx }) }),
          ],
        }),
      }),
      ctx.chooser,
    ],
  });
}

/* ---------- «Шторка» (1 + 4 в рамке экрана приложения) ----------
 * Рамка как в «Добавить активность» / «Мои блюда» (скриншоты владельца): градиент,
 * белая квадратная кнопка, заголовок по центру, неподвижная белая шторка.
 * Тип приёма — см. «Где менять приём» (MvAddHead / карточка блюда).
 * В шторке: Search закреплён сверху, ниже прокручивается только содержимое:
 * бенто-входы (фото, «Избранное · N», «Вручную») и «Недавние» ≤ 5; при вводе —
 * результаты каталога и избранного. Шторка не двигается ни при вводе, ни при смене приёма.
 */
/* Где менять приём (тест, «Поведение → Где менять приём»; state.controls.typePlace).
 * Рефы Mobbin: MyFitnessPal, Noom (A); Cal AI, Life Reset, BitePal (B).
 *   "title" — A: заголовок экрана = приём «Обед ▾» → выбор; шторки на входе нет;
 *   "bar"   — B: на экране приёма нет; выбирается в карточке блюда сегментами
 *             над кнопкой «Добавить в …»; шторки на входе нет;
 *   "entry" — C: шторка «Что добавляем?» на входе, на экране приёма нет,
 *             сменить — в шапке карточки блюда («Обед ▾»).
 * Без шторки приём по умолчанию — последний выбранный (от времени не зависит).
 */
function mvTypePlace(st) {
  return st.controls.typePlace ?? "title";
}
/* заголовок экрана добавления по варианту */
function MvAddHead({ ctx }) {
  return mvTypePlace(ctx.st) === "title"
    ? n.jsx(MvFrameHead, { title: ctx.type, onTitle: ctx.openChooser, titleLabel: `Приём пищи: ${ctx.type}. Сменить` })
    : n.jsx(MvFrameHead, { title: "Добавить блюдо" });
}
function MvFrameHead({ title, sub, back, onTitle, titleLabel }) {
  return n.jsxs("header", {
    className: "native-flow-header mv-head",
    children: [
      n.jsx("button", {
        type: "button",
        "aria-label": back ? "Назад" : "Закрыть",
        onClick: () => (mfHideKeyboard(), N.back()),
        children: n.jsx(Q, { name: back ? "back" : "close", size: back ? 20 : 18 }),
      }),
      n.jsxs("hgroup", {
        children: [
          onTitle
            ? n.jsxs("button", {
                type: "button",
                className: "mv-head-title",
                "aria-label": titleLabel,
                onClick: () => (mfHideKeyboard(), onTitle()),
                children: [n.jsx($, { as: "h1", token: "answer1L", children: title }), n.jsx(Q, { name: "icon.chevron.down", size: 14 })],
              })
            : n.jsx($, { as: "h1", token: "answer1L", children: title }),
          sub && n.jsx($, { token: "number3M", className: "mv-head-note", children: sub }),
        ],
      }),
    ],
  });
}
function MvSheet({ ctx }) {
  const { type, favs, q, setQ } = ctx;
  return n.jsxs("div", {
    className: "native-diary-page mv-sheet-page",
    children: [
      n.jsx(MvAddHead, { ctx }),
      n.jsxs("div", {
        className: "native-catalog-surface mv-sheet",
        children: [
          n.jsx("div", { className: "mv-sheet-search", children: n.jsx(MaSearchField, { value: q, onChange: setQ, placeholder: "Найти блюдо или продукт" }) }),
          n.jsx("div", {
            className: "scroll ma-list mv-sheet-list",
            children: n.jsx(MvBody, {
              ctx,
              children: n.jsxs(n.Fragment, {
                children: [
                  n.jsxs("div", {
                    className: "mv-bento",
                    children: [
                      n.jsxs("button", {
                        type: "button",
                        className: "mv-tile photo",
                        onClick: () => N.sheet("camera", { target: "meal" }),
                        children: [
                          n.jsx("img", { src: MF_PHOTO, alt: "" }),
                          n.jsx("span", { className: "mv-tile-icon", children: n.jsx(Q, { name: "icon.food.camera", size: 22 }) }),
                          n.jsx($, { token: "answer0L", children: "Сфотографировать" }),
                          n.jsx($, { token: "number3M", children: "или загрузить фото" }),
                        ],
                      }),
                      n.jsxs("button", {
                        type: "button",
                        className: "mv-tile fav",
                        onClick: () => (mfHideKeyboard(), N.go("nutrition-favorites")),
                        children: [
                          n.jsx("span", { className: "ma-link-icon", children: n.jsx(Q, { name: "heart-fill", size: 20 }) }),
                          n.jsx($, { token: "answer1L", children: "Избранное" }),
                          n.jsx($, { token: "number3M", className: "ms-muted", children: favs.length ? mvCount(favs.length) : "пока пусто" }),
                        ],
                      }),
                      n.jsxs("button", {
                        type: "button",
                        className: "mv-tile manual",
                        onClick: () => N.sheet("entry", { kind: "meal" }),
                        children: [
                          n.jsx("span", { className: "ma-link-icon", children: n.jsx(Q, { name: "icon.food.add_manual", size: 20 }) }),
                          n.jsx($, { token: "answer1L", children: "Вручную" }),
                          n.jsx($, { token: "number3M", className: "ms-muted", children: "КБЖУ сами" }),
                        ],
                      }),
                    ],
                  }),
                  n.jsx(MvRecent, { ctx }),
                ],
              }),
            }),
          }),
        ],
      }),
      ctx.chooser,
    ],
  });
}

function MaVariant({ variant, ctx }) {
  return variant === "sheet"
    ? n.jsx(MvSheet, { ctx })
    : variant === "hero" ? n.jsx(MvHero, { ctx }) : variant === "dock" ? n.jsx(MvDock, { ctx }) : n.jsx(MvBento, { ctx });
}
