import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `Ты — эксперт по оценке IT проектов. Тебе дают техническое задание (ТЗ) проекта.
Проанализируй его и определи, какие специалисты нужны для реализации, и сколько часов примерно потребуется каждому.

Доступные роли:
- backend (Backend Developer) — серверная логика, API, базы данных
- frontend (Frontend Developer) — интерфейс, вёрстка, клиентская логика
- webmaster (Web Master) — поддержка сайтов, CMS, контент
- ui_designer (Designer UI/UX) — дизайн интерфейса, UX/UI
- graphic_designer (Графический Designer) — графика, баннеры, иллюстрации
- pm (Project Manager) — управление проектом, координация
- pm_support (PM тех. поддержки) — техническая поддержка, сопровождение
- ai_engineer (AI инженер) — машинное обучение, нейросети, AI
- unity (Unity разработчик) — разработка на Unity, игры, AR/VR
- 3d_modeler (3D моделлер) — 3D моделирование, визуализация
- devops (DevOps Engineer) — инфраструктура, CI/CD, деплой
- qa (QA Engineer) — тестирование, обеспечение качества

Ответь СТРОГО в формате JSON (без markdown, без пояснений):
{
  "analysis": "краткое описание проекта (1-2 предложения)",
  "team": [
    { "role": "backend", "hours": 120, "reason": "почему нужен и что будет делать" },
    { "role": "frontend", "hours": 80, "reason": "почему нужен и что будет делать" }
  ],
  "stages": [
    {
      "name": "Дизайн",
      "description": "Описание этапа",
      "tasks": [
        { "name": "Название задачи", "ui_designer": 8, "frontend": 0, "backend": 0, "qa": 0, "pm": 2 }
      ]
    },
    {
      "name": "Frontend разработка",
      "description": "Описание этапа",
      "tasks": [
        { "name": "Название задачи", "ui_designer": 0, "frontend": 16, "backend": 0, "qa": 0, "pm": 2 }
      ]
    }
  ]
}

ВАЖНО про stages:
- Разбей проект на 3-6 крупных этапов (Дизайн, Frontend, Backend, Интеграции, Тестирование и запуск, и т.п.)
- Каждый этап содержит 3-10 конкретных задач
- Для каждой задачи укажи часы по нужным ролям (0 если роль не нужна, можно не указывать роли с 0)
- Возможные ключи в задачах: backend, frontend, webmaster, ui_designer, graphic_designer, pm, pm_support, ai_engineer, unity, 3d_modeler, devops, qa
- Задачи должны быть конкретными и понятными заказчику
- Сумма часов по задачам должна совпадать с общими часами в team

Включай только тех специалистов, которые реально нужны. Оценивай часы реалистично.`;

export async function POST(request: NextRequest) {
  try {
    const { content, fileName } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Не передано содержимое файла" },
        { status: 400 }
      );
    }

    // Limit content to ~6000 words (~20k tokens) to stay within rate limits
    const truncated = content.split(/\s+/).slice(0, 6000).join(" ");

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Файл: ${fileName || "ТЗ"}\n\nСодержимое технического задания:\n\n${truncated}`,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    let text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Strip markdown code block wrappers if present
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Claude API error:", error);
    const msg = error instanceof Error ? error.message : "Ошибка анализа";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
