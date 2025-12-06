# REST API

## Основные endpoint'ы

### 1. Отправка сообщения в очередь 

**POST** `/api/v1/messages/queue`

**Content-Type:** `application/x-www-form-urlencoded`

**Параметры:**
- `content` (string, required): Текст сообщения для отправки
- `user_uuid` (string, required): UUID пользователя

**Пример запроса:**
```bash
curl -X POST "http://localhost:8000/api/v1/messages/queue" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "content=Привет! Расскажи что-то интересное&user_uuid=123e4567-e89b-12d3-a456-426614174000"
```

**Ответ:**
```json
{
  "user_message_id": "686da75d8767ad199b46dd3d",
  "ai_message_id": "686da75d8767ad199b46dd3e"
}
```

### 2. Получение списка сообщений с фильтрами 

**GET** `/api/v1/messages/`

**Описание:** Возвращает список сообщений пользователя с возможностью фильтрации и пагинации. Включает защиту от перегрузки и детальную информацию о производительности.

**Query параметры:**

**Обязательные:**
- `user_uuid` (UUID, required): UUID пользователя

**Фильтры (опциональные):**
- `chat_uuid` (UUID): UUID чата для фильтрации
- `role` (string): Роль сообщения (`user`, `assistant`, `system`, `tool`)
- `content_search` (string, 1-100 символов): Поиск по содержимому сообщения (регистронезависимый)
- `date_from` (datetime, ISO формат): Начальная дата для фильтрации
- `date_to` (datetime, ISO формат): Конечная дата для фильтрации
- `is_complete` (boolean): Фильтр по статусу завершенности сообщения

**Пагинация:**
- `page` (integer, 1-1000, default=1): Номер страницы
- `page_size` (integer, 1-100, default=20): Количество сообщений на странице
- `order_by` (string, default="created_at"): Поле для сортировки (`created_at`, `updated_at`, `role`)
- `order_direction` (string, default="desc"): Направление сортировки (`asc`, `desc`)

**Ограничения безопасности:**
- Максимум 100 сообщений на страницу
- Максимум 1000 страниц
- Поиск по содержимому ограничен 100 символами
- Автоматическая проверка доступа к чату

**Пример запроса (базовый):**
```bash
curl -X GET "http://localhost:8000/api/v1/messages/?user_uuid=123e4567-e89b-12d3-a456-426614174000"
```

**Пример запроса (с фильтрами):**
```bash
curl -X GET "http://localhost:8000/api/v1/messages/?user_uuid=123e4567-e89b-12d3-a456-426614174000&chat_uuid=760beced-f714-4151-8540-dc59c4671a4c&role=assistant&page=1&page_size=10&order_by=created_at&order_direction=desc"
```

**Пример запроса (поиск по содержимому):**
```bash
curl -X GET "http://localhost:8000/api/v1/messages/?user_uuid=123e4567-e89b-12d3-a456-426614174000&content_search=python&date_from=2025-01-01T00:00:00Z&is_complete=true"
```

**Ответ:**
```json
{
  "messages": [
    {
      "id": "686da75d8767ad199b46dd3e",
      "chat_uuid": "760beced-f714-4151-8540-dc59c4671a4c",
      "user_uuid": "123e4567-e89b-12d3-a456-426614174000",
      "role": "assistant",
      "content": "Полный ответ ИИ...",
      "is_complete": true,
      "created_at": "2025-07-08T23:18:53.865000",
      "updated_at": "2025-07-08T23:18:58.222000"
    }
  ],
  "metadata": {
    "total_count": 150,
    "page": 1,
    "page_size": 20,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false,
    "applied_filters": {
      "user_uuid": "123e4567-e89b-12d3-a456-426614174000",
      "role": "assistant",
      "is_complete": true
    }
  }
}
```

**Коды ошибок:**
- `400`: Некорректные параметры (например, `date_from > date_to`)
- `403`: Нет доступа к указанному чату
- `500`: Внутренняя ошибка сервера

### 3. Получение сообщения по ID 

**GET** `/api/v1/messages/{message_id}`

**Query параметры:**
- `user_uuid` (UUID, required): UUID пользователя

**Пример запроса:**
```bash
curl -X GET "http://localhost:8000/api/v1/messages/686da75d8767ad199b46dd3e?user_uuid=123e4567-e89b-12d3-a456-426614174000"
```

**Ответ:**
```json
{
  "id": "686da75d8767ad199b46dd3e",
  "chat_uuid": "760beced-f714-4151-8540-dc59c4671a4c",
  "user_uuid": "123e4567-e89b-12d3-a456-426614174000",
  "role": "assistant",
  "content": "Полный ответ ИИ...",
  "is_complete": true,
  "created_at": "2025-07-08T23:18:53.865000",
  "updated_at": "2025-07-08T23:18:58.222000"
}
```


---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 200 | Успешная обработка |
| 400 | Некорректные параметры запроса |
| 403 | Отсутствие прав доступа |
| 404 | Ресурс не найден |
| 500 | Внутренняя ошибка сервера |

## Примеры использования

### Отправка простого сообщения
```bash
curl -X POST "http://localhost:8000/api/v1/messages/queue" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "content=Привет!&user_uuid=123e4567-e89b-12d3-a456-426614174000"
```

### Получение всех сообщений пользователя
```bash
curl -X GET "http://localhost:8000/api/v1/messages/?user_uuid=123e4567-e89b-12d3-a456-426614174000" | jq
```

### Получение сообщений конкретного чата с пагинацией
```bash
curl -X GET "http://localhost:8000/api/v1/messages/?user_uuid=123e4567-e89b-12d3-a456-426614174000&chat_uuid=760beced-f714-4151-8540-dc59c4671a4c&page=2&page_size=50" | jq
```

### Поиск сообщений ассистента по содержимому
```bash
curl -X GET "http://localhost:8000/api/v1/messages/?user_uuid=123e4567-e89b-12d3-a456-426614174000&role=assistant&content_search=python&is_complete=true" | jq
```

### Получение сообщений за определенный период
```bash
curl -X GET "http://localhost:8000/api/v1/messages/?user_uuid=123e4567-e89b-12d3-a456-426614174000&date_from=2025-01-01T00:00:00Z&date_to=2025-01-31T23:59:59Z&order_by=created_at&order_direction=asc" | jq
```
