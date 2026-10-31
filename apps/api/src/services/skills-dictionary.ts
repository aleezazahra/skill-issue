export interface TechDefinition {
  name: string;
  patterns: RegExp[];
  ecosystem?: string;
}

const word = (value: string) =>
  new RegExp(`(?<![a-z0-9])${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9])`, "i");

export const TECHNOLOGIES: TechDefinition[] = [
  { name: "TypeScript", patterns: [word("typescript"), /\btsconfig\b/i] },
  { name: "JavaScript", patterns: [word("javascript"), word("ecmascript")] },
  { name: "React", patterns: [word("react"), word("reactjs"), word("react.js")] },
  { name: "Next.js", patterns: [word("next.js"), word("nextjs")] },
  { name: "Vue", patterns: [word("vue"), word("vuejs"), word("vue.js")] },
  { name: "Svelte", patterns: [word("svelte"), word("sveltekit")] },
  { name: "Angular", patterns: [word("angular")] },
  { name: "Tailwind CSS", patterns: [word("tailwind"), word("tailwindcss")] },
  { name: "Node.js", patterns: [word("node.js"), word("nodejs")] },
  { name: "Express", patterns: [word("express.js"), word("expressjs")] },
  { name: "NestJS", patterns: [word("nestjs")] },
  { name: "GraphQL", patterns: [word("graphql"), word("apollo")] },
  { name: "Python", patterns: [word("python")] },
  { name: "Django", patterns: [word("django")] },
  { name: "Flask", patterns: [word("flask")] },
  { name: "FastAPI", patterns: [word("fastapi")] },
  { name: "Rust", patterns: [word("rust"), word("rustlang")] },
  { name: "Go", patterns: [word("golang"), word("go-lang")] },
  { name: "Java", patterns: [word("java")] },
  { name: "Spring", patterns: [word("spring boot"), word("springboot")] },
  { name: "Kotlin", patterns: [word("kotlin")] },
  { name: "Swift", patterns: [word("swift")] },
  { name: "Ruby", patterns: [word("ruby")] },
  { name: "Rails", patterns: [word("ruby on rails"), word("rails")] },
  { name: "PHP", patterns: [word("php")] },
  { name: "Laravel", patterns: [word("laravel")] },
  { name: "C#", patterns: [word("c#"), word("csharp")] },
  { name: ".NET", patterns: [word(".net"), word("dotnet"), word("asp.net")] },
  { name: "C++", patterns: [word("c++"), word("cpp")] },
  { name: "Docker", patterns: [word("docker"), word("dockerfile")] },
  { name: "Kubernetes", patterns: [word("kubernetes"), word("k8s")] },
  { name: "AWS", patterns: [word("aws"), word("amazon web services")] },
  { name: "GCP", patterns: [word("gcp"), word("google cloud")] },
  { name: "Azure", patterns: [word("azure")] },
  { name: "PostgreSQL", patterns: [word("postgres"), word("postgresql")] },
  { name: "MySQL", patterns: [word("mysql")] },
  { name: "MongoDB", patterns: [word("mongodb"), word("mongoose")] },
  { name: "Redis", patterns: [word("redis")] },
  { name: "SQLite", patterns: [word("sqlite")] },
  { name: "Prisma", patterns: [word("prisma")] },
  { name: "TensorFlow", patterns: [word("tensorflow")] },
  { name: "PyTorch", patterns: [word("pytorch"), word("torch")] },
  { name: "Vite", patterns: [word("vite")] },
  { name: "Jest", patterns: [word("jest")] },
  { name: "Playwright", patterns: [word("playwright")] },
  { name: "Cypress", patterns: [word("cypress")] },
  { name: "Terraform", patterns: [word("terraform")] },
  { name: "Linux", patterns: [word("linux")] },
  { name: "npm", patterns: [word("npm"), word("npm-package")] },
];

const DEPENDENCY_MAP: Record<string, string> = {
  react: "React",
  "react-dom": "React",
  next: "Next.js",
  vue: "Vue",
  nuxt: "Vue",
  svelte: "Svelte",
  "@angular/core": "Angular",
  express: "Express",
  "@nestjs/core": "NestJS",
  fastify: "Node.js",
  graphql: "GraphQL",
  "@apollo/server": "GraphQL",
  typescript: "TypeScript",
  vite: "Vite",
  tailwindcss: "Tailwind CSS",
  jest: "Jest",
  vitest: "Jest",
  playwright: "Playwright",
  cypress: "Cypress",
  mongoose: "MongoDB",
  mongodb: "MongoDB",
  pg: "PostgreSQL",
  postgres: "PostgreSQL",
  mysql2: "MySQL",
  redis: "Redis",
  ioredis: "Redis",
  prisma: "Prisma",
  "@prisma/client": "Prisma",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  sqlalchemy: "SQLite",
  numpy: "Python",
  pandas: "Python",
  torch: "PyTorch",
  tensorflow: "TensorFlow",
  "spring-boot": "Spring",
  laravel: "Laravel",
  rails: "Rails",
  tokio: "Rust",
  actix: "Rust",
  axum: "Rust",
  gin: "Go",
  echo: "Go",
  fiber: "Go",
};

const CANONICAL_NAMES: Record<string, string> = {
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  nodejs: "Node.js",
  node: "Node.js",
  "node.js": "Node.js",
  reactjs: "React",
  react: "React",
  nextjs: "Next.js",
  "next.js": "Next.js",
  vuejs: "Vue",
  vue: "Vue",
  sveltekit: "Svelte",
  golang: "Go",
  go: "Go",
  cpp: "C++",
  "c++": "C++",
  csharp: "C#",
  "c#": "C#",
  dotnet: ".NET",
  ".net": ".NET",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  mongo: "MongoDB",
  mongodb: "MongoDB",
  tailwind: "Tailwind CSS",
  tailwindcss: "Tailwind CSS",
  k8s: "Kubernetes",
  aws: "AWS",
  gcp: "GCP",
  npm: "npm",
  "npm-package": "npm",
};

export function canonicalizeSkill(name: string): string {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, "-");
  return CANONICAL_NAMES[normalized] ?? name.trim();
}

const GENERIC_TOPICS: Record<string, string> = {
  cli: "CLI",
  api: "API",
  "machine-learning": "Machine Learning",
  database: "Databases",
  frontend: "Frontend",
  backend: "Backend",
  devops: "DevOps",
  testing: "Testing",
  automation: "Automation",
};

export function skillFromTopic(topic: string): string | null {
  const detected = detectTechnologies(topic);
  if (detected.length > 0) return detected[0] ?? null;
  return GENERIC_TOPICS[topic.toLowerCase()] ?? null;
}

export function detectTechnologies(text: string): string[] {
  const found = new Set<string>();
  for (const tech of TECHNOLOGIES) {
    if (tech.patterns.some((pattern) => pattern.test(text))) {
      found.add(tech.name);
    }
  }
  return [...found];
}

export function detectDependencies(content: string): string[] {
  const found = new Set<string>();
  const lower = content.toLowerCase();
  for (const [dependency, skill] of Object.entries(DEPENDENCY_MAP)) {
    if (lower.includes(dependency.toLowerCase())) {
      found.add(skill);
    }
  }
  return [...found];
}

export const LANGUAGE_ALIASES: Record<string, string[]> = {
  TypeScript: ["typescript", "ts", "tsx"],
  JavaScript: ["javascript", "js", "jsx"],
  Python: ["python", "py"],
  Rust: ["rust", "rs"],
  Go: ["go", "golang"],
  Java: ["java"],
  Kotlin: ["kotlin", "kt"],
  Ruby: ["ruby", "rb"],
  PHP: ["php"],
  "C#": ["c#", "csharp"],
  "C++": ["c++", "cpp"],
  Swift: ["swift"],
  HTML: ["html"],
  CSS: ["css"],
  Shell: ["shell", "bash"],
};
