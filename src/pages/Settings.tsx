import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Sidebar } from "@/components/layout/Sidebar";


export default function Settings() {
  return (
    <div className="flex">
      <div className="w-64">
        <Sidebar/>
      </div>
      <div className="min-h-screen flex flex-col items-center justify-center 
                      bg-white text-black 
                      dark:bg-gray-900 dark:text-white p-6 flex-1">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <div className="space-y-4">
          <div>
            <p className="mb-2">🌓 Theme</p>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
