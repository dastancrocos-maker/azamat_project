"use client";

import { useState, useEffect } from "react";
import { ProjectRecord, roleLabels, formatMoney } from "../lib/types";

export default function CabinetPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("projects") || "[]");
    setProjects(data);
  }, []);

  const handleDelete = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    localStorage.setItem("projects", JSON.stringify(updated));
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.fileName && p.fileName.toLowerCase().includes(search.toLowerCase())) ||
      (p.note && p.note.toLowerCase().includes(search.toLowerCase()))
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-in">
          <p
            className="text-xs font-medium uppercase tracking-[0.3em] mb-4"
            style={{ color: "var(--accent)" }}
          >
            Dashboard
          </p>
          <h1 className="text-5xl font-bold tracking-tight">
            Личный кабинет
          </h1>
          <p className="mt-4 text-base" style={{ color: "var(--muted)" }}>
            Реестр сохранённых проектов
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 animate-in animate-in-delay-1">
          <div className="card-glass p-6 text-center">
            <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
              {projects.length}
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>Всего проектов</p>
          </div>
          <div className="card-glass p-6 text-center">
            <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
              {formatMoney(projects.reduce((s, p) => s + p.totalCost, 0))}
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>Общая сумма</p>
          </div>
          <div className="card-glass p-6 text-center">
            <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
              {projects.reduce((s, p) => s + p.totalHours, 0)} ч
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>Общее кол-во часов</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8 animate-in animate-in-delay-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию, файлу или примечанию..."
            className="input-styled w-full px-5 py-3.5 text-sm"
          />
        </div>

        {/* Projects list */}
        {filtered.length === 0 ? (
          <div
            className="card-glass rounded-xl p-16 text-center animate-in animate-in-delay-3"
          >
            <div className="w-16 h-16 rounded-xl mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(88,81,250,0.04)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)" }}>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="font-medium text-sm">
              {projects.length === 0 ? "Пока нет сохранённых проектов" : "Ничего не найдено"}
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              {projects.length === 0
                ? "Создайте оценку и сохраните её в реестр"
                : "Попробуйте изменить поисковый запрос"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((project, idx) => {
              const isExpanded = expandedId === project.id;
              return (
                <div
                  key={project.id}
                  className="card-glass rounded-xl overflow-hidden"
                  style={{
                    borderColor: isExpanded ? "rgba(88,81,250,0.2)" : undefined,
                  }}
                >
                  {/* Row header */}
                  <button
                    className="w-full p-5 flex items-center justify-between text-left transition-colors duration-300"
                    onClick={() => setExpandedId(isExpanded ? null : project.id)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{project.name}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs" style={{ color: "var(--muted)" }}>
                            {formatDate(project.date)}
                          </span>
                          {project.fileName && (
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{ background: "rgba(88,81,250,0.04)", color: "var(--text-secondary)" }}
                            >
                              {project.fileName}
                            </span>
                          )}
                          {project.withNDS && (
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{ background: "rgba(34,197,94,0.08)", color: "var(--success)" }}
                            >
                              НДС
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <div className="text-right">
                        <p className="font-bold text-sm" style={{ color: "var(--accent)" }}>
                          {formatMoney(project.totalCost)}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          {project.totalHours} ч
                        </p>
                      </div>
                      <span
                        className="text-xs transition-transform duration-300"
                        style={{
                          color: "var(--muted)",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      >
                        ▼
                      </span>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-5 pb-5">
                      <div className="divider mb-5" />

                      <div className="grid md:grid-cols-2 gap-5">
                        {/* Team breakdown */}
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
                            {project.teamMode === "default" ? "Команда (по ставкам)" : "Команда (специалисты)"}
                          </p>
                          <div className="grid gap-2">
                            {project.teamMode === "default"
                              ? project.team
                                  .filter((m) => m.enabled)
                                  .map((m) => (
                                    <div
                                      key={m.role}
                                      className="flex items-center justify-between p-3 rounded-lg"
                                      style={{ background: "rgba(88,81,250,0.03)", border: "1px solid rgba(88,81,250,0.08)" }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>{roleLabels[m.role].icon}</span>
                                        <span className="text-sm">{m.label}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-sm font-medium">{formatMoney(m.rate * m.hours)}</span>
                                        <span className="text-xs ml-2" style={{ color: "var(--muted)" }}>
                                          {m.hours}ч × {formatMoney(m.rate)}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                              : project.selectedPeople.map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between p-3 rounded-lg"
                                    style={{ background: "rgba(88,81,250,0.03)", border: "1px solid rgba(88,81,250,0.08)" }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{roleLabels[p.role].icon}</span>
                                      <span className="text-sm">{p.name}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-sm font-medium">{formatMoney(p.rate * p.hours)}</span>
                                      <span className="text-xs ml-2" style={{ color: "var(--muted)" }}>
                                        {p.hours}ч × {formatMoney(p.rate)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            {project.teamMode === "default" &&
                              project.team.filter((m) => m.enabled).length === 0 && (
                                <p className="text-xs" style={{ color: "var(--muted)" }}>
                                  Команда не выбрана
                                </p>
                              )}
                          </div>
                        </div>

                        {/* Cost breakdown */}
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
                            Расчёт стоимости
                          </p>
                          <div
                            className="rounded-xl p-4"
                            style={{ background: "rgba(88,81,250,0.03)", border: "1px solid rgba(88,81,250,0.08)" }}
                          >
                            <div className="grid gap-2.5">
                              <div className="flex justify-between text-sm">
                                <span style={{ color: "var(--muted)" }}>Базовая стоимость</span>
                                <span>{formatMoney(project.baseCost)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span style={{ color: "var(--muted)" }}>Админ. расходы (30%)</span>
                                <span>{formatMoney(project.adminCost)}</span>
                              </div>
                              {project.withNDS && (
                                <div className="flex justify-between text-sm">
                                  <span style={{ color: "var(--muted)" }}>НДС (16%)</span>
                                  <span>{formatMoney(project.ndsCost)}</span>
                                </div>
                              )}
                              <div className="divider my-1" />
                              <div className="flex justify-between font-semibold">
                                <span>Итого</span>
                                <span style={{ color: "var(--accent)" }}>{formatMoney(project.totalCost)}</span>
                              </div>
                            </div>
                          </div>

                          {project.note && (
                            <div className="mt-4">
                              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                                Примечание
                              </p>
                              <p
                                className="text-sm p-3 rounded-lg"
                                style={{ background: "rgba(88,81,250,0.03)", border: "1px solid rgba(88,81,250,0.08)" }}
                              >
                                {project.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-5 flex justify-end">
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300"
                          style={{
                            background: "rgba(239,68,68,0.06)",
                            color: "var(--danger)",
                            border: "1px solid rgba(239,68,68,0.12)",
                          }}
                        >
                          Удалить из реестра
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
