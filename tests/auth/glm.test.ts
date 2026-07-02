import { describe, it, expect, afterEach } from "vitest";
import { resolveGlmAuth, GLM_BASE_URL, DEFAULT_GLM_MODEL } from "../../src/auth/glm.js";

const ENV_KEYS = ["ZAI_API_KEY", "Z_AI_API_KEY", "GLM_API_KEY", "ZHIPU_API_KEY", "ZAI_BASE_URL", "WARROOM_AGENT_MODEL"];
const saved: Record<string, string | undefined> = {};

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
    delete saved[k];
  }
});

function remember(k: string) {
  if (!(k in saved)) saved[k] = process.env[k];
}

function setEnv(k: string, v: string) {
  remember(k);
  process.env[k] = v;
}

function clearEnv() {
  for (const k of ENV_KEYS) {
    remember(k);
    delete process.env[k];
  }
}

describe("resolveGlmAuth", () => {
  it("reads a key from the environment with sensible defaults", () => {
    clearEnv();
    setEnv("ZAI_API_KEY", "secret-key");

    const auth = resolveGlmAuth();
    expect(auth).toEqual({
      token: "secret-key",
      baseUrl: GLM_BASE_URL,
      model: DEFAULT_GLM_MODEL,
      source: "env",
    });
  });

  it("honors base-url and model overrides", () => {
    clearEnv();
    setEnv("GLM_API_KEY", "k");
    setEnv("ZAI_BASE_URL", "https://proxy.example/anthropic");
    setEnv("WARROOM_AGENT_MODEL", "glm-4.7");

    const auth = resolveGlmAuth();
    expect(auth?.baseUrl).toBe("https://proxy.example/anthropic");
    expect(auth?.model).toBe("glm-4.7");
  });

  it("defaults to the GLM-5.2 flagship model", () => {
    expect(DEFAULT_GLM_MODEL).toBe("glm-5.2");
  });
});
