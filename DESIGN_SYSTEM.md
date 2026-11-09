# Дизайн-система «ЗОЖ» (Худеем на здоровье)

Конспект Storybook проекта: https://storybook.thinkingoutloud.ru (закрыт HTTP Basic Auth, логин и пароль хранятся у владельца и в репозиторий не кладутся).
Снято 2026-11-09 с собранного Storybook. Исходник визуала — Figma-файл «ЗОЖ приложение (2026) (Copy)», снимок 15.10.2026.

## Устройство Storybook

| Раздел | Что внутри |
| --- | --- |
| Начало, Основы | Введение, «Источник и покрытие», сверка с Figma |
| Компоненты | Рукописные React-компоненты: **Button, Chip, Radio, SegmentedControl, TextInput** (CSS-префикс `zozh-`) |
| Блоки | BirthDatePicker, ProfileMeasurementControl, WaterAmountControl, WaterWidget |
| Флоу | Авторизация и онбординг, Добавление воды, Единый прототип |
| Библиотека Figma | Автоперенос 597 семейств и 1 592 вариантов из Figma (HTML + flex + исходные SVG), есть Каталог и раздел Архив |

Покрытие: 47 страниц Figma, 509 семейств в основном каталоге и 88 в архиве; у 42 семейств есть нативные адаптеры (настоящие контролы).
Перенос каталога **не** означает готовую production-дизайн-систему. Визуальная сверка выборочная: Button, Input, Alert.

## Токены (CSS-переменные `--figma-*`)

### Цвета
| Токен | Значение | Роль |
| --- | --- | --- |
| blue-10 | `#EFF4FF` | фон неактивного сегмента, нажатый secondary |
| blue-20 | `#DEE8FF` | фон ghost, обводки полей и чипов, обводка disabled secondary |
| blue-30 | `#C5D5FF` | обводка secondary, нажатый ghost |
| blue-50 | `#AFC4FF` | disabled (фон primary и текст остальных кнопок) |
| **blue-100** | `#2B6CFC` | **основной акцент**: primary, выбранные состояния, фокус, каретка |
| blue-120 | `#0E4DDD` | pressed primary и text |
| blue-140 | `#093EB5` | — |
| grayscale-0 | `#FFFFFF` | |
| grayscale-10 | `#F3F4F6` | фон экранов (theme-color приложения `#f4f5f7`) |
| grayscale-20 | `#EDEDED` | разделители |
| grayscale-30 | `#DBDBDB` | кольцо радиокнопки |
| grayscale-40 | `#B7B7B7` | |
| grayscale-50 | `#909090` | подписи полей (контраст ниже AA, это известное замечание) |
| grayscale-70 | `#6D6D6D` | вторичный текст |
| grayscale-100 | `#020202` | основной текст |
| red-100 / optional-error | `#FF2347` | ошибки |
| red-10 | `#FFE4E9` | |
| orange-100 / optional-warning | `#F17C59` | предупреждения |
| orange-10 | `#FDEFEB` | |
| green-100 | `#4AB35D` | успех |
| green-10 | `#E9F6EC` | |
| optional-menthol | `#21C9D5` | |
| white-75 | `#FFFFFFBF` | |
| dark-65 | `#000000A6` | |
| dark-5 | `#0000000D` | |
| chips-tab-bar-background | `#6A72821F` | |

**Питание (БЖУ):** белки `#5A4FF5`, жиры `#9245F0`, углеводы `#F17C59`, калории `#E3A738`.

### Типографика
- Гарнитура **SB Sans Display**: Regular 400, Medium 500, Semibold 600, Bold 700. Файлы `.otf` лежат в `assets/`.
- Размеры заголовков: headline-1 = 32, headline-2 = 24.
- Кнопки: Semibold 16/24. Чипы: 14/20 Regular. Сегменты: 14/20 Semibold. Ошибки: 12/16.

### Скругления и размеры
- Кнопки: L 56 px / r20, M 48 / r16, S 40 / r12.
- Поля, виджеты и карточки: r20. Чип: r16. Сегмент: r22.
- Минимальная зона нажатия 44 px.
- Фокус: `outline: 2px solid blue-100; outline-offset: 3px`.

## Компоненты

### Button (Figma 1997:13638)
`appearance: primary | secondary | ghost | text`, `size: large | medium | small`, `disabled`, `fullWidth`, `type`, `onClick`, `previewState: default | pressed`.
- **primary**: фон blue-100, белый текст; pressed blue-120; disabled фон blue-50.
- **secondary**: прозрачный фон, обводка 1 px blue-30, текст grayscale-100; pressed фон blue-10; disabled текст blue-50 и обводка blue-20.
- **ghost**: фон blue-20; pressed blue-30; disabled текст blue-50. У L горизонтальный padding 24.
- **text**: текст blue-100; pressed blue-120; disabled blue-50.
- Горизонтальные отступы 16, у medium 24. Иконок в кнопках пилота нет.

### Chip (Figma 23309:291289)
`selected`, `defaultSelected`, `onSelectedChange`. Это кнопка-переключатель (`aria-pressed`): высота 44, r16, padding 0 16, без заливки. Обводка 1.5 px: blue-20 обычная, blue-100 выбранная.

### SegmentedControl (Figma 23461:360783)
`label` (доступное имя), `options: {value,label}[]`, `value`, `defaultValue` (по умолчанию первый), `onValueChange`.
- Сегмент: высота 32, r22, padding 0 12, 14/20 Semibold. Неактивный: фон blue-10, текст тёмный. Активный: фон blue-100, текст белый.
- Группа: `role=radiogroup`, flex-wrap, gap 8.
- Клавиатура: одна Tab-остановка, стрелки переходят по кругу, Home и End ведут к краям.
- Пример: «Период» с вариантами День / Неделя / …

### Radio (Figma 9596:157922)
`label`, `name`, `value`, `checked`, `defaultChecked`, `onValueChange`. Индикатор 24×24: кольцо 20×20 толщиной 2 (grayscale-30, в выбранном состоянии blue-100), точка 12×12 цвета blue-100. Подпись 16/24, gap 8, высота строки ≥ 44.

### TextInput — «Input field profile» (Figma 3078:83910)
`label`, `value`, `defaultValue`, `onValueChange`, `error`, `name`, `inputMode`, `required`, `readOnly`.
Состояния `empty → focus → typing → filled`, при наличии `error` — `warning`:
- Контейнер белый, r20, padding 10 16, высота 67 (пустой) или 68 (заполненный); с ошибкой общая высота 92.
- Обводка 1 px: blue-20 в покое, blue-100 в фокусе и при вводе, red-100 при ошибке.
- Подпись grayscale-50. В пустом поле она 16 px и центрирована внутри; дальше 14–16 px над значением.
- Значение Semibold 16/22, в фокусе 18.
- Ошибка показывается под полем: 12/16, red-100, отступ 8 16.

## Блоки
- **BirthDatePicker** (19962:188481): три колонки-барабана (день / месяц / год). Работает клик, колесо, свайп и клавиатура (стрелки ±1, Page ±10, Home/End). Диапазон: от «сегодня − 99 лет» до «сегодня − 18 лет − 1 день».
- **ProfileMeasurementControl** (21110:149457, 20445:325115): рост 100–250 см с шагом 1; вес 30–300 кг с шагом 0,1. Значение меняется кнопками ±, вводом и перетаскиванием шкалы.
- **WaterAmountControl** (18057:696587): значение 56 px, кнопки 56×56, шкала 314×28, шаг 50 мл (на шкале это 12,24 px), диапазон 0–20 л. Значение — строка в литрах.
- **WaterWidget** (28209:173580): карточка 358×152, r20, padding 16, 8 стаканов. Пропсы `amountMl`, `goalMl`, `busy`, `onAdd`, `onQuickAdd`. Быстрый стакан добавляет 200 мл.

## Флоу
- **Авторизация и онбординг**: согласия → почта + 6-значный OTP или Сбер ID → Здоровье (HealthKit) → уведомления → 3 вводных экрана → интро анкеты → рост → вес/ИМТ → пол → дата рождения → чат. Демо: `designer@example.com`, код `123456`.
- **Добавление воды**: Статистика → «+» у «Вода» → шторка с объёмом (по умолчанию 0,2 л, шаг 50 мл) → «Добавить» → виджет обновился.
- **Единый прототип**: онбординг → чат → таб «Статистика» → вода → обратно в чат.

Экран «Статистика»: календарь недели, виджеты Питание (ккал + БЖУ), Активность, Шаги, Тренировка, Вода, Сон, Вес. Таб-бар: Главная / Чат (AI) / Статистика / Профиль.

## Библиотека Figma (каталог по категориям)
Иконки (~198: размеры 16/20/24/36, варианты outline и solid), Статистика (виджеты Water/Sleep/Steps/Scale/Activity/Meal, Period-виджеты, шкала ИМТ), Управление (кнопки, чипы, like/dislike/copy, stepper), Питание (виджет Meal, БЖУ, формы добавления еды, «Мои блюда»), Поля (input, code, телефон, поиск, number ±, time), Чат (пузыри пользователя и ассистента, ChatWidget Select/Suggestions/Keyboard, голосовой ввод, thinking, calculation widget), Навигация (Header, Tabbar, Stepper, Calendar, Divider), Обратная связь (Alert, Drawer modal, Informer, Toast, Tooltip, Loader, скелетоны, error page), Цели (карточки целей и медали), Остальное. Устаревшее лежит в «Архив» и помечено `.depricated` / `old`.

## Известные ограничения
- Контраст grayscale-50 и текста ошибок ниже WCAG AA. Axe отмечает это как todo; менять цвета без решения дизайнера нельзя.
- Бизнес-логика флоу локальная, на демо-данных, бэкенда нет.
