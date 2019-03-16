/**
 * This script only support flat case, no nesting. 😅
 * And only support px
 */
function createBrowserContext (id = 'app') {
  const canvas = document.createElement('canvas')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.getElementById(id).appendChild(canvas)
  return canvas.getContext('2d')
}

class InlineBlockLayout {
  constructor (ctx) {
    this.ctx = ctx
    this.width = ctx.canvas.width
    this.height = ctx.canvas.height
    this.rowBoxs = []
    this.original = []

    this.listenResize()
  }

  listenResize () {
    window.addEventListener('resize', () => {
      const canvas = this.ctx.canvas
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      this.width = canvas.width
      this.height = canvas.height
      this.rowBoxs = []
      for (let element of this.original) {
        this._addElement(element)
      }
      this.render()
    })
  }

  addElement (el) {
    this.original.push(el)
    this._addElement(el)
  }

  _addElement (el) {
    // if there is no row box, we should add one.
    if (this.rowBoxs.length === 0) {
      this.addRow()
    }
    let lastRowBox = this.rowBoxs[this.rowBoxs.length - 1]
    if (el.outerWidth > lastRowBox.spaceRemain) {
      lastRowBox = this.addRow()
    }

    lastRowBox.elements.push(el)
    lastRowBox.height = lastRowBox.elements.reduce((max, el) => {
      return Math.max(max, el.outerHeight)
    }, 0)
    lastRowBox.spaceRemain = lastRowBox.spaceRemain - el.outerWidth
  }

  // no nestings
  addRow () {
    const newRow = {
      height: 0,
      width: this.width,
      elements: [],
      spaceRemain: this.width
    }
    this.rowBoxs.push(newRow)
    return newRow
  }

  render () {
    let xStart = 0
    let yStart = 0
    for (let rowBox of this.rowBoxs) {
      for (let element of rowBox.elements) {
        this.renderElement(element, rowBox, xStart, yStart)
        xStart += element.outerWidth
      }
      xStart = 0
      yStart += rowBox.height
    }
    this.draw()
  }

  renderElement (element, rowBox, xStart, yStart) {
    let x = xStart
    let y = yStart
    x += element.marginLeft
    y += element.marginTop
    element.x = x
    element.y = y
  }

  draw () {
    for (let rowBox of this.rowBoxs) {
      for (let element of rowBox.elements) {
        this.ctx.fillStyle = element.borderColor || 'transparent'
        this.ctx.fillRect(element.x, element.y, element.ownWidth, element.ownHeight)
        this.ctx.fillStyle = element.backgroundColor || 'transparent'
        this.ctx.fillRect(element.x + element.borderWidth, element.y + element.borderWidth, element.innerWidth, element.innerHeight)
      }
    }
  }
}

class InlineBlockElement {
  constructor (style = {}) {
    ;({
      'width': this.width,
      'height': this.height,
      'box-sizing': this.boxSizing = 'content-box', // border-box padding-box content-box
      'border': this.border, // only support syntax like `?px solid ???`, just for easy implement 😂
      'padding': this.padding,
      'margin': this.margin,
      'background-color': this.backgroundColor
    } = style)

    this.standardization()
  }

  standardization () {
    this.parseSize()
    this.parseBorder()
    this.parsePadding()
    this.parseMargin()
    this.calcSize()
  }

  parseSize () {
    this.width = Number.parseFloat(this.width)
    this.height = Number.parseFloat(this.height)
  }

  parseBorder () {
    if (!this.border) {
      this.borderWidth = 0
    } else {
      const match = /^([\d.]+)px\ssolid\s(\w+)$/.exec(this.border)
      if (!match) throw new Error('Only support very limitted syntax, eg: ?px solid ???')
      this.borderWidth = +match[1]
      this.borderColor = match[2]
    }
  }

  parsePadding () {
    let match
    if (!this.padding) {
      this.paddingLeft = 0
      this.paddingRight = 0
      this.paddingTop = 0
      this.paddingBottom = 0
    } else if (match = /^(?:(\d+px|0))$/.exec(this.padding)) {
      this.paddingLeft = Number.parseFloat(match[1])
      this.paddingRight = Number.parseFloat(match[1])
      this.paddingTop = Number.parseFloat(match[1])
      this.paddingBottom = Number.parseFloat(match[1])
    } else if (match = /^(?:(\d+px|0))\s(?:(\d+px|0))$/.exec(this.padding)) {
      this.paddingLeft = Number.parseFloat(match[2])
      this.paddingRight = Number.parseFloat(match[2])
      this.paddingTop = Number.parseFloat(match[1])
      this.paddingBottom = Number.parseFloat(match[1])
    } else if (match = /^(?:(\d+px|0))\s(?:(\d+px|0))\s(?:(\d+px|0))$/.exec(this.padding)) {
      throw new Error('Not support because I forget the specific semantics')
    } else if (match = /^(?:(\d+px|0))\s(?:(\d+px|0))\s(?:(\d+px|0))\s(?:(\d+px|0))$/.exec(this.padding)) {
      this.paddingLeft = Number.parseFloat(match[4])
      this.paddingRight = Number.parseFloat(match[2])
      this.paddingTop = Number.parseFloat(match[1])
      this.paddingBottom = Number.parseFloat(match[3])
    } else {
      throw new Error('unknown CSS property value')
    }
  }

  parseMargin () {
    let match
    if (!this.margin) {
      this.marginLeft = 0
      this.marginRight = 0
      this.marginTop = 0
      this.marginBottom = 0
    } else if (match = /^(?:(-?[\d.]+px|0))$/.exec(this.margin)) {
      this.marginLeft = Number.parseFloat(match[1])
      this.marginRight = Number.parseFloat(match[1])
      this.marginTop = Number.parseFloat(match[1])
      this.marginBottom = Number.parseFloat(match[1])
    } else if (match = /^(?:(-?[\d.]+px|0))\s(?:(-?[\d.]+px|0))$/.exec(this.margin)) {
      this.marginLeft = Number.parseFloat(match[2])
      this.marginRight = Number.parseFloat(match[2])
      this.marginTop = Number.parseFloat(match[1])
      this.marginBottom = Number.parseFloat(match[1])
    } else if (match = /^(?:(-?[\d.]+px|0))\s(?:(-?[\d.]+px|0))\s(?:(-?[\d.]+px|0))$/.exec(this.margin)) {
      throw new Error('Not support because I forget the specific semantics')
    } else if (match = /^(?:(-?[\d.]+px|0))\s(?:(-?[\d.]+px|0))\s(?:(-?[\d.]+px|0))\s(?:(-?[\d.]+px|0))$/.exec(this.margin)) {
      this.marginLeft = Number.parseFloat(match[4])
      this.marginRight = Number.parseFloat(match[2])
      this.marginTop = Number.parseFloat(match[1])
      this.marginBottom = Number.parseFloat(match[3])
    } else {
      throw new Error('unknown CSS property value')
    }
  }

  calcSize () {
    switch (this.boxSizing) {
      case 'border-box':
        this.outerWidth = this.width + this.marginLeft + this.marginRight
        this.outerHeight = this.height + this.marginTop + this.marginBottom
        this.ownWidth = this.width
        this.ownHeight = this.height
        this.innerWidth = this.width - this.borderWidth * 2
        this.innerHeight = this.height - this.borderWidth * 2
        break
      case 'padding-box':
        this.outerWidth = this.width + this.borderWidth * 2 + this.marginLeft + this.marginRight
        this.outerHeight = this.height + this.borderWidth * 2 + this.marginTop + this.marginBottom
        this.ownWidth = this.width + this.borderWidth * 2
        this.ownHeight = this.height + this.borderWidth * 2
        this.innerWidth = this.width
        this.innerHeight = this.height
        break
      case 'content-box':
        this.outerWidth = this.width + this.paddingLeft + this.paddingRight + this.borderWidth * 2 + this.marginLeft + this.marginRight
        this.outerHeight = this.height + this.paddingTop + this.paddingBottom + this.borderWidth * 2 + this.marginTop + this.marginBottom
        this.ownWidth = this.width + this.paddingLeft + this.paddingRight + this.borderWidth * 2
        this.ownHeight = this.height + this.paddingTop + this.paddingBottom + this.borderWidth * 2
        this.innerWidth = this.width + this.paddingLeft + this.paddingRight
        this.innerHeight = this.height + this.paddingTop + this.paddingBottom
        break
      default: throw new Error('unknown CSS property value')
    }
  }
}

function test () {
  const ctx = createBrowserContext('app')
  const layout = new InlineBlockLayout(ctx)
  layout.addElement(new InlineBlockElement({
    'height': '100px',
    'width': '200px',
    'background-color': 'red'
  }))
  layout.addElement(new InlineBlockElement({
    'height': '200px',
    'width': '500px',
    'background-color': 'blue'
  }))
  layout.addElement(new InlineBlockElement({
    'height': '300px',
    'width': '700px',
    'background-color': 'purple'
  }))
  layout.addElement(new InlineBlockElement({
    'height': '400px',
    'width': '400px',
    'background-color': 'cyan',
    'margin': '0 150px 0 0'
  }))
  layout.addElement(new InlineBlockElement({
    'height': '200px',
    'width': '150px',
    'background-color': 'orange',
    'margin': '-20px 0 0 -120px',
    'border': '30px solid grey'
  }))
  layout.render()
  console.log(layout.rowBoxs)
}

test()
