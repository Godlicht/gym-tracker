import {
  Activity,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  History,
  LineChart,
  LogOut,
  Ruler,
  Settings,
  UserRound,
} from "lucide-react";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: Activity },
  { id: "plan", label: "Plan", icon: CalendarDays },
  { id: "exercise", label: "Ćwiczenie", icon: LineChart },
  { id: "history", label: "Historia", icon: History },
  { id: "body", label: "Parametry", icon: Ruler },
  { id: "settings", label: "Ustawienia", icon: Settings },
];

export function AppShell({ activeView, onChangeView, user, profile, onLogout, children }) {
  return (
    <div className="min-h-screen bg-ink text-zinc-100">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-line bg-coal px-5 py-5 lg:flex lg:flex-col">
        <button className="mb-8 flex items-center gap-3 text-left" type="button" onClick={() => onChangeView("dashboard")}>
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ember text-black shadow-glow">
            <Dumbbell size={23} />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">ForgeFit</p>
            <p className="text-xs text-zinc-500">Progress cockpit</p>
          </div>
        </button>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold transition ${
                  active ? "bg-ember text-black" : "text-zinc-500 hover:bg-graphite hover:text-zinc-100"
                }`}
                type="button"
                onClick={() => onChangeView(item.id)}
                title={item.label}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-line bg-graphite p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-coal text-ember">
              <UserRound size={19} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-100">{profile.name || user.name}</p>
              <p className="truncate text-xs text-zinc-500">{profile.goal}</p>
            </div>
          </div>
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-zinc-400 transition hover:border-ember/60 hover:text-zinc-100"
            type="button"
            onClick={onLogout}
          >
            <LogOut size={16} />
            Wyloguj
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-line bg-ink/90 px-4 py-4 backdrop-blur md:px-7 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <button className="flex items-center gap-3 lg:hidden" type="button" onClick={() => onChangeView("dashboard")}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ember text-black">
                <Dumbbell size={21} />
              </div>
              <div className="text-left">
                <p className="text-base font-semibold">ForgeFit</p>
                <p className="text-xs text-zinc-500">{profile.goal}</p>
              </div>
            </button>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-600">Panel użytkownika</p>
              <p className="mt-1 text-sm text-zinc-400">{profile.trainingLevel}</p>
            </div>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-zinc-500 transition hover:border-ember/60 hover:text-zinc-100 lg:hidden"
              type="button"
              onClick={onLogout}
              title="Wyloguj"
            >
              <LogOut size={18} />
            </button>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                    active ? "bg-ember text-black" : "bg-graphite text-zinc-500"
                  }`}
                  type="button"
                  onClick={() => onChangeView(item.id)}
                  title={item.label}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-4 py-7 md:px-7 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
