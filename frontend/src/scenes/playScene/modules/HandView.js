import Phaser from 'phaser';
import socket from '../../../utils/sockets';

export default class HandView {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        // No declaramos handOffset, maxVisible, cardSprites ni rivalSprites aquí
        // Todo vive en la escena principal
        this.drawQueue = [];
        this.isDrawing = false;
        this.left = null;
        this.right = null;
    }

    updateHandsAndLayout() {
        const s = this.scene;
        const d = s.debug;
        const isLocal = this.gameState.isLocalTurn(s.playerId);

        // 1) destruir viejos sprites
        (s.cardSprites || []).forEach(spr => spr.destroy());
        (s.rivalSprites || []).forEach(spr => spr.destroy());
        s.cardSprites = [];
        s.rivalSprites = [];
        if (s.handModal) {
            s.handModal.destroy();
            s.handModal = null;
            if (s.handModalBg) {
                s.handModalBg.destroy();
                s.handModalBg = null;
            }
        }
        // 2) crear sprites de mano local
        this.gameState.localHand.forEach((card, idx) => {
            const img = s.add.image(0, 0, 'cards', card.frame)
                .setOrigin(0.5)
                .setTint(d.cardTint)
                .setDepth(1000);
            img.setPosition(400, 400);
            if (isLocal) {
                img.setInteractive({ cursor: 'pointer' });
                this.setupLiftDrop(img, card, idx);
            } else {
                img.disableInteractive().setAlpha(0.5);
            }
            s.cardSprites.push(img);
        });

        // 3) crear sprites de mano rival
        this.gameState.remoteHand.forEach(() => {
            const img = s.add.image(0, 0, 'cards', 'Reverso_Carta.svg')
                .setOrigin(0.5)
                .setTint(d.rivalTint);
            s.rivalSprites.push(img);
        });

        // 4) crear flechas si no existen
        if (!this.left || !this.right) this.createArrows();
        const maxVisible = d.maxVisibleCards;
        if (s.cardSprites.length > maxVisible) {
            // Mueve el offset para mostrar la última carta robada
            s.handOffset = s.cardSprites.length - maxVisible;
        } else {
            s.handOffset = 0;
        }
        // 5) finalmente, posicionar todo
        this.layout();
        if (s.playerPanel) s.playerPanel.updateCount();
        if (!s.handModalBtn) {
            s.handModalBtn = s.add.text(
                s.scale.width - 60, d.cardY, '👁️',
                { fontSize: '36px', backgroundColor: '#222', color: '#fff', padding: { x: 10, y: 5 } }
            )
                .setOrigin(0.5)
                .setInteractive({ cursor: 'pointer' })
                .setDepth(2000)
                .on('pointerup', () => this.showHandModal());
        }
    }
    animateToDiscard(sprite, card, idx) {
        const s = this.scene;
        const d = s.debug;

        // BLOQUEA input si ya está animando
        if (s.isAnimating) return;
        s.isAnimating = true;

        if (sprite._baseY != null && sprite.y !== sprite._baseY) {
            s.tweens.add({
                targets: sprite,
                y: sprite._baseY,
                duration: 500,
                ease: 'Power1',
                onComplete: () => {
                    this._flyToDiscard(sprite, card, idx, d);
                }
            });
        } else {
            this._flyToDiscard(sprite, card, idx, d);
        }
    }

    // Nueva función auxiliar para el vuelo al discard
   _flyToDiscard(sprite, card, idx, d) {
    const s = this.scene;
    const discardX = s.discard ? s.discard.x : d.discardX;
    const discardY = s.discard ? s.discard.y : d.discardY;

    if (sprite && sprite.sys) {
        sprite.disableInteractive().setDepth(1000);
    } else if (sprite) {
        sprite.setDepth(1000);
    }

    sprite.disableInteractive().setDepth(1000);
    const angle = Phaser.Math.Between(-16, 16); // Ángulo aleatorio más realista

    s.tweens.add({
        targets: sprite,
        x: discardX,
        y: discardY,
        angle,
        scale: d.discardScale,
        duration: 700,
        ease: 'Cubic.easeIn',
        onComplete: () => {
            if (s.board && typeof s.board.updateDiscard === 'function') {
                s.board.updateDiscard(angle); // <-- PASA EL ÁNGULO
            }
            this.handlePlayCard(card, idx);
            const isWild = card.frame === 'cambia_color.svg';
            if (isWild) {
                s.events.emit('wild-played', { x: discardX, y: discardY });
            }
        }
    });
}

    handlePlayCard(card, idx) {
        const s = this.scene;
        socket.emit('card-played', {
            code: s.code, // <-- Añade el código de la partida
            playerId: s.localPlayer.playerId, // <-- Añade el playerId
            cardIndex: idx, // <-- Añade el índice de la carta jugada
            cardFrame: card.frame
        });
    }

    createArrows() {
        const s = this.scene;
        const d = s.debug;
        const fac = s.isMobile ? 0.45 : 1;

        // Flechas viven en la escena para centralización
        s.arrowLeft = s.add.text(0, 0, '<', { fontSize: `${80 * fac}px`, color: '#fff' })
            .setInteractive({ cursor: 'pointer' })
            .on('pointerup', () => this.scroll(-1));

        s.arrowRight = s.add.text(0, 0, '>', { fontSize: `${80 * fac}px`, color: '#fff' })
            .setInteractive({ cursor: 'pointer' })
            .on('pointerup', () => this.scroll(+1));

        this.left = s.arrowLeft;
        this.right = s.arrowRight;
    }

    scroll(delta) {
        const s = this.scene;
        const max = Math.max(0, s.cardSprites.length - s.debug.maxVisibleCards);
        s.handOffset = Phaser.Math.Clamp(s.handOffset + delta, 0, max);
        this.layout();
    }

    animateRemotePlay(cardIndex, cardFrame, onComplete) {
    const s = this.scene;
    const d = s.debug;
    console.log(`[HandView] Animando jugada remota: cardIndex=${cardIndex}, cardFrame=${cardFrame}`);

    // Si hay cartas rivales, busca el sprite de origen
    let sprite = null;
    let useFallback = false;
    if (cardIndex !== null && cardIndex !== undefined) {
        const remoteSprites = [...s.rivalSprites].reverse();
        sprite = remoteSprites[cardIndex];
    } else if (s.rivalSprites && s.rivalSprites.length > 0) {
        // Si no hay índice, usa la carta más a la derecha (la última jugada)
        sprite = [...s.rivalSprites].reverse()[0];
    } else {
        useFallback = true;
    }

    if (sprite) {
        const discardX = s.discard ? s.discard.x : d.discardX;
        const discardY = s.discard ? s.discard.y : d.discardY;
        const discardW = s.discard ? s.discard.displayWidth : 110 * d.discardScale;
        const discardH = s.discard ? s.discard.displayHeight : 154 * d.discardScale;

        const temp = s.add.image(sprite.x, sprite.y, 'cards', 'Reverso_Carta.svg')
            .setOrigin(0.5)
            .setDisplaySize(sprite.displayWidth, sprite.displayHeight)
            .setDepth(2000);

        const startW = sprite.displayWidth;
        const startH = sprite.displayHeight;

        // Vuelo al discard interpolando tamaño y posición de forma suave
        s.tweens.add({
            targets: temp,
            x: discardX,
            y: discardY,
            duration: 700,
            ease: 'Cubic.easeInOut',
            onUpdate: tween => {
                // Interpola el tamaño durante el vuelo
                const progress = tween.progress;
                const w = Phaser.Math.Linear(startW, discardW, progress);
                const h = Phaser.Math.Linear(startH, discardH, progress);
                temp.setDisplaySize(w, h);
            },
            onComplete: () => {
                // Giro (scaleX: 1 -> 0) y cambio de textura
                s.tweens.add({
                    targets: temp,
                    scaleX: 0,
                    duration: 180,
                    ease: 'Linear',
                    onComplete: () => {
                        temp.setTexture('cards', cardFrame);

                        // --- ACTUALIZA EL LAYOUT AQUÍ ---
                        if (s.board && typeof s.board.updateDiscard === 'function') {
                            s.board.updateDiscard();
                        }

                        // Toma el tamaño real del discard tras el update
                        let finalW = discardW, finalH = discardH;
                        if (s.discard) {
                            finalW = s.discard.displayWidth;
                            finalH = s.discard.displayHeight;
                        }

                        // Segunda parte: giro (scaleX: 0 -> 1) y resize a tamaño real del discard
                        s.tweens.add({
                            targets: temp,
                            scaleX: 1,
                            duration: 180,
                            ease: 'Linear',
                            onUpdate: tween => {
                                // Interpola el tamaño desde el tamaño actual al final
                                const progress = tween.progress;
                                const w = Phaser.Math.Linear(temp.displayWidth, finalW, progress);
                                const h = Phaser.Math.Linear(temp.displayHeight, finalH, progress);
                                temp.setDisplaySize(w, h);
                            },
                            onComplete: () => {
                                // Rebote final para integración visual y efecto de brillo
                                s.tweens.add({
                                    targets: temp,
                                    scale: { from: 0.3, to: 0.4 },
                                    duration: 140,
                                    yoyo: true,
                                    onStart: () => {
                                        temp.setTint(0xffffcc);
                                    },
                                    onComplete: () => {
                                        temp.clearTint();
                                        setTimeout(() => {
                                            temp.destroy();
                                            if (s.discard) s.discard.setTexture('cards', cardFrame);
                                            if (onComplete) onComplete();
                                        }, 120);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
        return;
    }

    // Fallback: zoom sobre el discard (si no hay cartas rivales)
    if (useFallback && s.discard) {
        const originalScaleX = s.discard.scaleX;
        const originalScaleY = s.discard.scaleY;
        const zoomFactor = 1.08;
        s.tweens.add({
            targets: s.discard,
            scaleX: originalScaleX * zoomFactor,
            scaleY: originalScaleY * zoomFactor,
            duration: 220,
            yoyo: true,
            repeat: 1,
            onStart: () => s.discard.setTexture('cards', cardFrame),
            onComplete: () => {
                s.discard.setScale(originalScaleX, originalScaleY);
                if (onComplete) onComplete();
            }
        });
    } else if (onComplete) {
        onComplete();
    }
    if (s.board && typeof s.board.updateDiscard === 'function') {
    const angle = Phaser.Math.Between(-16, 16); // Ángulo aleatorio
    s.board.updateDiscard(angle);
}
}

    layout() {
        const s = this.scene;
        const d = s.debug;
        const { width } = s.scale;
        const { cardScale, cardOverlap, cardY, arrowMargin, arrowBaseGap, maxVisibleCards } = d;

        // ocultar todas las cartas primero
        s.cardSprites.forEach(spr => spr.setVisible(false));

        // slice de cartas visibles
        const visible = s.cardSprites.slice(
            s.handOffset,
            s.handOffset + maxVisibleCards
        );

        // 3) nuevo cálculo ABSOLUTO de inicio X
        let CW = 0, totalW = 0, startX = 0;
        if (visible.length) {
            // dimensiones nativas escaladas
            CW = visible[0].frame.width * cardScale;
            totalW = CW + (visible.length - 1) * cardOverlap;
            // ** centrar en la pantalla **
            startX = (width - totalW) / 2 + CW / 2;

            visible.forEach((spr, i) => {
                spr
                    .setDisplaySize(CW, CW * (spr.frame.height / spr.frame.width))
                    .setPosition(startX + i * cardOverlap, cardY)
                    .setVisible(true);
                spr._baseY = cardY; // <-- ACTUALIZA _baseY SIEMPRE
            });
        }

        // --- AÑADE ESTO PARA LA MANO RIVAL ---
        if (s.rivalSprites.length) {
        // Ajusta el overlap según el número de cartas rivales
        const minOverlap = 40; // mínimo solapamiento (más cartas = más solapadas)
        const maxOverlap = d.rivalOverlap; // valor base de overlap (pocas cartas)
        const n = s.rivalSprites.length;
        // Puedes ajustar el divisor para controlar la "compresión"
        const dynamicOverlap = Math.max(minOverlap, maxOverlap - (n - 5) * 8);

        const rW = s.rivalSprites[0].frame.width * d.rivalScale;
        const rH = s.rivalSprites[0].frame.height * d.rivalScale;
        const totalRW = rW + (n - 1) * dynamicOverlap;
        const rStartX = (width - totalRW) / 2 + rW / 2;

        [...s.rivalSprites].reverse().forEach((spr, i) => {
            spr
                .setDisplaySize(rW, rH)
                .setPosition(rStartX + i * dynamicOverlap, d.rivalY)
                .setVisible(true);
        });
    }
        // posicionar flechas
        if (s.arrowLeft && s.arrowRight) {
            s.arrowLeft
                .setPosition(startX - CW / 2 - arrowMargin - arrowBaseGap, cardY)
                .setAlpha(s.handOffset > 0 ? 1 : 0.3);

            s.arrowRight
                .setPosition(
                    startX + (visible.length - 1) * cardOverlap + CW / 2 + arrowMargin + arrowBaseGap,
                    cardY
                )
                .setAlpha(s.handOffset + maxVisibleCards < s.cardSprites.length ? 1 : 0.3);
        }
        // console.log('HandView layout startX:', startX, 'cardY:', cardY);


        if (s.arrowLeft && s.arrowRight) {
            if (visible.length) {
                // Centra las flechas en Y con las cartas
                s.arrowLeft
                    .setPosition(startX - CW / 2 - arrowMargin - arrowBaseGap, cardY)
                    .setAlpha(s.handOffset > 0 ? 1 : 0.3);

                s.arrowRight
                    .setPosition(
                        startX + (visible.length - 1) * cardOverlap + CW / 2 + arrowMargin + arrowBaseGap,
                        cardY
                    )
                    .setAlpha(s.handOffset + maxVisibleCards < s.cardSprites.length ? 1 : 0.3);
            } else {
                // Si no hay cartas, ponlas en el centro y transparentes
                s.arrowLeft.setPosition(width / 2 - 100, cardY).setAlpha(0.3);
                s.arrowRight.setPosition(width / 2 + 100, cardY).setAlpha(0.3);
            }
        }
    }

    enqueueDrawAnimation(cardFrame, by) {
        this.drawQueue.push({ cardFrame, by });
        if (!this.isDrawing) this._processDrawQueue();
    }

    _processDrawQueue() {
        if (this.drawQueue.length === 0) {
            this.isDrawing = false;
            this.scene.isAnimating = false;
            this.scene.input.enabled = true;
            return;
        }
        this.isDrawing = true;
        this.scene.isAnimating = true;
        this.scene.input.enabled = false;

        const { cardFrame, by } = this.drawQueue.shift();
        this.animateDrawCard(cardFrame, by, () => {
            this._processDrawQueue();
        });
    }

    // Modifica animateDrawCard para aceptar cardFrame y callback
    animateDrawCard(cardFrame, by, onComplete) {
    const s = this.scene;
    const d = s.debug;

    if (s.drawPileSprite) s.drawPileSprite.disableInteractive();

    // Sprite del reverso en el mazo
    const sprite = s.add.image(d.drawX, d.drawY, 'cards', 'Reverso_Carta.svg')
        .setOrigin(0.5)
        .setScale(d.drawScale)
        .setDepth(5000);

    // Primera parte de la animación: vuelo al centro
    s.tweens.add({
        targets: sprite,
        x: s.scale.width / 2,
        y: d.cardY - 200,
        duration: 700,
        ease: 'Cubic.easeOut',
        onComplete: () => {
            // Giro
            s.tweens.add({
                targets: sprite,
                scaleX: 0,
                duration: 200,
                ease: 'Linear',
                onComplete: () => {
                    sprite.setTexture('cards', cardFrame);

                    // --- ACTUALIZA EL LAYOUT AQUÍ ---
                    // Simula que la carta ya está en la mano y actualiza el layout
                    // (puedes forzar updateHandsAndLayout o layout aquí si es seguro)
                    if (s.handView && typeof s.handView.layout === 'function') {
                        s.handView.layout();
                    }

                    // Ahora toma el tamaño real de la última carta de la mano
                    let finalW, finalH;
                    if (s.cardSprites && s.cardSprites.length > 0) {
                        const last = s.cardSprites[s.cardSprites.length - 1];
                        finalW = last.displayWidth;
                        finalH = last.displayHeight;
                    } else {
                        // Fallback
                        const tex = s.textures.get('cards').get(cardFrame);
                        finalW = tex.width * d.cardScale;
                        finalH = tex.height * d.cardScale;
                    }

                    // Segunda parte de la animación: giro y resize a tamaño real
                    s.tweens.add({
                        targets: sprite,
                        scaleX: 0.6,
                        duration: 400,
                        ease: 'Linear',
                        onUpdate: tween => {
                            // Interpola el tamaño desde el tamaño actual al final
                            const progress = tween.progress;
                            const w = Phaser.Math.Linear(sprite.displayWidth, finalW, progress);
                            const h = Phaser.Math.Linear(sprite.displayHeight, finalH, progress);
                            sprite.setDisplaySize(w, h);
                        },
                        onComplete: () => {
                            // Vuelo final a la mano
                            s.tweens.add({
                                targets: sprite,
                                x: s.scale.width / 2,
                                y: d.cardY,
                                duration: 700,
                                ease: 'Cubic.easeIn',
                                onComplete: () => {
                                    sprite.destroy();
                                    if (s.drawPileSprite) s.drawPileSprite.setInteractive({ cursor: 'pointer' });
                                    if (onComplete) onComplete();
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

    setupLiftDrop(sprite, card, idx) {
        const s = this.scene;
        const d = s.debug;
        if (sprite._baseY == null) sprite._baseY = d.cardY;
        const { liftOffset, liftDuration } = d;

        if (!s.isTouch) {
            sprite.on('pointerover', () => {
                if (this.scene.isAnimating) return;
                s.tweens.killTweensOf(sprite, 'y');
                s.tweens.add({
                    targets: sprite,
                    y: sprite._baseY - liftOffset,
                    duration: liftDuration,
                    ease: 'Power1'
                });
            });

            sprite.on('pointerout', () => {
                if (this.scene.isAnimating) return;
                s.tweens.killTweensOf(sprite, 'y');
                s.tweens.add({
                    targets: sprite,
                    y: sprite._baseY,
                    duration: liftDuration,
                    ease: 'Power1'
                });
                // Rescate por si el shake quedó bloqueado
                if (sprite._isShaking) {
                    s.tweens.killTweensOf(sprite, 'x');
                    // Devuelve a la posición original en X e Y de forma suave
                    s.tweens.add({
                        targets: sprite,
                        x: sprite._shakeBaseX ?? sprite.x,
                        y: sprite._baseY,
                        duration: 180,
                        ease: 'Cubic.easeOut',
                        onComplete: () => {
                            sprite._isShaking = false;
                        }
                    });
                }
            });

            sprite.on('pointerup', () => {
                if (this.scene.isAnimating || sprite._isShaking) return;
                const pending = this.gameState.pendingPenalty;
                if (pending) {
                    const hand = this.gameState.localHand;
                    const canStack = hand.some(card2 => {
                        const c2 = this.gameState.parseCardFrame(card2.frame);
                        return (pending.type === '+2' && c2.type === '+2') ||
                            (pending.type === '+4' && c2.type === '+4');
                    });
                    const c = this.gameState.parseCardFrame(card.frame);

                    // Si tienes carta de penalización encadenable, pero también tienes otras jugables, permite elegir
                    if (canStack) {
                        // ¿Esta carta es jugable según las reglas normales?
                        const topDiscard = this.gameState.topDiscard;
                        if (!this.gameState.isCardPlayable(card, topDiscard)) {
                            this.shakeSprite(sprite);
                            return;
                        }
                        // Si la carta es jugable y NO es del tipo de penalización, permite jugarla
                        // Si la carta es del tipo de penalización, también permite (encadenar)
                        // Si la carta NO es jugable, shake
                    } else {
                        // Si no puedes encadenar, solo puedes jugar cartas válidas normales
                        const topDiscard = this.gameState.topDiscard;
                        if (!this.gameState.isCardPlayable(card, topDiscard)) {
                            this.shakeSprite(sprite);
                            return;
                        }
                    }
                    // Si llegas aquí, puedes jugar la carta
                    this.animateToDiscard(sprite, card, idx);
                    return;
                }
                // Validación normal
                const topDiscard = this.gameState.topDiscard;
                if (!this.gameState.isCardPlayable(card, topDiscard)) {
                    this.shakeSprite(sprite);
                    return;
                }
                this.animateToDiscard(sprite, card, idx);
            });
        }

        // Móvil: tap una vez lift, tap segunda vez drop
        if (s.isTouch) {
            let lifted = false;
            sprite.on('pointerdown', () => {
                if (this.scene.isAnimating || sprite._isShaking) return;
                s.tweens.killTweensOf(sprite, 'y');
                const targetY = lifted ? sprite._baseY : sprite._baseY - liftOffset;
                s.tweens.add({
                    targets: sprite,
                    y: targetY,
                    duration: liftDuration,
                    ease: 'Power1',
                    onComplete: () => {
                        if (lifted) {
                            const topDiscard = this.gameState.topDiscard;
                            if (!this.gameState.isCardPlayable(card, topDiscard)) {
                                this.shakeSprite(sprite);
                                return;
                            }
                            if (this.scene.isAnimating) return;
                            this.animateToDiscard(sprite, card, idx);
                        }
                        lifted = !lifted;
                    }
                });
            });
        }
    }

    shakeSprite(sprite) {
        const s = this.scene;
        if (sprite._shakeBaseX == null) sprite._shakeBaseX = sprite.x;
        // Si hay un shake a medias, resetea el flag y la posición X
        s.tweens.killTweensOf(sprite, 'x');
        sprite.setX(sprite._shakeBaseX);
        sprite._isShaking = false;

        // Bloquea input durante shake
        sprite._isShaking = true;

        s.tweens.add({
            targets: sprite,
            x: sprite._shakeBaseX + 10,
            duration: 65,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                sprite.setX(sprite._shakeBaseX);
                sprite._isShaking = false;
            }
        });
    }
    showHandModal() {
        const s = this.scene;
        // Si ya existe, no lo crees de nuevo
        if (s.handModal) return;

        // Fondo semitransparente
        const bg = s.add.rectangle(s.scale.width / 2, s.scale.height / 2, s.scale.width, s.scale.height, 0x000000, 0.7)
            .setDepth(5000)
            .setInteractive();

        // Container para las cartas
        const modal = s.add.container(s.scale.width / 2, s.scale.height / 2).setDepth(5001);

        // Título bonito
        const title = s.add.text(0, -380, '👁️ Ver mano', {
            fontFamily: 'Montserrat, Arial Black, Arial, sans-serif',
            fontSize: '38px',
            color: '#ffe066',
            stroke: '#000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);
modal.add(title);

        // Renderiza todas las cartas en grid
        const cards = this.gameState.localHand;
        const cols = s.isMobile ? 6 : 8;
        const size = s.isMobile ? 90 : 110;
        cards.forEach((card, i) => {
            const x = (i % cols) * (size + 10) - ((cols - 1) * (size + 10)) / 2;
            const y = Math.floor(i / cols) * (size + 20) - 300;
            const img = s.add.image(x, y, 'cards', card.frame)
                .setDisplaySize(size, size * 1.4)
                .setInteractive({ cursor: 'pointer' })
                .on('pointerup', () => {
                    if (!this.gameState.isLocalTurn(this.scene.playerId)) {
                        this.shakeSprite(img);
                        return;
                    }
                    if (this.scene.isAnimating || img._isShaking) return;
                    const pending = this.gameState.pendingPenalty;
                    if (pending) {
                        // ¿Tienes carta de penalización para encadenar?
                        const hand = this.gameState.localHand;
                        const hasPenaltyCard = hand.some(card2 => {
                            const c2 = this.gameState.parseCardFrame(card2.frame);
                            return (pending.type === '+2' && c2.type === '+2') ||
                                (pending.type === '+4' && c2.type === '+4');
                        });
                        const c = this.gameState.parseCardFrame(card.frame);
                        if (hasPenaltyCard) {
                            // Solo puedes encadenar
                            if (!((pending.type === '+2' && c.type === '+2') || (pending.type === '+4' && c.type === '+4'))) {
                                this.shakeSprite(img);
                                return;
                            }
                        }
                        // Si NO tienes carta de penalización, puedes jugar cualquier carta válida
                    }
                    // Validación normal
                    const topDiscard = this.gameState.topDiscard;
                    if (!this.gameState.isCardPlayable(card, topDiscard)) {
                        this.shakeSprite(img);
                        return;
                    }
                    this.animateToDiscard(img, card, i);
                    // Cierra el modal
                    setTimeout(() => {
                        bg.destroy();
                        modal.destroy();
                        s.handModal = null;
                        s.isAnimating = false;
                        s.input.enabled = true;
                    }, 1000);
                });
            // --- HOVER Y SHAKE ROBUSTOS EN MODAL ---
            if (!s.isTouch) {
                // Guardar baseY y baseX para cada carta del modal
                img._baseY = y;
                img._shakeBaseX = x;

                img.on('pointerover', () => {
                    s.tweens.killTweensOf(img, 'y');
                    s.tweens.add({
                        targets: img,
                        y: img._baseY - 30,
                        duration: 360,
                        ease: 'Power1'
                    });
                });

                img.on('pointerout', () => {
                    s.tweens.killTweensOf(img, 'y');
                    s.tweens.add({
                        targets: img,
                        y: img._baseY,
                        duration: 240,
                        ease: 'Power1'
                    });
                    // Rescate por si el shake quedó bloqueado
                    if (img._isShaking) {
                        s.tweens.killTweensOf(img, 'x');
                        // Devuelve a la posición original en X e Y de forma suave
                        s.tweens.add({
                            targets: img,
                            x: img._shakeBaseX ?? img.x,
                            y: img._baseY,
                            duration: 220,
                            ease: 'Cubic.easeOut',
                            onComplete: () => {
                                img._isShaking = false;
                            }
                        });
                    }
                });
            }
            modal.add(img);
        });

        // Cierra el modal al pulsar fuera
        bg.on('pointerup', () => {
            bg.destroy();
            modal.destroy();
            s.handModal = null;
        });

        s.handModal = modal;
    }
}