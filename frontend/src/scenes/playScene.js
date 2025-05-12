// src/scenes/PlayScene.js
import Phaser from 'phaser'
import GUI from 'lil-gui'

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' })
  }

  init(data) {
    // Recibimos payload desde GameCanvas
    this.code         = data.code
    this.players      = data.players
    this.gameSettings = data.gameSettings
    console.log('[PlayScene] init con datos:', data)
  }

  preload() {
    // Carga del atlas de cartas
    this.load.multiatlas('cards', '/assests/cards/Card.json', '/assests/cards/')
  }

  create() {
    // 1️⃣ Sanity-check de frames
    const frames = this.textures.get('cards').getFrameNames()
    console.log('[PlayScene] Frames disponibles en atlas:', frames)

    // 2️⃣ Validamos que haya jugadores
    if (!Array.isArray(this.players) || this.players.length === 0) {
      console.error('[PlayScene] No hay jugadores para iniciar la partida')
      return
    }

    // 3️⃣ Texto informativo centrado
    this.add
      .text(this.scale.width/2, 30, 'Fase de Juego', { fontSize: '32px', color: '#fff' })
      .setOrigin(0.5)
    this.add
      .text(this.scale.width/2, 60,
        `Mano inicial: ${this.gameSettings.initialHandSize}`,
        { fontSize: '18px', color: '#ddd' }
      ).setOrigin(0.5)

    // 4️⃣ Creamos y barajamos deck
    const deck = createDeck(this.gameSettings.enableSpecialCards)
    Phaser.Utils.Array.Shuffle(deck)
    console.log('[PlayScene] Deck barajado:', deck.map(c=>c.frame))

    // 5️⃣ Reparto de manos
    this.hands = {}
    this.players.forEach(p => {
      this.hands[p.username] = deck.splice(0, this.gameSettings.initialHandSize)
      console.log(`[PlayScene] Mano de ${p.username}:`, this.hands[p.username].map(c=>c.frame))
    })

    // 6️⃣ Parámetros editables por GUI
    this.debug = {
      // Mano jugador
      cardY      : this.scale.height - 150,  // ← aquí puedes ajustar vía GUI
      spacing    :  80,                     // ← aquí puedes ajustar vía GUI
      cardScale  :  0.6,                    // ← aquí puedes ajustar vía GUI
      // Pila de descarte
      discardX   :  this.scale.width/2,     // ← aquí puedes ajustar vía GUI
      discardY   :  this.scale.height/2,    // ← aquí puedes ajustar vía GUI
      discardScale: 1,                      // ← aquí puedes ajustar vía GUI
      // Mazo para robar
      drawPileX  :  this.scale.width/2 + 120,// ← aquí puedes ajustar vía GUI
      drawPileY  :  this.scale.height/2,     // ← aquí puedes ajustar vía GUI
      drawScale  : 1                        // ← aquí puedes ajustar vía GUI
    }

    // 7️⃣ Sprites de mano
    this.cardSprites = []
    const myHand = this.hands[this.players[0].username]
    myHand.forEach((card, idx) => {
      const img = this.add.image(0,0,'cards',card.frame)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => this.handlePlayCard(card, idx))
      this.cardSprites.push(img)
    })

    // 8️⃣ Pila de descarte y mazo
    const firstDiscard = deck.shift()
    this.discard = this.add.image(0,0,'cards', firstDiscard.frame)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false })
      .on('pointerup', () => {}) // deshabilitado
    console.log('[PlayScene] Carta inicial en mesa:', firstDiscard.frame)

    this.drawPile = this.add.image(0,0,'cards','back')
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.handleDrawCard())
    console.log('[PlayScene] Sprite de mazo creado')

    // 9️⃣ Layout function
    const applyLayout = () => {
      // 🃏 Mano
      const CW = this.cardSprites[0].width * this.debug.cardScale
      const CH = this.cardSprites[0].height * this.debug.cardScale
      const totalW = this.cardSprites.length * CW + (this.cardSprites.length - 1) * this.debug.spacing
      const startX = (this.scale.width - totalW)/2 + CW/2

      this.cardSprites.forEach((s,i) => {
        s
          .setDisplaySize(CW, CH)
          .setPosition(startX + i*(CW+this.debug.spacing), this.debug.cardY)
      })

      // 🗑️ Descarte
      this.discard
        .setDisplaySize(
          this.discard.width * this.debug.discardScale,
          this.discard.height * this.debug.discardScale
        )
        .setPosition(this.debug.discardX, this.debug.discardY)

      // 📦 Mazo
      this.drawPile
        .setDisplaySize(
          this.drawPile.width * this.debug.drawScale,
          this.drawPile.height * this.debug.drawScale
        )
        .setPosition(this.debug.drawPileX, this.debug.drawPileY)
    }
    applyLayout()

    // 🔟 Configuración de GUI
    const gui = new GUI()
    const fMano    = gui.addFolder('🃏 Mano')
    fMano.add(this.debug,'cardY',   0, this.scale.height).name('Y mano').onChange(applyLayout)
    fMano.add(this.debug,'spacing', 0, this.scale.width).name('Espacio cartes').onChange(applyLayout)
    fMano.add(this.debug,'cardScale',0.2,2).name('Escala cartas').onChange(applyLayout)

    const fMesa    = gui.addFolder('🗑️ Descarte')
    fMesa.add(this.debug,'discardX', 0, this.scale.width).name('X descarte').onChange(applyLayout)
    fMesa.add(this.debug,'discardY', 0, this.scale.height).name('Y descarte').onChange(applyLayout)
    fMesa.add(this.debug,'discardScale',0.2,2).name('Escala descarte').onChange(applyLayout)

    const fMazo    = gui.addFolder('📦 Mazo')
    fMazo.add(this.debug,'drawPileX',0, this.scale.width).name('X mazo').onChange(applyLayout)
    fMazo.add(this.debug,'drawPileY',0, this.scale.height).name('Y mazo').onChange(applyLayout)
    fMazo.add(this.debug,'drawScale',0.2,2).name('Escala mazo').onChange(applyLayout)

    gui.open()
  }

  // ——————————————————————————————————————————————————————————
  handlePlayCard(card, idx) {
    console.log(`[PlayScene] ${this.players[0].username} Lanza carta:`, card.frame)
    // TODO: Reemplazar lógica simple por paso de turno, validaciones UNO, etc.
    // (FASE 2)
  }

  handleDrawCard() {
    console.log(`[PlayScene] ${this.players[0].username} Roba carta`)
    // TODO: Extraer carta del drawPile → añadir a this.cardSprites & this.hands
    // (FASE 2)
  }
}

// — Utility para crear el mazo según configuración UNO básica
function createDeck(enableSpecial) {
  const colors = ['Rojo','Amarillo','Verde','Azul']
  const values = ['0','1','2','3','4','5','6','7','8','9']
  const deck = []

  colors.forEach(color => {
    values.forEach(val => {
      deck.push({ frame:`${color}_${val}` })
      if (val!=='0') deck.push({ frame:`${color}_${val}.svg` })
    })
    if (enableSpecial) {
      ['skip','reverse','draw2'].forEach(sp => {
        deck.push({ frame:`${color}_${sp}` }, { frame:`${color}_${sp}` })
      })
    }
  })
  if (enableSpecial) {
    for (let i=0;i<4;i++){
      deck.push({ frame:'wild' },{ frame:'wild_draw4' })
    }
  }
  return deck
}
