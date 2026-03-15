import React, { useState } from "react";
import { Button } from "~components/ui/Button";
import { workflowService } from "~services/WorkflowService";
import { Workflows } from "./dashboard/Workflows";
import "~style.css";

function DashboardTab() {
  const [activeTab, setActiveTab] = useState("workflows");

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-amber-600">Fluxo</h1>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {["workflows", "logs", "scheduled", "packages", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-4 py-2 rounded-md transition-colors ${
                activeTab === tab
                  ? "bg-amber-100 text-amber-800 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
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
            <h2 className="text-3xl font-semibold capitalize text-gray-800">
              {activeTab}
            </h2>
          </header>

          <section className="h-[calc(100vh-140px)]">
            {activeTab === "workflows" ? (
              <Workflows />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">{activeTab} logic is migrating to Fluxo Architecture...</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default DashboardTab;
