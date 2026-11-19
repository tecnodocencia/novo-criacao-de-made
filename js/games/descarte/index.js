// js/games/descarte/index.js
import { registerGame } from '../registry.js?v=1';
import { getDefaultData } from './model.js?v=5';
import { editorCartasMethods } from './editorCartas.js?v=4';
import { reviewMethods } from './review.js?v=4';
import { playerMethods } from './player.js?v=34';

const descarteModule = {
    getDefaultData,
    ...editorCartasMethods,
    ...reviewMethods,
    ...playerMethods,
    partials: {
        editorStep4: 'partials/games/descarte/editor-step4.html',
        player: 'partials/games/descarte/player.html'
    }
};

registerGame('Descarte a Carta', descarteModule);

export default descarteModule;
