// js/games/eliminacao/index.js
import { registerGame } from '../registry.js?v=1';
import { getDefaultData } from './model.js?v=2';
import { editorCartasMethods } from './editorCartas.js?v=2';
import { reviewMethods } from './review.js?v=2';
import { playerMethods } from './player.js?v=5';

const eliminacaoModule = {
    getDefaultData,
    ...editorCartasMethods,
    ...reviewMethods,
    ...playerMethods,
    partials: {
        editorStep4: 'partials/games/eliminacao/editor-step4.html',
        player: 'partials/games/eliminacao/player.html'
    }
};

registerGame('Eliminação', eliminacaoModule);

export default eliminacaoModule;
