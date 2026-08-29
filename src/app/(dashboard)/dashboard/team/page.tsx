"use client";

import { Users2, Mail, Phone, Building2 } from "lucide-react";

export default function TeamPage() {
  const team = [
    { id: "PT001", name: "Dr. Sarah Chen", role: "Placement Director", companies: 45, offers: 120, email: "sarah@placementos.ai", phone: "+1 234-567-8900" },
    { id: "PT002", name: "James Wilson", role: "Senior Lead", companies: 30, offers: 85, email: "james@placementos.ai", phone: "+1 234-567-8901" },
    { id: "PT003", name: "Priya Patel", role: "Tech Recruiter Liaison", companies: 55, offers: 210, email: "priya@placementos.ai", phone: "+1 234-567-8902" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users2 className="text-indigo-600 dark:text-indigo-400" /> 
          Placement Team
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage team members and track their performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map(member => (
          <div key={member.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xl">
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{member.role}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Mail size={16} className="text-gray-400" /> {member.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Phone size={16} className="text-gray-400" /> {member.phone}
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex-1">
                <p className="text-xs text-gray-500">Companies</p>
                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1"><Building2 size={14} className="text-emerald-500"/> {member.companies}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Offers Managed</p>
                <p className="font-bold text-gray-900 dark:text-white">{member.offers}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
