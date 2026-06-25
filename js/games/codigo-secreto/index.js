// js/games/codigo-secreto/index.js
import { registerGame } from '../registry.js';
import { difficultyRules, getDefaultData, getDemoGames } from './model.js';
import { editorCartasMethods } from './editorCartas.js';
import { reviewMethods } from './review.js';
import { playerMethods } from './player.js';

const codigoSecretoModule = {
    difficultyRules,
    getDefaultData,
    getDemoGames,
    ...editorCartasMethods,
    ...reviewMethods,
    ...playerMethods,
    partials: {
        editorStep4: 'partials/games/codigo-secreto/editor-step4.html',
        player: 'partials/games/codigo-secreto/player.html',
        modals: 'partials/games/codigo-secreto/modals.html'
    }
};

registerGame('Código Secreto', codigoSecretoModule);

export default codigoSecretoModule;
