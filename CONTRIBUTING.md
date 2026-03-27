# Contributing to warroom

Thanks for your interest in contributing! Here's how to get started.

## Setup

```bash
git clone https://github.com/Djsand/warroom.git
cd warroom
npm install
npm run build
```

## Development

```bash
npm run dev          # Run in development mode
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## Making changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add or update tests if needed
4. Run `npm test` to make sure everything passes
5. Open a pull request

## What to work on

Check the [issues](https://github.com/Djsand/warroom/issues) tab — anything labeled `good first issue` is a great starting point.

Ideas that are always welcome:
- New example conversations in `examples/`
- Bug fixes
- Documentation improvements
- Agent personality tweaks (in `agents/`)

## Agent contributions

The 5 agents live in `agents/`. Each has a system prompt that defines its personality and objective function. If you have ideas for making the debates more interesting, open an issue first to discuss.

## Code style

- TypeScript with strict mode
- ESM modules
- Keep it simple — the codebase should be easy to understand

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
