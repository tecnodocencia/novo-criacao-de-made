// js/games/registry.js
const registry = {};

export function registerGame(name, module) {
    registry[name] = module;
}

export function getGame(name) {
    return registry[name] || registry['Código Secreto'] || null;
}

export function listGames() {
    return Object.keys(registry);
}
