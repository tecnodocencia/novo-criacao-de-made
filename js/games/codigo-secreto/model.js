// js/games/codigo-secreto/model.js
export const difficultyRules = {
    1: { attempts: 10, repeat: false, swap: 0 },
    2: { attempts: 8, repeat: false, swap: 1 },
    3: { attempts: 6, repeat: false, swap: 2 },
    4: { attempts: 5, repeat: false, swap: 3 }
};

export function getDefaultData() {
    return {
        frontDesign: "imagens/frente/frente01.png",
        backDesign: "imagens/verso/Cópia de Trás da Carta - Natureza.png",
        disciplineInfo: { disciplina: "Biologia", conteudo: "Mamífero", serie: "1º ano", autores: [] },
        regra: 'Escolher as cartas corretas sobre <strong style="color:#b91c1c">Mamíferos</strong>. Posicionar as cartas escolhidas corretamente. Verificar o feedback. Se acertar, o jogo finaliza; se errar, o jogo abre a possibilidade para uma nova tentativa. O número de tentativas depende do nível do jogo: 10 (nível 1), 8 (nível 2), 6 (nível 3), 5 (nível 4). A pontuação depende do número de tentativas dentro do Nível escolhido.',
        objetivo: 'Descobrir, com o menor número de tentativas, o Código Secreto composto pelo conteúdo sobre <strong style="color:#b91c1c">Mamíferos</strong> da área de <strong style="color:#b91c1c">Biologia</strong>, acertando o conteúdo e a ordem que as cartas foram selecionadas.',
        enunciado: 'Escolha as cartas que representam <strong style="color:#b91c1c">animais mamíferos</strong> e coloque-as na ordem correta para desvendar o código secreto.',
        explicacao: '• Observe as 12 possibilidades de cartas que estão no banco. \n• Clique na carta escolhida para adicioná-la à sua tentativa na mesa. \n• Repita o processo até que todos os espaços estejam preenchidos. \n• Clique no botão para validar a resposta. \n• Observe o feedback do jogo: um pino verde significa que você acertou a carta e a posição. \n• Um pino amarelo significa que a carta pertence ao código, mas está na posição errada. \n• Um pino branco significa que essa carta não faz parte do código secreto.',
        cards: Array.from({length: 12}, (_, i) => ({ id: "new-" + i, content: "", isCorrect: false, pileId: i + 1 }))
    };
}

export function getDemoGames() {
    return [
        {
            id: "default-game-1",
            name: "Jogo dos Mamíferos (Texto)",
            model: "Código Secreto",
            frontDesign: "imagens/frente/frente01.png",
            backDesign: "imagens/verso/Cópia de Trás da Carta - Natureza.png",
            disciplineInfo: {
                disciplina: "Biologia",
                conteudo: "Mamíferos",
                serie: "6º ano",
                autores: ["Profª Maria Silva", "Prof. João Souza"]
            },
            regra: "Escolher as cartas corretas sobre <strong style=\"color:#b91c1c\">Mamíferos</strong>. Posicionar as cartas escolhidas corretamente. Verificar o feedback. Se acertar, o jogo finaliza; se errar, o jogo abre a possibilidade para uma nova tentativa.",
            objetivo: "Descobrir, com o menor número de tentativas, o Código Secreto composto pelo conteúdo sobre <strong style=\"color:#b91c1c\">Mamíferos</strong>.",
            enunciado: "Escolha as cartas que representam <strong style=\"color:#b91c1c\">animais mamíferos</strong> e coloque-as na ordem correta.",
            explicacao: "Feedback visual: Verde (Carta e Posição OK), Amarelo (Carta no Código, Posição Errada), Branco (Não faz parte).",
            cards: [
                { id: 0, content: "Baleia", isCorrect: true, pileId: 1 },
                { id: 1, content: "Morcego", isCorrect: true, pileId: 2 },
                { id: 2, content: "Ornitorrinco", isCorrect: true, pileId: 3 },
                { id: 3, content: "Leão", isCorrect: true, pileId: 4 },
                { id: 4, content: "Golfinho", isCorrect: true, pileId: 5 },
                { id: 5, content: "Ser Humano", isCorrect: true, pileId: 6 },
                { id: 6, content: "Pinguim", isCorrect: false, pileId: 7 },
                { id: 7, content: "Tartaruga", isCorrect: false, pileId: 8 },
                { id: 8, content: "Sapo", isCorrect: false, pileId: 9 },
                { id: 9, content: "Cobra", isCorrect: false, pileId: 10 },
                { id: 10, content: "Tubarão", isCorrect: false, pileId: 11 },
                { id: 11, content: "Jacaré", isCorrect: false, pileId: 12 }
            ]
        },
        {
            id: "default-game-images",
            name: "Jogo dos Mamíferos (Imagens)",
            model: "Código Secreto",
            frontDesign: "imagens/frente/frente01.png",
            backDesign: "imagens/verso/Cópia de Trás da Carta - Natureza.png",
            disciplineInfo: {
                disciplina: "Biologia",
                conteudo: "Mamíferos",
                serie: "6º ano",
                autores: ["Profª Maria Silva", "Prof. João Souza"]
            },
            regra: "Escolher as cartas corretas sobre <strong style=\"color:#b91c1c\">Mamíferos</strong> usando apenas as imagens como guia.",
            objetivo: "Identificar os mamíferos através das imagens e desvendar o Código Secreto.",
            enunciado: "Observe as imagens e selecione as que representam <strong style=\"color:#b91c1c\">mamíferos</strong>.",
            explicacao: "As imagens representam diferentes classes de animais. Apenas mamíferos fazem parte do código.",
            cards: [
                { id: 100, content: "Elefante", contentImage: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=400", isCorrect: true, pileId: 1 },
                { id: 101, content: "Tigre", contentImage: "https://images.unsplash.com/photo-1477764250597-dffe9f601ae8?auto=format&fit=crop&w=400", isCorrect: true, pileId: 2 },
                { id: 102, content: "Cachorro", contentImage: "https://images.unsplash.com/photo-1559190394-df5a28aab5c5?auto=format&fit=crop&w=400", isCorrect: true, pileId: 3 },
                { id: 103, content: "Gato", contentImage: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400", isCorrect: true, pileId: 4 },
                { id: 104, content: "Canguru", contentImage: "https://static.nationalgeographicbrasil.com/files/styles/image_3200/public/nationalgeographic2709937.webp?w=760&h=1054", isCorrect: true, pileId: 5 },
                { id: 105, content: "Cavalo", contentImage: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=400", isCorrect: true, pileId: 6 },
                { id: 106, content: "Águia", contentImage: "https://adilsoncardoso.com/wp-content/uploads/2022/04/A-aguia-1.jpg", isCorrect: false, pileId: 7 },
                { id: 107, content: "Crocodilo", contentImage: "https://images.unsplash.com/photo-1549240923-93a2e080e653?auto=format&fit=crop&w=400", isCorrect: false, pileId: 8 },
                { id: 108, content: "Peixe-Palhaço", contentImage: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&w=400", isCorrect: false, pileId: 9 },
                { id: 109, content: "Pato", contentImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGw1voknMq3U4UqLdp_pHlMt5oBhZYhfBv9g&s", isCorrect: false, pileId: 10 },
                { id: 110, content: "Borboleta", contentImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrGJxmfhqYoyi3sB1Lw6XLL1MiqXq2jiPRHA&s", isCorrect: false, pileId: 11 },
                { id: 111, content: "Sapo", contentImage: "https://upload.wikimedia.org/wikipedia/commons/5/55/Bufotes_balearicus_female.jpg", isCorrect: false, pileId: 12 }
            ]
        }
    ];
}
