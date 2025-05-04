import { useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";

function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="flex flex-col items-center justify-center min-h-svh">
      <div>Count: {count}</div>
      <Button onClick={() => setCount((count) => count + 1)}>Click me</Button>
    </div>
  );
}

export default App;
