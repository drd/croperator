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

        this.minSize = this.options.minSize;
        this.form = this.options.form ? $(this.options.form) : null;

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
        
        this.cropEnd.x = ev.client.x + window.getScrollLeft() - this.coords.left;
        this.cropEnd.y = ev.client.y + window.getScrollTop() - this.coords.top;
        
        this.drawCrop();
    },
    mouseDownHandler: function(ev) {
        this.coords = this.image.getCoordinates();
        
        var x = ev.client.x;
        var y = ev.client.y;

        if (x > this.coords.left && x < this.coords.right && y > this.coords.top && y < this.coords.bottom) {
            if(this.inCrop) {
                this.mouseUpHandler(ev)
            } else {
                x += window.getScrollLeft() - this.coords.left;
                y += window.getScrollTop() - this.coords.top;

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
        
        this.initializeCropDiv();
    },
    initializeCropDiv: function() {
        var x = this.cropStart.x, y = this.cropStart.y;
        
        if(this.cropDiv == null)
            this.createCropDiv();

        x = Util.clamp(x, 0, this.coords.width);
        y = Util.clamp(y, 0, this.coords.height);
        
        if ( x > this.coords.width - this.minSize )
            x -= (this.coords.width - x + this.minSize);

        if ( y > this.coords.width - this.minSize )
            y -= (this.coords.width - y + this.minSize);
        
        this.updateCoords({
            x1:     x,
            y1:     y,
            width:  this.minSize,
            height: this.minSize
        })
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
        x1 = this.cropStart.x < this.cropEnd.x ? this.cropStart.x : this.cropEnd.x;
        y1 = this.cropStart.y < this.cropEnd.y ? this.cropStart.y : this.cropEnd.y;
        
        x1 = Util.clamp(x1, 0, this.coords.width);
        y1 = Util.clamp(y1, 0, this.coords.height);

        x2 = this.cropStart.x > this.cropEnd.x ? this.cropStart.x : this.cropEnd.x;
        y2 = this.cropStart.y > this.cropEnd.y ? this.cropStart.y : this.cropEnd.y;
        
        x2 = Util.clamp(x2, 0, this.coords.width);
        y2 = Util.clamp(y2, 0, this.coords.height);

        // width  = Util.clamp(Math.abs(x1 - x2), this.minSize, this.coords.width - x1 - 2);
        // height = Util.clamp(Math.abs(y1 - y2), this.minSize, this.coords.height - y1 - 2);
        // 
        // if (this.coords.width - x1 > this.minSize) {
        //     x2 = x1;
        //     x1 = x2 - this.minSize;
        // } else {
        //     x2 = x1 + width;
        // }
        // 
        // 
        // if (this.coords.height - y1 > this.minSize) {
        //     y2 = y1;
        //     y1 = y2 - this.minSize;
        // } else {
        //     y2 = y2 + height;
        // }
        
        width = Math.abs(x1 - x2);
        height = Math.abs(y1 - y2);
        
        this.updateCoords({
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            width: width,
            height: height
        });

        
        this.updateForm();
    },
    updateCoords: function(coords) {
        this.cropCoords = this.cropCoords.merge(coords);
        
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