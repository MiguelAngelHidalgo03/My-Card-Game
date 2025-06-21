import Phaser from 'phaser';
import socket from '../../../utils/sockets';

export default class BoardRenderer {
    constructor(scene) {
        this.scene = scene;
        this.bg = null;
        this.mesa = null;
        this.discard = null;
        this.drawPileSprite = null
        this.lastDiscardAngle = 0;
        this.discardSprites = [];
        this.discardAngles = [];
    }
    create() {
        const s = this.scene;
        const d = s.debug;
        const { width, height } = s.scale;


        // --- FONDO, MESA Y BORDES EN COORDENADAS ABSOLUTAS ---
        this.bg = s.add.image(width / 2, height / 2, s.isMobile ? 'fondoMobile' : 'fondoDesktop')
            .setDisplaySize(width, height)
            .setOrigin(0.5);

        this.mesa = s.add.image(width / 2, height / 2, 'mesa').setOrigin(0.5);

        // Empieza la animación
       

        // --- DESCARTE ---
        const topDiscard = s.gameState?.discardPile?.slice(-1)[0];
        if (topDiscard) {

            if (!this.discard) {
                // Usa la lógica de wild/mas4 coloreado
                let frame = topDiscard.frame;
                let atlas = 'cards';
                if (frame === 'cambia_color.svg' && s.gameState.chosenColor) {
                    frame = getWildFrame('cambia_color', s.gameState.chosenColor);
                    atlas = 'cambiacolor';
                } else if (frame === 'mas4.svg' && s.gameState.chosenColor) {
                    frame = getWildFrame('mas4', s.gameState.chosenColor);
                    atlas = 'mas4';
                } else if (frame.startsWith('cambia_color')) {
                    atlas = 'cambiacolor';
                } else if (frame.startsWith('mas4')) {
                    atlas = 'mas4';
                }
                const tex = s.textures.get(atlas).get(frame);
                if (!tex) {
                    console.error(`[BoardRenderer] No existe el frame ${frame} en el atlas ${atlas}`);
                }
                const cardW = tex ? tex.width * d.discardScale : 100;
                const cardH = tex ? tex.height * d.discardScale : 150;
                this.discard = s.add.image(d.discardX, d.discardY, atlas, frame)
                    .setDisplaySize(cardW, cardH)
                    .setOrigin(0.5)
                    .setTint(d.discardTint);
                s.discard = this.discard;
            } else {
                let frame = topDiscard.frame;
                let atlas = 'cards';
                if (frame === 'cambia_color.svg' && s.gameState.chosenColor) {
                    frame = getWildFrame('cambia_color', s.gameState.chosenColor);
                    atlas = 'cambiacolor';
                } else if (frame === 'mas4.svg' && s.gameState.chosenColor) {
                    frame = getWildFrame('mas4', s.gameState.chosenColor);
                    atlas = 'mas4';
                } else if (frame.startsWith('cambia_color')) {
                    atlas = 'cambiacolor';
                } else if (frame.startsWith('mas4')) {
                    atlas = 'mas4';
                }
                // Dentro de create() y updateDiscard(), después de calcular frame y atlas:
                // console.log('[BoardRenderer] chosenColor:', s.gameState.chosenColor, 'frame:', frame, 'atlas:', atlas);
                const tex = s.textures.get(atlas).get(frame);
                if (!tex) {
                    console.error(`[BoardRenderer] No existe el frame ${frame} en el atlas ${atlas}`);
                }
                this.discard.setTexture(atlas, frame);
                this.discard.setDisplaySize(tex.width * d.discardScale, tex.height * d.discardScale);
            }
        }

        // --- DRAWPILE ---
        if (s.gameState?.drawPile?.length) {
            if (!this.drawPileSprite) {
                const frame = s.textures.get('cards').get('Reverso_Carta.svg');
                const cardW = frame.width * d.drawScale;
                const cardH = frame.height * d.drawScale;
                this.drawPileSprite = s.add.image(d.drawX, d.drawY, 'cards', 'Reverso_Carta.svg')
                    .setDisplaySize(cardW, cardH)
                    .setOrigin(0.5)
                    .setTint(d.drawTint)
                    .setInteractive({ cursor: 'pointer' });
                this.drawPileSprite.on('pointerup', () => {
                    const isLocalTurn = s.gameState.isLocalTurn(s.playerId);
                    if (!isLocalTurn || s.isDrawing) return;

                    const hand = s.gameState.localHand;
                    const topDiscard = s.gameState.topDiscard;
                    const pending = s.gameState.pendingPenalty;

                    if (pending) {
                        // ¿Tienes carta de penalización para encadenar?
                        const hasPenaltyCard = hand.some(card => {
                            const c = s.gameState.parseCardFrame(card.frame);
                            return (pending.type === '+2' && c.type === '+2') ||
                                (pending.type === '+4' && c.type === '+4');
                        });
                        if (hasPenaltyCard) {
                            this.shakeSprite(this.drawPileSprite);
                            return;
                        }
                    }
                    // Validación normal: ¿tienes jugada posible?
                    const canPlay = s.gameState.hasPlayableCard(hand, topDiscard);
                    if (canPlay) {
                        this.shakeSprite(this.drawPileSprite);
                        return;
                    }
                    // Si llegas aquí, puedes robar
                    socket.emit('card-drawn', { code: s.code, playerId: s.playerId });
                    s.isDrawing = true;
                });
                s.drawPileSprite = this.drawPileSprite;
            } else {
                // actualiza tamaño y visibilidad si el mazo cambia
                const frame = s.textures.get('cards').get('Reverso_Carta.svg');
                this.drawPileSprite.setDisplaySize(frame.width * d.drawScale, frame.height * d.drawScale);
                this.drawPileSprite.setVisible(true);
            }
        } else if (this.drawPileSprite) {
            // oculta si el mazo está vacío
            this.drawPileSprite.setVisible(false);
        }
        // Penalización pendiente
        if (s.gameState.pendingPenalty && this.drawPileSprite) {
            if (!this.penaltyText) {
                this.penaltyText = s.add.text(
                    this.drawPileSprite.x,
                    this.drawPileSprite.y - 60,
                    `+${s.gameState.pendingPenalty.amount}`,
                    { fontSize: '32px', color: '#ff3333', fontStyle: 'bold' }
                ).setOrigin(0.5).setDepth(2000);
            } else {
                this.penaltyText.setText(`+${s.gameState.pendingPenalty.amount}`);
                this.penaltyText.setVisible(true);
            }
        } else if (this.penaltyText) {
            this.penaltyText.setVisible(false);
        }






    }
    shakeSprite(sprite) {
        this.scene.tweens.add({
            targets: sprite,
            x: sprite.x + 10,
            duration: 50,
            yoyo: true,
            repeat: 3,
            onComplete: () => sprite.setX(sprite.x - 10)
        });
    }
    applyLayout() {
        const s = this.scene;
        const d = s.debug;
        if (this.bg) {
            this.bg.setDisplaySize(s.scale.width, s.scale.height).setPosition(s.scale.width / 2, s.scale.height / 2);
        }
        if (this.mesa) {
            this.mesa.setPosition(s.scale.width / 2, s.scale.height / 2);
        }
        if (this.discard) {
            const frame = s.textures.get('cards').get(this.discard.frame.name);
            const cardW = frame.width * d.discardScale;
            const cardH = frame.height * d.discardScale;
            this.discard
                .setDisplaySize(cardW, cardH)
                .setPosition(d.discardX, d.discardY)
                .setTint(d.discardTint);
            this.discard.setTint(d.discardTint);
        }
        if (this.drawPileSprite) {
            const frame = s.textures.get('cards').get('Reverso_Carta.svg');
            const cardW = frame.width * d.drawScale;
            const cardH = frame.height * d.drawScale;
            this.drawPileSprite
                .setDisplaySize(cardW, cardH)
                .setPosition(d.drawX, d.drawY)
                .setTint(d.drawTint);
        }
    }

    updateDiscard(angle = null) {
        const s = this.scene;
        const d = s.debug;
        const discardPile = s.gameState?.discardPile || [];
        const topN = 4;
        // Si llega un ángulo, guárdalo para la última carta
        if (angle !== null) {
            if (!this.discardAngles) this.discardAngles = [];
            this.discardAngles.push(angle);
            // Limita a las últimas 4
            if (this.discardAngles.length > topN) this.discardAngles = this.discardAngles.slice(-topN);
        }
        // Si no llega ángulo, rellena con 0s si hace falta
        while (this.discardAngles.length < Math.min(topN, discardPile.length)) {
            this.discardAngles.unshift(0);
        }

        // Elimina sprites viejos
        this.discardSprites.forEach(spr => spr.destroy());
        this.discardSprites = [];

        // Crea hasta 4 sprites de discard apilados
        const start = Math.max(0, discardPile.length - topN);
        for (let i = start; i < discardPile.length; i++) {
            let frame = discardPile[i].frame;
            let atlas = 'cards';
            if (frame === 'cambia_color.svg' && s.gameState.chosenColor) {
                frame = getWildFrame('cambia_color', s.gameState.chosenColor);
                atlas = 'cambiacolor';
            } else if (frame === 'mas4.svg' && s.gameState.chosenColor) {
                frame = getWildFrame('mas4', s.gameState.chosenColor);
                atlas = 'mas4';
            } else if (frame.startsWith('cambia_color')) {
                atlas = 'cambiacolor';
            } else if (frame.startsWith('mas4')) {
                atlas = 'mas4';
            }
            const tex = s.textures.get(atlas).get(frame);
            const cardW = tex ? tex.width * d.discardScale : 100;
            const cardH = tex ? tex.height * d.discardScale : 150;
            // Desplaza cada carta un poco para que se vean apiladas
            // const offset = (i - start) * 10; 
            const spr = s.add.image(d.discardX, d.discardY, atlas, frame)
                .setDisplaySize(cardW, cardH)
                .setOrigin(0.5)
                .setTint(d.discardTint)
                .setDepth(1000 + i)
                .setAngle(this.discardAngles[i - start] || 0);
            this.discardSprites.push(spr);
        }
        // El sprite superior es el "oficial" para efectos
        this.discard = this.discardSprites[this.discardSprites.length - 1];
        s.discard = this.discard;
    }
}
function getWildFrame(base, color) {
    // base: 'cambia_color' o 'mas4'
    // color: 'Azul', 'Verde', 'Naranja', 'Morada'/'Morado'
    if (!color) return base + '.svg';
    const c = color.toLowerCase();
    if (base === 'cambia_color') {
        // En CambiaColor.json es 'morada'
        if (c.startsWith('mora')) return 'cambia_color_morada.svg';
        return `cambia_color_${c}.svg`;
    }
    if (base === 'mas4') {
        // En mas4.json es 'morado'
        if (c.startsWith('mora')) return 'mas4_morado.svg';
        return `mas4_${c}.svg`;
    }
    return base + '.svg';
}