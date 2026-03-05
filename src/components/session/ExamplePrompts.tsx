import { motion } from "framer-motion";

const EXAMPLES = [
  "Build a login form with email/password validation",
  "Create a REST API endpoint for user registration",
  "Write a function to parse and validate a CSV file",
  "Implement a debounce hook in React",
  "Build a simple todo list with localStorage persistence",
  "Write a binary search algorithm with tests",
];

interface Props {
  onSelect: (prompt: string) => void;
}

export function ExamplePrompts({ onSelect }: Props) {
  return (
    <div className="w-full max-w-lg">
      <p className="text-xs text-muted-foreground text-center mb-3">Try an example:</p>
      <div className="grid grid-cols-1 gap-2">
        {EXAMPLES.map((ex, i) => (
          <motion.button
            key={ex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            onClick={() => onSelect(ex)}
            className="text-left text-xs text-muted-foreground hover:text-foreground bg-card hover:bg-accent border border-border hover:border-primary/30 rounded-lg px-3 py-2 transition-colors"
          >
            {ex}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
