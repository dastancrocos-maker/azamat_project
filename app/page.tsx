"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Role, TeamMode, DefaultMember, SelectedPerson, ProjectRecord,
  roleLabels, people, defaultTeam, formatMoney,
} from "./lib/types";

interface StageTask {
  name: string;
  [key: string]: string | number;
}

interface Stage {
  name: string;
  description: string;
  tasks: StageTask[];
}

interface AnalysisResult {
  analysis: string;
  team: { role: Role; hours: number; reason: string }[];
  stages?: Stage[];
}

export default function Home() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [teamMode, setTeamMode] = useState<TeamMode>("default");
  const [team, setTeam] = useState<DefaultMember[]>(defaultTeam);
  const [selectedPeople, setSelectedPeople] = useState<SelectedPerson[]>([]);
  const [withNDS, setWithNDS] = useState(false);
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [openRole, setOpenRole] = useState<Role | null>(null);
  const [saved, setSaved] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const NDS_RATE = 0.16;
  const ADMIN_RATE = 0.30;

  const updateMember = (index: number, updates: Partial<DefaultMember>) => {
    setTeam((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...updates } : m))
    );
  };

  const togglePerson = (person: SelectedPerson | { id: string; name: string; role: Role; rate: number }) => {
    setSelectedPeople((prev) => {
      const exists = prev.find((p) => p.id === person.id);
      if (exists) return prev.filter((p) => p.id !== person.id);
      return [...prev, { ...person, hours: 0 }];
    });
  };

  const updatePersonHours = (id: string, hours: number) => {
    setSelectedPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, hours } : p))
    );
  };

  const baseCost =
    teamMode === "default"
      ? team.reduce((sum, m) => (m.enabled ? sum + m.rate * m.hours : sum), 0)
      : selectedPeople.reduce((sum, p) => sum + p.rate * p.hours, 0);

  const adminCost = baseCost * ADMIN_RATE;
  const subtotal = baseCost + adminCost;
  const ndsCost = withNDS ? subtotal * NDS_RATE : 0;
  const totalCost = subtotal + ndsCost;

  const totalHours =
    teamMode === "default"
      ? team.reduce((sum, m) => (m.enabled ? sum + m.hours : sum), 0)
      : selectedPeople.reduce((sum, p) => sum + p.hours, 0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const readFile = (file: File) => {
    setFileName(file.name);
    setAnalysisResult(null);
    setAnalysisError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileContent(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!fileContent) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fileContent, fileName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка API");
      setAnalysisResult(data);

      setTeam((prev) =>
        prev.map((m) => {
          const match = data.team.find((t: { role: Role; hours: number }) => t.role === m.role);
          if (match) return { ...m, enabled: true, hours: match.hours };
          return { ...m, enabled: false, hours: 0 };
        })
      );
    } catch (err: unknown) {
      setAnalysisError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = () => {
    const record: ProjectRecord = {
      id: Date.now().toString(),
      name: projectName || "Без названия",
      date: new Date().toISOString(),
      fileName,
      teamMode,
      team,
      selectedPeople,
      withNDS,
      note,
      baseCost,
      adminCost,
      ndsCost,
      totalCost,
      totalHours,
    };

    const existing = JSON.parse(localStorage.getItem("projects") || "[]");
    existing.unshift(record);
    localStorage.setItem("projects", JSON.stringify(existing));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const roles: Role[] = [
    "backend", "frontend", "webmaster", "ui_designer", "graphic_designer",
    "pm", "pm_support", "ai_engineer", "unity", "3d_modeler", "devops", "qa",
  ];

  const generateExcel = async () => {
    const ratesMap: Record<string, number> = {};
    if (teamMode === "default") {
      for (const m of team) {
        if (m.enabled) {
          ratesMap[m.role] = m.rate;
        }
      }
    } else {
      const roleRates: Record<string, number[]> = {};
      for (const p of selectedPeople) {
        if (!roleRates[p.role]) roleRates[p.role] = [];
        roleRates[p.role].push(p.rate);
      }
      for (const [key, arr] of Object.entries(roleRates)) {
        ratesMap[key] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      }
    }

    const stages: Stage[] = analysisResult?.stages || buildDefaultStages();

    const body = {
      projectName: projectName || "Без названия",
      contactName: "",
      contactRole: "",
      contactPhone: "",
      contactEmail: "",
      rates: ratesMap,
      stages,
      withNDS,
      note,
      analysisText: analysisResult?.analysis || "",
    };

    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      alert("Ошибка: " + (err.error || "Не удалось сгенерировать файл"));
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName || "Смета"}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildDefaultStages = (): Stage[] => {
    const activeMembers = teamMode === "default" ? team.filter((m) => m.enabled) : [];
    const stages: Stage[] = [];

    const has = (role: Role) => teamMode === "default"
      ? activeMembers.some((m) => m.role === role)
      : selectedPeople.some((p) => p.role === role);

    const getH = (role: Role) => {
      if (teamMode === "default") {
        const m = activeMembers.find((m) => m.role === role);
        return m ? m.hours : 0;
      }
      return selectedPeople.filter((p) => p.role === role).reduce((s, p) => s + p.hours, 0);
    };

    if (has("ui_designer") || has("graphic_designer")) {
      stages.push({
        name: "Дизайн",
        description: "Разработка UI/UX дизайна и графики проекта",
        tasks: [
          { name: "Разработка дизайн-макетов", ui_designer: Math.round(getH("ui_designer") * 0.7), pm: has("pm") ? Math.round(getH("pm") * 0.1) : 0 },
          { name: "UI Kit и дизайн-система", ui_designer: Math.round(getH("ui_designer") * 0.3) },
          ...(has("graphic_designer") ? [{ name: "Графический дизайн и иллюстрации", graphic_designer: getH("graphic_designer") }] : []),
        ],
      });
    }

    if (has("frontend") || has("webmaster")) {
      stages.push({
        name: "Frontend разработка",
        description: "Вёрстка и клиентская логика",
        tasks: [
          ...(has("frontend") ? [
            { name: "Вёрстка интерфейса", frontend: Math.round(getH("frontend") * 0.5), pm: has("pm") ? Math.round(getH("pm") * 0.15) : 0 },
            { name: "Интерактивная логика и интеграция", frontend: Math.round(getH("frontend") * 0.5) },
          ] : []),
          ...(has("webmaster") ? [{ name: "Web-разработка и поддержка", webmaster: getH("webmaster") }] : []),
        ],
      });
    }

    if (has("backend")) {
      const h = getH("backend");
      stages.push({
        name: "Backend разработка",
        description: "Серверная логика и API",
        tasks: [
          { name: "Настройка инфраструктуры и БД", backend: Math.round(h * 0.25), devops: has("devops") ? Math.round(getH("devops") * 0.5) : 0 },
          { name: "Разработка API и бизнес-логики", backend: Math.round(h * 0.5), pm: has("pm") ? Math.round(getH("pm") * 0.2) : 0 },
          { name: "Интеграции с внешними сервисами", backend: Math.round(h * 0.25) },
        ],
      });
    }

    if (has("ai_engineer") || has("unity") || has("3d_modeler")) {
      stages.push({
        name: "Специализированная разработка",
        description: "AI, Unity, 3D моделирование",
        tasks: [
          ...(has("ai_engineer") ? [{ name: "AI/ML разработка", ai_engineer: getH("ai_engineer") }] : []),
          ...(has("unity") ? [{ name: "Unity разработка", unity: getH("unity") }] : []),
          ...(has("3d_modeler") ? [{ name: "3D моделирование", "3d_modeler": getH("3d_modeler") }] : []),
        ],
      });
    }

    if (has("qa") || has("devops")) {
      stages.push({
        name: "Тестирование и запуск",
        description: "Контроль качества и деплой",
        tasks: [
          ...(has("qa") ? [{ name: "Тестирование", qa: getH("qa"), pm: has("pm") ? Math.round(getH("pm") * 0.1) : 0 }] : []),
          ...(has("devops") ? [{ name: "Настройка CI/CD и деплой", devops: Math.round(getH("devops") * 0.5) }] : []),
        ],
      });
    }

    if (has("pm_support")) {
      stages.push({
        name: "Техническая поддержка",
        description: "Сопровождение и поддержка проекта",
        tasks: [
          { name: "Техническая поддержка проекта", pm_support: getH("pm_support") },
        ],
      });
    }

    return stages;
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
            Estimator
          </p>
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            Оценка IT проекта
          </h1>
          <p className="mt-4 text-base" style={{ color: "var(--muted)" }}>
            Рассчитайте стоимость и сроки вашего проекта
          </p>
        </div>

        <div className="grid gap-8">
          {/* ─── Project Name ─── */}
          <section className="card-glass p-7 animate-in animate-in-delay-1">
            <h2 className="text-base font-semibold mb-5 flex items-center gap-3">
              <span className="section-badge">*</span>
              Название проекта
            </h2>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Введите название проекта..."
              className="input-styled w-full px-4 py-3.5 text-sm"
            />
          </section>

          {/* ─── Upload TZ ─── */}
          <section className="card-glass p-7 animate-in animate-in-delay-2">
            <h2 className="text-base font-semibold mb-5 flex items-center gap-3">
              <span className="section-badge">1</span>
              Загрузка ТЗ
            </h2>
            <div
              className={`relative rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
                dragActive ? "scale-[1.005]" : ""
              }`}
              style={{
                border: `1px dashed ${dragActive ? "var(--accent)" : "rgba(88,81,250,0.12)"}`,
                background: dragActive ? "var(--accent-light)" : "rgba(88,81,250,0.03)",
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.xlsx"
                onChange={handleFileChange}
              />
              {fileName ? (
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <p className="font-medium text-sm">{fileName}</p>
                  <button
                    className="text-xs px-3 py-1.5 rounded-md transition-colors"
                    style={{ color: "var(--danger)" }}
                    onClick={(e) => { e.stopPropagation(); setFileName(null); setFileContent(null); setAnalysisResult(null); }}
                  >
                    Удалить
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ color: "var(--muted)" }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      Перетащите файл или нажмите для загрузки
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
                      PDF, DOC, DOCX, TXT, XLSX
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Analyze button */}
            {fileContent && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="mt-5 w-full py-3.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  background: analyzing ? "rgba(88,81,250,0.08)" : "var(--accent)",
                  color: "#fff",
                  opacity: analyzing ? 0.7 : 1,
                }}
              >
                {analyzing ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    AI анализирует ТЗ...
                  </>
                ) : (
                  "Анализировать ТЗ с помощью AI"
                )}
              </button>
            )}

            {/* Analysis error */}
            {analysisError && (
              <div
                className="mt-5 rounded-lg p-4"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <p className="text-sm" style={{ color: "var(--danger)" }}>
                  {analysisError}
                </p>
              </div>
            )}

            {/* Analysis result */}
            {analysisResult && (
              <div
                className="mt-5 rounded-xl p-6"
                style={{
                  background: "rgba(88,81,250,0.04)",
                  border: "1px solid rgba(88,81,250,0.15)",
                }}
              >
                <p
                  className="text-xs font-medium uppercase tracking-[0.15em] mb-3"
                  style={{ color: "var(--accent)" }}
                >
                  AI-анализ
                </p>
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
                  {analysisResult.analysis}
                </p>
                <div className="grid gap-2">
                  {analysisResult.team.map((t) => (
                    <div
                      key={t.role}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: "rgba(88,81,250,0.04)", border: "1px solid rgba(88,81,250,0.08)" }}
                    >
                      <span className="text-lg shrink-0">{roleLabels[t.role]?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{roleLabels[t.role]?.label}</span>
                          <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>{t.hours} ч</span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{t.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-4" style={{ color: "var(--muted)" }}>
                  Команда автоматически заполнена. Вы можете скорректировать часы вручную.
                </p>
              </div>
            )}
          </section>

          {/* ─── Team ─── */}
          <section className="card-glass p-7 animate-in animate-in-delay-3">
            <h2 className="text-base font-semibold mb-5 flex items-center gap-3">
              <span className="section-badge">2</span>
              Выбор команды
            </h2>

            {/* Mode Toggle */}
            <div
              className="inline-flex rounded-lg overflow-hidden mb-6"
              style={{ border: "1px solid rgba(88,81,250,0.12)" }}
            >
              <button
                className="py-2.5 px-6 text-xs font-medium transition-all duration-300"
                style={{
                  background: teamMode === "default" ? "var(--accent)" : "transparent",
                  color: teamMode === "default" ? "#fff" : "var(--muted)",
                }}
                onClick={() => setTeamMode("default")}
              >
                По умолчанию
              </button>
              <button
                className="py-2.5 px-6 text-xs font-medium transition-all duration-300"
                style={{
                  background: teamMode === "team" ? "var(--accent)" : "transparent",
                  color: teamMode === "team" ? "#fff" : "var(--muted)",
                }}
                onClick={() => setTeamMode("team")}
              >
                Команда
              </button>
            </div>

            {teamMode === "default" ? (
              <>
                <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
                  Укажите ставку (₸/час) и количество часов для каждого специалиста
                </p>
                <div className="grid gap-2.5">
                  {team.map((member, i) => (
                    <div
                      key={member.role}
                      className="rounded-xl p-4 transition-all duration-300"
                      style={{
                        background: member.enabled ? "rgba(88,81,250,0.04)" : "rgba(88,81,250,0.03)",
                        border: `1px solid ${member.enabled ? "rgba(88,81,250,0.15)" : "rgba(88,81,250,0.08)"}`,
                        opacity: member.enabled ? 1 : 0.5,
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-3 cursor-pointer min-w-[200px] flex-1">
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={member.enabled}
                              onChange={(e) => updateMember(i, { enabled: e.target.checked })}
                            />
                            <div
                              className="w-9 h-5 rounded-full transition-colors duration-300"
                              style={{ background: member.enabled ? "var(--accent)" : "rgba(88,81,250,0.12)" }}
                            >
                              <div
                                className="w-3.5 h-3.5 rounded-full bg-white transition-transform duration-300"
                                style={{
                                  transform: member.enabled ? "translate(19px, 3px)" : "translate(3px, 3px)",
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-lg">{member.icon}</span>
                          <span className="font-medium text-sm">{member.label}</span>
                        </label>
                        {member.enabled && (
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                                Ставка (₸/час)
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={member.rate}
                                onChange={(e) => updateMember(i, { rate: Number(e.target.value) })}
                                className="input-styled w-28 px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                                Часы
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={member.hours}
                                onChange={(e) => updateMember(i, { hours: Number(e.target.value) })}
                                className="input-styled w-24 px-3 py-2 text-sm"
                              />
                            </div>
                            {member.hours > 0 && (
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                                  Итого
                                </label>
                                <span className="text-sm font-semibold py-2" style={{ color: "var(--accent)" }}>
                                  {formatMoney(member.rate * member.hours)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
                  Выберите конкретных специалистов из списка
                </p>
                <div className="grid gap-2.5">
                  {roles.map((role) => {
                    const info = roleLabels[role];
                    const rolePeople = people.filter((p) => p.role === role);
                    const selected = selectedPeople.filter((p) => p.role === role);
                    const isOpen = openRole === role;

                    return (
                      <div
                        key={role}
                        className="rounded-xl overflow-hidden transition-all duration-300"
                        style={{
                          background: selected.length > 0 ? "rgba(88,81,250,0.04)" : "rgba(88,81,250,0.03)",
                          border: `1px solid ${selected.length > 0 ? "rgba(88,81,250,0.15)" : "rgba(88,81,250,0.08)"}`,
                        }}
                      >
                        <button
                          className="w-full p-4 flex items-center justify-between text-left"
                          onClick={() => setOpenRole(isOpen ? null : role)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{info.icon}</span>
                            <span className="font-medium text-sm">{info.label}</span>
                            {selected.length > 0 && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: "var(--accent)", color: "#fff" }}
                              >
                                {selected.length}
                              </span>
                            )}
                          </div>
                          <span
                            className="text-xs transition-transform duration-300"
                            style={{
                              color: "var(--muted)",
                              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            }}
                          >
                            ▼
                          </span>
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4">
                            <div className="grid gap-2">
                              {rolePeople.map((person) => {
                                const isSelected = selectedPeople.some((p) => p.id === person.id);
                                const sp = selectedPeople.find((p) => p.id === person.id);
                                return (
                                  <div
                                    key={person.id}
                                    className="rounded-lg p-3 transition-all duration-300"
                                    style={{
                                      background: isSelected ? "rgba(88,81,250,0.06)" : "rgba(88,81,250,0.04)",
                                      border: `1px solid ${isSelected ? "rgba(88,81,250,0.2)" : "rgba(88,81,250,0.08)"}`,
                                    }}
                                  >
                                    <div className="flex flex-wrap items-center gap-3">
                                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-[180px]">
                                        <div className="relative">
                                          <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={isSelected}
                                            onChange={() => togglePerson(person)}
                                          />
                                          <div
                                            className="w-5 h-5 rounded flex items-center justify-center text-xs transition-all duration-200"
                                            style={{
                                              background: isSelected ? "var(--accent)" : "transparent",
                                              border: `1.5px solid ${isSelected ? "var(--accent)" : "rgba(88,81,250,0.2)"}`,
                                              color: "#fff",
                                            }}
                                          >
                                            {isSelected && "✓"}
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">{person.name}</p>
                                          <p className="text-xs" style={{ color: "var(--muted)" }}>
                                            {formatMoney(person.rate)}/час
                                          </p>
                                        </div>
                                      </label>
                                      {isSelected && sp && (
                                        <div className="flex items-center gap-3">
                                          <div className="flex flex-col gap-1">
                                            <label className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                                              Часы
                                            </label>
                                            <input
                                              type="number"
                                              min={0}
                                              value={sp.hours}
                                              onChange={(e) => updatePersonHours(person.id, Number(e.target.value))}
                                              className="input-styled w-20 px-3 py-1.5 text-sm"
                                            />
                                          </div>
                                          {sp.hours > 0 && (
                                            <div className="flex flex-col gap-1">
                                              <label className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                                                Итого
                                              </label>
                                              <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                                                {formatMoney(sp.rate * sp.hours)}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedPeople.length > 0 && (
                  <div
                    className="mt-5 rounded-xl p-4"
                    style={{ background: "rgba(88,81,250,0.03)", border: "1px solid rgba(88,81,250,0.08)" }}
                  >
                    <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
                      Выбранные специалисты
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPeople.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                        >
                          {roleLabels[p.role].icon} {p.name}
                          <button
                            className="ml-1 hover:opacity-70 transition-opacity"
                            onClick={() => togglePerson(p)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ─── NDS + Notes ─── */}
          <div className="grid md:grid-cols-2 gap-8">
            <section className="card-glass p-7 animate-in animate-in-delay-4">
              <h2 className="text-base font-semibold mb-5 flex items-center gap-3">
                <span className="section-badge">3</span>
                Налоги
              </h2>
              <div
                className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all duration-300"
                style={{
                  background: withNDS ? "rgba(88,81,250,0.04)" : "rgba(88,81,250,0.03)",
                  border: `1px solid ${withNDS ? "rgba(88,81,250,0.15)" : "rgba(88,81,250,0.08)"}`,
                }}
                onClick={() => setWithNDS(!withNDS)}
              >
                <div>
                  <p className="font-medium text-sm">НДС 16%</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {withNDS ? "Включён в расчёт" : "Не включён"}
                  </p>
                </div>
                <div
                  className="w-9 h-5 rounded-full transition-colors duration-300"
                  style={{ background: withNDS ? "var(--accent)" : "rgba(88,81,250,0.12)" }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full bg-white transition-transform duration-300"
                    style={{
                      transform: withNDS ? "translate(19px, 3px)" : "translate(3px, 3px)",
                    }}
                  />
                </div>
              </div>
              <div
                className="rounded-xl p-4 mt-3"
                style={{ background: "rgba(88,81,250,0.03)", border: "1px solid rgba(88,81,250,0.08)" }}
              >
                <p className="font-medium text-sm">Административные расходы 30%</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  Автоматически включены в итоговый расчёт
                </p>
              </div>
            </section>

            <section className="card-glass p-7 animate-in animate-in-delay-5">
              <h2 className="text-base font-semibold mb-5 flex items-center gap-3">
                <span className="section-badge">4</span>
                Примечание
              </h2>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Дополнительные комментарии к проекту..."
                rows={5}
                className="input-styled w-full px-4 py-3.5 text-sm resize-none"
              />
            </section>
          </div>

          {/* ─── Summary ─── */}
          <section
            className="card-glass p-7"
            style={{
              borderColor: "rgba(88,81,250,0.2)",
              background: "rgba(88,81,250,0.03)",
            }}
          >
            <h2 className="text-base font-semibold mb-6 flex items-center gap-3">
              <span className="section-badge">₸</span>
              Итоговый расчёт
            </h2>

            <div className="grid gap-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm" style={{ color: "var(--muted)" }}>Базовая стоимость работ</span>
                <span className="font-medium text-sm">{formatMoney(baseCost)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  Административные расходы (30%)
                </span>
                <span className="font-medium text-sm">{formatMoney(adminCost)}</span>
              </div>
              {withNDS && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm" style={{ color: "var(--muted)" }}>НДС (16%)</span>
                  <span className="font-medium text-sm">{formatMoney(ndsCost)}</span>
                </div>
              )}
              <div className="divider my-2" />
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold text-lg">Итого</span>
                <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                  {formatMoney(totalCost)}
                </span>
              </div>
              {totalHours > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "var(--muted)" }}>Общее кол-во часов</span>
                  <span className="text-sm font-medium">{totalHours} ч</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-8 grid gap-3">
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="btn-primary flex-1 py-3.5 px-6 text-sm"
                  style={saved ? { background: "var(--success)" } : {}}
                >
                  {saved ? "Сохранено!" : "Сохранить в реестр"}
                </button>
                <button
                  onClick={() => { handleSave(); router.push("/cabinet"); }}
                  className="btn-outline py-3.5 px-6 text-sm"
                >
                  Сохранить и перейти
                </button>
              </div>
              <button
                onClick={generateExcel}
                className="btn-primary w-full py-3.5 px-6 text-sm flex items-center justify-center gap-2"
                style={{ background: "#0dc143" }}
              >
                Скачать смету (.xlsx)
              </button>
            </div>
          </section>
        </div>

        <p className="text-center text-xs mt-12 pb-6" style={{ color: "var(--muted)" }}>
          Все расчёты являются предварительными и могут быть скорректированы
        </p>
      </div>
    </div>
  );
}
