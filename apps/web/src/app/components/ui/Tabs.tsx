"use client";

import React, { useState, ReactNode } from "react";

interface TabProps {
  label: string;
  value: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabProps[];
  defaultValue?: string;
  children: (activeTab: string) => ReactNode;
  className?: string;
  onTabChange?: (tab: string) => void;
}

export function Tabs({ tabs, defaultValue, children, className = "", onTabChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);

  // Update active tab when defaultValue changes
  React.useEffect(() => {
    if (defaultValue) {
      setActiveTab(defaultValue);
    }
  }, [defaultValue]);

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-divider mb-8">
        <nav className="flex flex-wrap gap-2 -mb-px" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                onTabChange?.(tab.value);
              }}
              className={`
                group inline-flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all duration-300
                ${
                  activeTab === tab.value
                    ? "border-[#6B73FF] text-[#6B73FF] bg-[#6B73FF]/5"
                    : "border-transparent text-faded hover:text-copy hover:border-divider"
                }
              `}
              aria-current={activeTab === tab.value ? "page" : undefined}
            >
              {tab.icon && (
                <span className={`transition-transform duration-300 ${activeTab === tab.value ? "scale-110" : ""}`}>
                  {tab.icon}
                </span>
              )}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {children(activeTab)}
      </div>
    </div>
  );
}
