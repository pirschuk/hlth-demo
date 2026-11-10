# Худеем на здоровье · iOS Studio (демо)

Интерактивный веб-прототип iOS-приложения. Публикуется как статический сайт (GitHub Pages): `index.html` + `assets/`.
Правила разработки и процесс — в [`CLAUDE.md`](CLAUDE.md) (адаптировано из набора `pirschuk/BAR`).

## Структура

| Путь | Что |
| --- | --- |
| `index.html`, `assets/` | опубликованный прототип (`assets/index-<hash>.*` — результат сборки) |
| `src/app.js`, `src/app.css` | исходник, восстановленный из собранного бандла |
| `src/modules/` | новые фичи модулями (`meal-flow`, `meal-summary`, `meal-page`, `meal-repeat`, `meal-add`, `meal-add-test`) |
| `scripts/` | `build.mjs` — сборка, `screenshot.mjs` — скриншоты экранов, `montage.py` — склейка |
| `.claude/` | команды `/idea`, `/ref`, `/code`, `/look`, скилл `design-system`, субагент `ui-inspector` |
| `plan.md` | текущий план фичи и архив |
| `refs/` | референсы (Mobbin) и их разбор |
| `docs/previews/` | финальные скриншоты этапов |

## Сборка и проверка

```bash
npm install
```

```bash
npm run build
```

```bash
python3 -m http.server 8765
```

```bash
node scripts/screenshot.mjs "Питание"
```

## Процесс

`/idea <фича>` → план в `plan.md` → «го» → `/code` → `/look <экран>` → коммит в рабочую ветку.
Референсы — `/ref <ссылка|описание|файл>`. Дизайн-система — `.claude/skills/design-system/SKILL.md`
(Figma «ЗОЖ приложение (2026)», Storybook, решения владельца).
