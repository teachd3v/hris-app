"use client";

import { useState } from "react";

export default function AdminHeader() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="topbar glass" style={{ marginBottom: 0 }}>
      <div className="topbar-left">
        <input
          type="text"
          placeholder="Cari nama, divisi, NIK..."
          className="topbar-search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="topbar-right">
        <button className="topbar-action notification">
          🔔
          <span className="topbar-badge">1</span>
        </button>

        <div className="topbar-profile">
          <div className="topbar-avatar">RH</div>
          <div className="topbar-profile-text">
            <div className="topbar-profile-label">Admin</div>
            <div className="topbar-profile-name">Rizki Hidayat</div>
          </div>
        </div>
      </div>
    </div>
  );
}
