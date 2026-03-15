import React, { useEffect, useState } from "react";
import { Circle, Crosshair, Home, Pin, Search } from "lucide-react";
import { workflowService, type Workflow } from "~services/WorkflowService";
import { messagingService } from "~services/MessagingService";
import browser from "webextension-polyfill";

import "~style.css";

function IndexPopup() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"local" | "host" | "team">("local");

  useEffect(() => {
    async function init() {
      await workflowService.initialize();
      setWorkflows(workflowService.getWorkflows());
    }
    init();
  }, []);

  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(query.toLowerCase())
  );

  const openDocs = () => {
    window.open("https://github.com/fluxo", "_blank");
  };

  const initElementSelector = async () => {
    // Placeholder to call the background script to init element selector
    await messagingService.sendMessage("fluxo-element-selector");
    window.close();
  };

  const openDashboard = (path = "") => {
    browser.tabs.create({ url: browser.runtime.getURL(`tabs/dashboard.html#${path}`) });
    window.close();
  };

  return (
    <div className="w-[350px] min-h-[500px] bg-white flex flex-col relative font-sans">
      <div className={`absolute top-0 left-0 w-full rounded-b-2xl bg-amber-600 transition-all duration-300 ${activeTab ? 'h-48' : 'h-36'} z-0`}></div>
      
      <div className="relative z-10 px-5 pt-8 text-white flex flex-col gap-4">
        {/* Header toolbar */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold">Fluxo</h1>
          <div className="flex gap-2">
            <button 
              onClick={openDocs} 
              title="Start recording by opening the dashboard. Click to learn more"
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              <Circle size={20} />
            </button>
            <button 
              onClick={initElementSelector} 
              title="Element Selector"
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              <Crosshair size={20} />
            </button>
            <button 
              onClick={() => openDashboard('')} 
              title="Dashboard"
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              <Home size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-black pl-10 pr-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex w-full mt-2 bg-black/20 p-1 rounded-lg">
          {(["local", "host", "team"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab ? "bg-white text-amber-900 shadow-sm" : "text-white hover:bg-white/10"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Workflow List area */}
      <div className="relative z-20 px-5 pb-5 mt-4 flex-1 flex flex-col gap-2">
        {filteredWorkflows.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center border border-gray-100 mt-2">
            <div className="flex justify-center mb-3">
              <span className="text-4xl">👽</span>
            </div>
            <p className="font-semibold text-gray-800">It's empty</p>
            <button 
              className="mt-4 px-4 py-2 bg-amber-100 text-amber-700 font-medium rounded-md hover:bg-amber-200 transition-colors"
              onClick={() => openDashboard('/workflows')}
            >
              New workflow
            </button>
          </div>
        ) : (
          filteredWorkflows.map((workflow) => (
            <div key={workflow.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:border-amber-300 hover:shadow-md transition-all cursor-pointer" onClick={() => openDashboard(`/workflows/${workflow.id}`)}>
              <span className="font-medium text-gray-800">{workflow.name}</span>
              <button className="text-gray-400 hover:text-amber-500 transition-colors">
                <Pin size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default IndexPopup;
