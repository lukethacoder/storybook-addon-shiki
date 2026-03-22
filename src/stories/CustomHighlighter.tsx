import React from 'react';
import { createHighlighter } from 'shiki';
import { ShikiHighlighter } from '../ShikiHighlighter';

const customHighlighter = await createHighlighter({
  themes: ['github-light', 'catppuccin-mocha'],
  langs: ['typescript', 'rust', 'go'],
});

export default function CustomHighlighter() {
  return (
    <>
      <h4>Rust with Github Light theme</h4>
      <ShikiHighlighter
        language="rust"
        copyable
        showLineNumbers
        options={{
          highlighter: customHighlighter,
          theme: 'github-light',
        }}
      >
        {`
// Rust example with custom highlighter
fn main() {
    let greeting = "Hello, World!";
    println!("{}", greeting);

    // Calculate fibonacci
    let result = fibonacci(10);
    println!("Fibonacci(10) = {}", result);
}

fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}
    `}
      </ShikiHighlighter>

      <br />

      <h4>TypeScript with Catppuccin Mocha theme</h4>
      <ShikiHighlighter
        language="typescript"
        copyable
        options={{
          highlighter: customHighlighter,
          theme: 'catppuccin-mocha',
        }}
      >
        {`
// TypeScript example with Nord theme
interface User {
  id: number;
  name: string;
  email: string;
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}!\`;
}

const user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com"
};

console.log(greetUser(user));
    `}
      </ShikiHighlighter>
    </>
  );
}
