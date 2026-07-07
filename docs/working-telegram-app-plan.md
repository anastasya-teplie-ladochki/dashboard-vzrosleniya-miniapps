# Путь взросления — перевод из прототипа в рабочее Telegram/VK приложение

Дата: 2026-07-07

## Цель

Превратить текущий статический HTML-макет в рабочее приложение:

- основная рабочая версия: Telegram Mini App;
- VK-версия должна тоже использовать те же реальные данные;
- данные можно заполнять и через интерфейс приложения, и с помощью Hermes/Брата Адеквата;
- демо-данные должны быть убраны или отделены от реальных пользовательских данных.

## Текущее состояние

Сейчас приложение — статический прототип на GitHub Pages.

- Репозиторий: https://github.com/anastasya-teplie-ladochki/dashboard-vzrosleniya-miniapps
- Telegram: https://anastasya-teplie-ladochki.github.io/dashboard-vzrosleniya-miniapps/telegram/
- VK: https://anastasya-teplie-ladochki.github.io/dashboard-vzrosleniya-miniapps/vk/
- MAX: https://anastasya-teplie-ladochki.github.io/dashboard-vzrosleniya-miniapps/max/

Локальное хранение сейчас:

- `schemaScoresV5` — проценты схем;
- `schemaMemoEntriesV5` — сохранённые памятки;
- `schemaThemeV5` — тема.

Проблема: `localStorage` живёт отдельно в Telegram/VK/браузере и может слететь. Между платформами нет общей синхронизации.

## Выбранная архитектура для первого рабочего этапа

Для быстрого и понятного MVP используем Google Sheets как общую базу данных + небольшой HTTPS API-слой.

Почему:

- Анастасии удобно видеть данные таблицей;
- Hermes уже умеет читать/писать Google Sheets;
- Telegram и VK смогут обращаться к одному API;
- позже можно заменить Google Sheets на Supabase/Firebase без переписывания логики интерфейса полностью.

## Созданная таблица данных

Google Sheet:

**Путь взросления — данные приложения**

https://docs.google.com/spreadsheets/d/1dVpuMSqXkbQpR389fMyHCG8iZoFRmUkkx34ViDT_xk0/edit

ID:

`1dVpuMSqXkbQpR389fMyHCG8iZoFRmUkkx34ViDT_xk0`

Листы:

### Users

Пользователи/устройства/платформы.

Поля:

- `user_key`
- `platform`
- `platform_user_id`
- `display_name`
- `username`
- `first_seen_at`
- `last_seen_at`
- `notes`

### MemoEntries

Главные записи памятки.

Поля:

- `entry_id`
- `user_key`
- `platform`
- `created_at`
- `schema_id`
- `schema_name`
- `mode`
- `strategy`
- `activation`
- `marker_score`
- `old_pattern`
- `delta`
- `q1_situation`
- `q2_feelings`
- `q3_thoughts`
- `q4_auto_action`
- `q6_formed_when`
- `q7_critic`
- `q8_protective_behavior`
- `q9_reality`
- `q10a_loving_parent`
- `q10b_healthy_adult`
- `source`
- `deleted_at`

### Scores

Текущие проценты схем.

Поля:

- `user_key`
- `schema_id`
- `schema_name`
- `base_score`
- `current_score`
- `updated_at`

### AppEvents

Технические события приложения: сохранение, удаление, импорт, помощь Hermes.

Поля:

- `event_id`
- `user_key`
- `platform`
- `created_at`
- `event_type`
- `payload_json`

### Config

Настройки приложения.

Поля:

- `key`
- `value`
- `notes`

## Что нужно изменить в приложении

### 1. Убрать демо-эффект

Текущие массивы `SCHEMAS`, `MODES`, `STRATEGIES` могут остаться как справочник, но:

- они не должны выглядеть как реальные личные данные;
- стартовые проценты должны быть либо пустыми, либо загружаться из `Scores`;
- демо-блоки на главном экране нужно заменить реальным состоянием пользователя.

### 2. Добавить слой данных

Сделать в JS отдельный слой:

- `loadEntries()`
- `saveEntry(entry)`
- `deleteEntry(entryId)`
- `loadScores()`
- `saveScores(scores)`
- `syncFromBackend()`
- `syncToBackend()`

На первом этапе можно оставить fallback в `localStorage`, если API временно недоступен.

### 3. Подключить API

Нужен HTTPS endpoint, который умеет:

- принять запись памятки из приложения;
- вернуть список записей;
- пометить запись удалённой;
- вернуть/обновить проценты схем;
- принять запись, созданную через Hermes.

Варианты:

1. Google Apps Script Web App → Google Sheets.
2. Cloudflare Worker → Google Sheets API.
3. Supabase/Firebase.

Для текущего MVP рекомендуемый путь: **Google Apps Script Web App**, потому что данные уже в Google Sheets.

### 4. Hermes-заполнение

Когда Анастасия пишет в Telegram текст/голосом:

> «Заполни в Путь взросления: ситуация..., чувства..., схема...»

Hermes должен:

1. разобрать сообщение;
2. уточнить, если не хватает обязательного;
3. записать строку в `MemoEntries`;
4. пересчитать/обновить `Scores`;
5. ответить коротко: «записал, схема такая-то, взрослый шаг такой-то».

### 5. Интерфейс

В приложении нужно явно показывать:

- источник записи: `app`, `Hermes`, `import`;
- что запись сохранена;
- что запись синхронизирована;
- что есть офлайн-черновик, если API недоступен.

## Ближайший практический следующий шаг

1. Создать backend endpoint для таблицы `Путь взросления — данные приложения`.
2. Добавить в приложение `API_BASE_URL`.
3. Переписать сохранение памятки: сначала в backend, потом в локальный кэш.
4. Сделать загрузку последних записей из backend при старте приложения.
5. Проверить Telegram и VK на одном и том же наборе данных.

## Важные правила

- Не хранить секреты Google/API в клиентском HTML на GitHub Pages.
- Нельзя писать в Google Sheets напрямую из публичного HTML с приватным токеном.
- Любые ключи должны жить на backend/API-слое, а не в браузере.
- Перед публикацией внешнего backend URL согласовать с Анастасией.
