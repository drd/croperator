Util = {
    clamp: function(val, min, max) {
        return Math.max(min, Math.min(max, val))
    }
}

var Croperator = new Class({
    options: {
        form: null,
        ratio: null,
        matting: null,
        minSize: 50
    },
    initialize: function(img, options) {
        this.setOptions(options);

        this.form = this.options.form ? $(this.options.form) : null;
        
        this.minSizeX = this.minSize = this.options.minSize;
        if(this.options.ratio) {
            this.ratio = this.options.ratio.y / this.options.ratio.x;
            this.minSizeY = this.minSize * this.ratio;
        } else {
            this.minSizeY = this.minSizeX;
        }
        
        this.inCrop = false;

        this.cropStart = [];
        this.cropEnd = [];
        this.cropCoords = new Hash();

        this.cropDiv = null;
        
        this.image = $(img);
        
        $(document.body).addEvent('mousedown', this.mouseDownHandler.bindWithEvent(this));
    },
    mouseMoveHandler: function(ev) {
        if(!this.inCrop) return;
        
        this.cropEnd.x = Util.clamp(ev.client.x + window.getScrollLeft() - this.coords.left, 0, this.coords.width);
        this.cropEnd.y = Util.clamp(ev.client.y + window.getScrollTop() - this.coords.top, 0, this.coords.height);
        
        this.drawCrop();
    },
    mouseDownHandler: function(ev) {
        this.coords = this.image.getCoordinates();
        
        var x = ev.client.x + window.getScrollLeft();
        var y = ev.client.y + window.getScrollTop();

        if (x > this.coords.left && x < this.coords.right && y > this.coords.top && y < this.coords.bottom) {
            if(this.inCrop) {
                this.mouseUpHandler(ev)
            } else {
                x -= this.coords.left;
                y -= this.coords.top;

                this.initCrop(x, y);
                $(document.body).addEvent('mousemove', this.mouseMoveHandler.bindWithEvent(this));
                $(document.body).addEvent('mouseup',   this.mouseUpHandler.bindWithEvent(this));
                new Event(ev).stop();
            }
        }
    },
    initCrop: function(x, y) {
        this.inCrop = true;
        
        this.cropStart.x = x;
        this.cropStart.y = y;
        
        this.cropEnd.x = x;
        this.cropEnd.y = y;
        
        this.initializeCropDiv();
    },
    initializeCropDiv: function() {
        if(this.cropDiv == null)
            this.createCropDiv();

        this.drawCrop();
    },
    createCropDiv: function() {
        this.cropDiv = new CropDiv(this);
    },
    mouseUpHandler: function(ev) {
        if(!this.inCrop) return;
        
        this.inCrop = false;
        
        $(document.body).removeEvent('mousemove');
        $(document.body).removeEvent('mouseup');

        this.cropStart = [];
        this.cropEnd = [];
    },
    drawCrop: function() {
        var adjustMinX = false, adjustMinY = false;
        
        if (Math.abs(this.cropStart.x - this.cropEnd.x) < this.minSizeX) {
            adjustMinX = true
        }

        if (Math.abs(this.cropStart.y - this.cropEnd.y) < this.minSizeY) {
            adjustMinY = true
        }

        if (this.cropEnd.x >= this.cropStart.x) {
            // quadrant 1 or 4
            
            if (adjustMinX) {
                this.cropEnd.x = this.cropStart.x + this.minSizeX;
            }
            
            if (this.cropStart.x > this.coords.width - this.minSizeX) {
                x1 = this.coords.width - this.minSizeX;
                x2 = this.coords.width;
            } else if (this.cropEnd.x < this.minSizeX) {
                x1 = 0;
                x2 = this.minSizeX;
            } else {
                x1 = this.cropStart.x;
                x2 = this.cropEnd.x;
            }
        } else {
            // quadrant 2 or 3
            
            if (adjustMinX) {
                this.cropEnd.x = this.cropStart.x - this.minSizeX;
            }

            if (this.cropEnd.x > this.coords.width - this.minSizeX) {
                x1 = this.coords.width - this.minSizeX;
                x2 = this.coords.width;
            } else if (this.cropStart.x < this.minSizeX) {
                x1 = 0;
                x2 = this.minSizeX;
            } else {
                x1 = this.cropEnd.x;
                x2 = this.cropStart.x;
            }
        }

        if (this.cropEnd.y >= this.cropStart.y) {
            // quadrant 1 or 2
            
            if (adjustMinY) {
                this.cropEnd.y = this.cropStart.y + this.minSizeY;
            }

            // quadrant 2
            if (this.cropStart.y > this.coords.height - this.minSizeY) {
                y1 = this.coords.height - Math.floor(this.minSizeY);
                y2 = this.coords.height;
            } else if (this.cropEnd.y < this.minSizeY) {
                y1 = 0;
                y2 = this.minSizeY;
            } else {
                y1 = this.cropStart.y;
                y2 = this.cropEnd.y;
            } 
        } else {
            // quadrant 3 or 4
            
            if (adjustMinY) {
                this.cropEnd.y = this.cropStart.y - this.minSizeY;
            }
            
            // quadrant 3
            if (this.cropEnd.y > this.coords.height - this.minSizeY) {
                y1 = this.coords.height - Math.floor(this.minSizeY);
                y2 = this.coords.height;
            } else if (this.cropStart.y < this.minSizeY) {
                y1 = 0;
                y2 = this.minSizeY;
            } else {
                y1 = this.cropEnd.y;
                y2 = this.cropStart.y;
            } 
        }
        
        width = x2 - x1;
        height = y2 - y1;
                
        this.updateCoords({
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            width: width,
            height: height
        });
    },
    updateCoords: function(coords) {
        this.cropCoords = this.cropCoords.merge(coords);
        this.updateForm();
        
        console.log("coords: " + this.cropCoords.values().join(' '));
        
        this.cropDiv.update(this.cropCoords);
    },
    updateForm: function() {
        this.form.x1.value =     this.cropCoords.get('x1');
        this.form.y1.value =     this.cropCoords.get('y1');
        this.form.x2.value =     this.cropCoords.get('x2');
        this.form.y2.value =     this.cropCoords.get('y2');
        this.form.width.value =  this.cropCoords.get('width');
        this.form.height.value = this.cropCoords.get('height');
    }
});

Croperator.implement(new Options);

var CropDiv = new Class({
    initialize: function(croperator) {
        this.croperator = croperator;
        this.inDrag = false;
        
        this.div = new Element('div', {
            styles: {
                border: '1px dashed #ccc',
                position: 'absolute',
                'z-index': 100
            }
        });
        
        this.div.injectBefore(this.croperator.image);
        $(this.div.parentNode).setStyle('position', 'relative');
        
        this.div.addEvent('mousedown', this.mouseDownHandler.bindWithEvent(this));
        $(document.body).addEvent('mousemove', this.mouseMoveHandler.bindWithEvent(this));
        $(document.body).addEvent('mouseup', this.mouseUpHandler.bindWithEvent(this));
    },
    update: function(coords) {
        this.x = coords.get('x1'); 
        this.y = coords.get('y1');
        
        this.width = coords.get('width');
        this.height = coords.get('height');

        this.div.setStyles({
            left:   this.x,
            top:    this.y,
            width:  this.width - 2,
            height: this.height - 2
        });
    },
    mouseDownHandler: function(ev) {
        this.inDrag = true;
        
        this.preDrag = [];
        this.dragStart = [];
        this.dragEnd = [];
        this.delta = [];
        this.clamp = {x: [], y: []};

        this.preDrag.x = this.x;
        this.preDrag.y = this.y;
        
        this.clamp.x.min = -this.preDrag.x;
        this.clamp.x.max = this.croperator.coords.width - this.preDrag.x - this.width;

        this.clamp.y.min = -this.preDrag.y;
        this.clamp.y.max = this.croperator.coords.height - this.preDrag.y - this.height;
        
        this.dragStart.x = ev.client.x;
        this.dragStart.y = ev.client.y;
        
        new Event(ev).stop();
    },
    mouseMoveHandler: function(ev) {        
        if (!this.inDrag) return;

        this.dragEnd.x = ev.client.x;
        this.dragEnd.y = ev.client.y;
        
        this.delta.x = Util.clamp(this.dragEnd.x - this.dragStart.x, this.clamp.x.min, this.clamp.x.max);
        this.delta.y = Util.clamp(this.dragEnd.y - this.dragStart.y, this.clamp.y.min, this.clamp.y.max);

        this.croperator.updateCoords({
            x1: this.preDrag.x + this.delta.x,
            y1: this.preDrag.y + this.delta.y,
            width: this.width,
            height: this.height
        })
        
        new Event(ev).stop();
        
    },
    mouseUpHandler: function(ev) {
        this.inDrag = false;
        new Event(ev).stop();
    }
})