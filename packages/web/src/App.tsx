import { useState } from "react";
import "./App.css";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <Button
        onClick={() => {
          setCount(count + 1);
          toast("Count value has been updated", {
            description: new Date().toISOString(),
            action: {
              label: "Undo",
              onClick: () => setCount(count),
            },
          });
        }}
        variant="outline"
      >
        Click: {count}
      </Button>
      <Button onClick={() => setCount(0)} variant="link">
        Reset
      </Button>
      <Toaster />
    </>
  );
}

export default App;
