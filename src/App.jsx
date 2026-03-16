import React, { useEffect, useState } from "react";

const ZONES = [
  { name: "New York", tz: "America/New_York" },
  { name: "Chicago", tz: "America/Chicago" },
  { name: "Phoenix", tz: "America/Phoenix" },
  { name: "Los Angeles", tz: "America/Los_Angeles" },
  { name: "Alaska", tz: "America/Anchorage" },
  { name: "Hawaii", tz: "Pacific/Honolulu" },
  { name: "India", tz: "Asia/Kolkata" },
  { name: "Philippines", tz: "Asia/Manila" }
];

function getTime(tz) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date());
}

export default function App() {
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div
      style={{
        background: "#09090b",
        color: "white",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "sans-serif"
      }}
    >
      <h1 style={{fontSize:"32px",marginBottom:"30px"}}>
        YouTube Kitle Saat Takip
      </h1>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",
        gap:"20px"
      }}>
        {ZONES.map(z => (
          <div
            key={z.name}
            style={{
              background:"#18181b",
              padding:"20px",
              borderRadius:"15px"
            }}
          >
            <div style={{fontSize:"14px",opacity:0.7}}>
              {z.name}
            </div>

            <div style={{fontSize:"26px",fontWeight:"bold"}}>
              {getTime(z.tz)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
