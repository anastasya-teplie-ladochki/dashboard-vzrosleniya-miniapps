# Дашборд взросления — Mini Apps

Из присланного HTML подготовлены две статические версии:

- `telegram/index.html` — версия под Telegram Mini Apps.
- `vk/index.html` — версия под VK Mini Apps.
- `original/index.html` — исходник без обвязки.
- `max/index.html` — версия под MAX Mini App.

## Что добавлено

### Telegram
- Telegram WebApp SDK: `https://telegram.org/js/telegram-web-app.js`
- `tg.ready()` и `tg.expand()`
- базовые цвета окна
- лёгкий haptic feedback на клики
- мобильная safe-area адаптация

### VK
- VK Bridge: `@vkontakte/vk-bridge`
- `VKWebAppInit`
- чтение темы VK
- лёгкий taptic feedback на клики
- мобильная safe-area адаптация

## Важно для публикации

Mini App должен лежать на HTTPS-домене. Сейчас это готовые файлы, но не деплой.
Для публикации нужно отдельно:

1. Разместить `telegram/index.html` и/или `vk/index.html` на HTTPS-хостинге.
2. Для Telegram: создать/настроить BotFather → Web App URL.
3. Для VK: создать VK Mini App в кабинете VK и указать URL.

Никакие публикации и внешние настройки не делались без подтверждения Анастасии.


### MAX
- MAX Bridge: `https://st.max.ru/js/max-web-app.js`
- базовая адаптация под MAX Mini App
- URL для подключения: `https://anastasya-teplie-ladochki.github.io/dashboard-vzrosleniya-miniapps/max/`
