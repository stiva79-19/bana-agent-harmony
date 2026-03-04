import { describe, it, expect } from "vitest";
import { extractCodeBlocks, isCloudEngine } from "../lib/executor";

describe("extractCodeBlocks", () => {
  it("extracts a single code block", () => {
    const text = "Here is the code:\n```javascript\nconsole.log('hello');\n```";
    const blocks = extractCodeBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].language).toBe("javascript");
    expect(blocks[0].code).toBe("console.log('hello');");
  });

  it("extracts multiple code blocks", () => {
    const text = "```python\nprint('hi')\n```\n\nAnd also:\n```bash\necho hello\n```";
    const blocks = extractCodeBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].language).toBe("python");
    expect(blocks[1].language).toBe("bash");
  });

  it("defaults language to javascript when not specified", () => {
    const text = "```\nconsole.log('hi');\n```";
    const blocks = extractCodeBlocks(text);
    expect(blocks[0].language).toBe("javascript");
  });

  it("returns empty array when no code blocks", () => {
    const text = "No code here, just text.";
    expect(extractCodeBlocks(text)).toHaveLength(0);
  });

  it("handles TypeScript blocks", () => {
    const text = "```typescript\nconst x: number = 42;\n```";
    const blocks = extractCodeBlocks(text);
    expect(blocks[0].language).toBe("typescript");
    expect(blocks[0].code).toBe("const x: number = 42;");
  });

  it("trims whitespace from code", () => {
    const text = "```js\n  \nconst x = 1;\n  \n```";
    const blocks = extractCodeBlocks(text);
    expect(blocks[0].code).toBe("const x = 1;");
  });
});

describe("isCloudEngine", () => {
  it("returns true for piston", () => {
    expect(isCloudEngine("piston")).toBe(true);
  });

  it("returns false for local engines", () => {
    expect(isCloudEngine("local")).toBe(false);
    expect(isCloudEngine("claude")).toBe(false);
    expect(isCloudEngine("codex")).toBe(false);
  });

  it("returns false for unavailable", () => {
    expect(isCloudEngine("unavailable")).toBe(false);
  });
});
