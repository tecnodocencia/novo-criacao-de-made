// js/games/codigo-secreto/index.js
import { registerGame } from '../registry.js?v=1';
import { difficultyRules, getDefaultData, getDemoGames } from './model.js?v=3';
import { editorCartasMethods } from './editorCartas.js?v=5';
import { reviewMethods } from './review.js?v=3';
import { playerMethods } from './player.js?v=4';

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
