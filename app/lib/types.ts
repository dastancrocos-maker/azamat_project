export type Role =
  | "backend"
  | "frontend"
  | "webmaster"
  | "ui_designer"
  | "graphic_designer"
  | "pm"
  | "pm_support"
  | "ai_engineer"
  | "unity"
  | "3d_modeler"
  | "devops"
  | "qa";

export type TeamMode = "default" | "team";

export interface Person {
  id: string;
  name: string;
  role: Role;
  rate: number;
}

export interface DefaultMember {
  role: Role;
  label: string;
  icon: string;
  rate: number;
  hours: number;
  enabled: boolean;
}

export interface SelectedPerson extends Person {
  hours: number;
}

export interface ProjectRecord {
  id: string;
  name: string;
  date: string;
  fileName: string | null;
  teamMode: TeamMode;
  team: DefaultMember[];
  selectedPeople: SelectedPerson[];
  withNDS: boolean;
  note: string;
  baseCost: number;
  adminCost: number;
  ndsCost: number;
  totalCost: number;
  totalHours: number;
}

export const roleLabels: Record<Role, { label: string; icon: string }> = {
  backend:          { label: "Backend Developer",       icon: "⚙️" },
  frontend:         { label: "Frontend Developer",      icon: "🖥️" },
  webmaster:        { label: "Web Master",              icon: "🌐" },
  ui_designer:      { label: "Designer UI/UX",          icon: "🎨" },
  graphic_designer: { label: "Графический Designer",    icon: "🖌️" },
  pm:               { label: "Project Manager",         icon: "📋" },
  pm_support:       { label: "PM тех. поддержки",       icon: "🛟" },
  ai_engineer:      { label: "AI инженер",              icon: "🤖" },
  unity:            { label: "Unity разработчик",        icon: "🎮" },
  "3d_modeler":     { label: "3D моделлер",             icon: "🧊" },
  devops:           { label: "DevOps Engineer",          icon: "🔧" },
  qa:               { label: "QA Engineer",              icon: "🧪" },
};

export const people: Person[] = [
  // Backend — 9000 ₸/час
  { id: "1",  name: "Андрей",    role: "backend", rate: 9000 },
  { id: "2",  name: "Кирилл",    role: "backend", rate: 9000 },
  { id: "3",  name: "Маулен",    role: "backend", rate: 9000 },
  { id: "4",  name: "Иван",      role: "backend", rate: 9000 },
  { id: "5",  name: "Абылай",    role: "backend", rate: 9000 },

  // Frontend — 8000 ₸/час
  { id: "6",  name: "Нургелды",   role: "frontend", rate: 8000 },
  { id: "7",  name: "Шынгыс",    role: "frontend", rate: 8000 },

  // Web Master — 4000 ₸/час
  { id: "8",  name: "Дастан",    role: "webmaster", rate: 4000 },
  { id: "9",  name: "Артем Ю",   role: "webmaster", rate: 4000 },
  { id: "10", name: "Арлан",     role: "webmaster", rate: 4000 },

  // Designer UI/UX — 6000 ₸/час
  { id: "11", name: "Артем К",   role: "ui_designer", rate: 6000 },

  // Графический Designer — 6000 ₸/час
  { id: "12", name: "Марат",     role: "graphic_designer", rate: 6000 },

  // Project Manager — 5000 ₸/час
  { id: "13", name: "Адлет",     role: "pm", rate: 5000 },
  { id: "14", name: "Назира",    role: "pm", rate: 5000 },
  { id: "15", name: "Нурбике",   role: "pm", rate: 5000 },
  { id: "16", name: "Нурсипат",  role: "pm", rate: 5000 },
  { id: "17", name: "Назерке",   role: "pm", rate: 5000 },
  { id: "18", name: "Сафина",    role: "pm", rate: 5000 },

  // PM тех. поддержки — 5000 ₸/час
  { id: "19", name: "Салима",    role: "pm_support", rate: 5000 },
  { id: "20", name: "Заманбек",  role: "pm_support", rate: 5000 },
  { id: "21", name: "Сымбат",   role: "pm_support", rate: 5000 },
  { id: "22", name: "Адема",    role: "pm_support", rate: 5000 },
  { id: "23", name: "Нуркен",   role: "pm_support", rate: 5000 },

  // AI инженер — 4000 ₸/час
  { id: "24", name: "Бактияр",  role: "ai_engineer", rate: 4000 },

  // Unity разработчик — 7000 ₸/час
  { id: "25", name: "Иван Я",   role: "unity", rate: 7000 },

  // 3D моделлер — 5000 ₸/час
  { id: "26", name: "Виктор",   role: "3d_modeler", rate: 5000 },
  { id: "27", name: "Дамир",    role: "3d_modeler", rate: 5000 },

  // DevOps — 8000 ₸/час
  { id: "28", name: "Нурлан",   role: "devops", rate: 8000 },
  { id: "29", name: "Илья",     role: "devops", rate: 8000 },

  // QA — 4000 ₸/час
  { id: "30", name: "Амир",     role: "qa", rate: 4000 },
];

export const defaultTeam: DefaultMember[] = [
  { role: "backend",          label: "Backend Developer",     icon: "⚙️",  rate: 9000, hours: 0, enabled: false },
  { role: "frontend",         label: "Frontend Developer",    icon: "🖥️", rate: 8000, hours: 0, enabled: false },
  { role: "webmaster",        label: "Web Master",            icon: "🌐", rate: 4000, hours: 0, enabled: false },
  { role: "ui_designer",      label: "Designer UI/UX",        icon: "🎨", rate: 6000, hours: 0, enabled: false },
  { role: "graphic_designer", label: "Графический Designer",  icon: "🖌️", rate: 6000, hours: 0, enabled: false },
  { role: "pm",               label: "Project Manager",       icon: "📋", rate: 5000, hours: 0, enabled: false },
  { role: "pm_support",       label: "PM тех. поддержки",     icon: "🛟", rate: 5000, hours: 0, enabled: false },
  { role: "ai_engineer",      label: "AI инженер",            icon: "🤖", rate: 4000, hours: 0, enabled: false },
  { role: "unity",            label: "Unity разработчик",      icon: "🎮", rate: 7000, hours: 0, enabled: false },
  { role: "3d_modeler",       label: "3D моделлер",           icon: "🧊", rate: 5000, hours: 0, enabled: false },
  { role: "devops",           label: "DevOps Engineer",        icon: "🔧", rate: 8000, hours: 0, enabled: false },
  { role: "qa",               label: "QA Engineer",            icon: "🧪", rate: 4000, hours: 0, enabled: false },
];

export const formatMoney = (n: number) =>
  n.toLocaleString("ru-RU", { minimumFractionDigits: 0 }) + " ₸";
