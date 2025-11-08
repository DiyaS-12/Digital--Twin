import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { LiveDataPanel } from "@/components/dashboard/LiveDataPanel";

const Monitoring = () => {
    return(
        <div className="flex h-screen overflow-hidden">
            <div className="w-64">
                <Sidebar/>
            </div>
            <div className="flex-1 overflow-y-auto p-12">
                <LiveDataPanel/>
            </div>
        </div>
    );
};

export default Monitoring;