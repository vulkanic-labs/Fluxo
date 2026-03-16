import React, { useState, useEffect } from "react";
import { Button } from "~components/ui/Button";
import { workflowService } from "~services/WorkflowService";
import { Workflows } from "./dashboard/Workflows";
import { WorkflowEditor } from "./dashboard/WorkflowEditor";
import "~style.css";

import { ThemeProvider } from "~context/ThemeContext";

function DashboardInner() {
  const [activeTab, setActiveTab] = useState("workflows");
  const [hash, setHash] = useState(() => typeof window !== 'undefined' ? window.location.hash : "");

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (hash.startsWith("#/workflows/") && hash.length > 12) {
    const workflowId = hash.replace("#/workflows/", "");
    return <WorkflowEditor workflowId={workflowId} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-amber-600">Fluxo</h1>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {["workflows", "logs", "scheduled", "packages", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-4 py-2 rounded-md transition-colors ${
                activeTab === tab
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6 flex justify-between items-center">
            <h2 className="text-3xl font-semibold capitalize text-gray-800 dark:text-gray-100">
              {activeTab}
            </h2>
          </header>

          <section className="h-[calc(100vh-140px)]">
            {activeTab === "workflows" ? (
              <Workflows />
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 min-h-[400px] flex items-center justify-center transition-colors">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">{activeTab} logic is migrating to Fluxo Architecture...</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function DashboardTab() {
  return (
    <ThemeProvider>
      <DashboardInner />
    </ThemeProvider>
  );
}

export default DashboardTab;
