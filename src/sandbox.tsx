import React, { useEffect } from "react";

export default function Sandbox() {
  useEffect(() => {
    window.addEventListener("message", (event) => {
      console.log("Message received in Sandbox:", event.data);
      if (event.data?.type === "fluxo:execute-block") {
        // Handle code execution in sandbox
      }
    });
  }, []);

  return <div>Fluxo Sandbox Environment</div>;
}
